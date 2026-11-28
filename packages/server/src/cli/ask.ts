import { OllamaEmbedder, RulesIndex, Spinner } from "@dnd/knowledge";
import { answerQuestion, type AnswerResult } from "../answering/answerQuestion";
import { sourceHeading } from "../answering/sources";
import { loadSettings } from "../config";
import { getChatModel } from "../llm/provider";
import { explainModelError } from "./errors";

const USAGE = 'Usage: pnpm --filter @dnd/server ask "your question, in English"';
/** Rules answers should stick to the sources, so the model gets little room to vary. */
const ANSWER_TEMPERATURE = 0.1;
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

const spinner = new Spinner();
process.on("SIGINT", () => {
  spinner.stop();
  process.exit(130);
});

/** Asks a rules question and prints the answer, its sources, any warnings, and measurements. */
async function main() {
  const question = process.argv.slice(2).join(" ").trim();
  if (!question) throw new Error(USAGE);

  const settings = loadSettings();
  const index = await RulesIndex.open(settings.indexDir, new OllamaEmbedder({ model: settings.embeddingModel, host: settings.ollamaHost }));
  // Answers summarize given passages: thinking adds time without helping.
  const model = getChatModel(settings, { temperature: ANSWER_TEMPERATURE, thinking: false });

  let stage = "Searching the books";
  let stageStart = performance.now();
  spinner.start(() => `${stage} · ${seconds(performance.now() - stageStart)}`);
  const result = await answerQuestion(question, {
    index,
    model,
    budget: { contextTokens: settings.contextTokens, answerTokens: settings.answerTokens },
    onStage: (s) => {
      stage = s === "searching" ? "Searching the books" : s === "checking" ? "Checking the answer against the sources" : `Waiting for ${settings.llmModel}`;
      stageStart = performance.now();
    },
  });
  spinner.stop();
  print(result);
}

function print(result: AnswerResult) {
  console.log(`\n${result.answer}\n`);
  // A refusal (question not in English) or no sources found: nothing more to show.
  if (result.notEnglish || result.sources.length === 0) return;

  console.log("Sources (✓ = cited in the answer):");
  for (const source of result.sources) {
    console.log(`  ${result.cited.includes(source.number) ? "✓" : " "} ${sourceHeading(source)}`);
    for (const note of source.notes) console.log(`      ⚠ Converter note: ${note}`);
  }

  const warnings: string[] = [];
  for (const n of result.checks.unknownCitations) warnings.push(`The answer cites [${n}], which is not one of the sources.`);
  if (result.checks.uncited) warnings.push("The answer cites no sources: either the books don't cover the question, or the answer isn't based on them.");
  if (result.usageWarning) warnings.push(result.usageWarning);
  if (warnings.length) {
    console.log("\nWarnings:");
    for (const warning of warnings) console.log(`  ⚠ ${warning}`);
  }

  // The check of the answer (step 1.9), in detail: what it removed and why, so a wrong removal can be spotted.
  const v = result.verification;
  if (v) {
    const outcome = v.checkFailed ? "its reply couldn't be read, so the answer was kept as it was" : v.removed.length ? `${v.removed.length} removed` : v.revised ? "revised, then supported" : "every sentence supported";
    console.log(`\nCheck against the sources: ${outcome}${v.revised ? " (after one revision)" : ""}.`);
    // What the first check flagged, even when the revision fixed it, so a catch (or a false alarm) can be seen.
    for (const f of v.flagged) console.log(`  ! Flagged by the first check: ${f.sentence}\n      Reason: ${f.reason}`);
    for (const r of v.removed) console.log(`  ✗ Removed: ${r.sentence}\n      Reason: ${r.reason}`);
  }

  // Measurements: the real characters per token calibrates the pessimistic estimate in contextWindow.ts.
  const { promptChars, estimated, reported } = result.tokens;
  const perToken = reported ? `, ${reported} read by the model (${(promptChars / reported).toFixed(1)} characters per token)` : "";
  console.log(
    `\nSearch ${seconds(result.timings.retrievalMs)} · answer ${seconds(result.timings.modelMs)} · ` +
      (v ? `check ${seconds(v.ms)}, ${v.calls} call${v.calls === 1 ? "" : "s"}, ${v.inputTokens} read, ${v.outputTokens} written · ` : "") +
      `prompt ${promptChars} characters, about ${estimated} tokens estimated${perToken}`,
  );
}

main().catch((error) => {
  spinner.stop();
  const settings = (() => {
    try {
      return loadSettings();
    } catch {
      return undefined;
    }
  })();
  console.error(explainModelError(error, settings?.llmModel));
  process.exit(1);
});