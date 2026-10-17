import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { listIndexedChunks, OllamaEmbedder, RulesIndex, Spinner } from "@dnd/knowledge";
import { answerQuestion } from "../answering/answerQuestion";
import { loadSettings } from "../config";
import { formatEvalReport } from "../evaluation/report";
import { missingSections, parseQuestions } from "../evaluation/questions";
import { compareRuns, runEvaluation, sameQuestions, summarize, type EvalRun } from "../evaluation/runEvaluation";
import { getChatModel } from "../llm/provider";
import { explainModelError } from "./errors";

/** The same temperature as the ask command, so the evaluation measures what players get. */
const ANSWER_TEMPERATURE = 0.1;
const QUESTIONS_FILE = path.resolve(import.meta.dirname, "../../../../eval/rules-questions.json");
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

const spinner = new Spinner();
process.on("SIGINT", () => {
  spinner.stop();
  process.exit(130);
});

/**
 * Runs the rules evaluation: every question in eval/rules-questions.json through the answering workflow.
 *   --only id1,id2   run only these questions
 * Saves the run in data/eval/runs, compares it with the previous one, and writes a report to review.
 */
async function main() {
  const settings = loadSettings();
  const dataDir = path.dirname(settings.indexDir);
  const runsDir = path.join(dataDir, "eval", "runs");
  const reportsDir = path.join(dataDir, "reports");

  // --only id1,id2: the value is the argument right after the option.
  const onlyAt = process.argv.indexOf("--only");
  const only = onlyAt >= 0 ? new Set((process.argv[onlyAt + 1] ?? "").split(",").map((id) => id.trim()).filter(Boolean)) : undefined;
  const all = parseQuestions(await readFile(QUESTIONS_FILE, "utf8"));
  const questions = only ? all.filter((q) => only.has(q.id)) : all;
  if (questions.length === 0) throw new Error(`No questions to run${only ? ` matching --only ${[...only].join(",")}` : ""}.`);

  // Expected sections must be real headings, or a typo would look like a retrieval failure.
  const missing = missingSections(questions, await listIndexedChunks(settings.indexDir));
  if (missing.length) {
    console.log("These expected sections don't match any heading in the books; fix their titles in eval/rules-questions.json:");
    for (const m of missing) console.log(`  ${m.id}: ${m.book} "${m.section}"`);
    console.log("");
  }

  const index = await RulesIndex.open(settings.indexDir, new OllamaEmbedder({ model: settings.embeddingModel, host: settings.ollamaHost }));
  const model = getChatModel(settings, { temperature: ANSWER_TEMPERATURE });
  const budget = { contextTokens: settings.contextTokens, answerTokens: settings.answerTokens };

  let current = "";
  let questionStart = performance.now();
  const runStart = performance.now();
  spinner.start(() => `${current} · ${seconds(performance.now() - questionStart)} · total ${seconds(performance.now() - runStart)}`);
  const run = await runEvaluation(questions, (q) => answerQuestion(q.question, { index, model, budget }), {
    model: settings.llmModel,
    onQuestion: (q, i, total) => {
      current = `Question ${i + 1} of ${total}: ${q.id}`;
      questionStart = performance.now();
    },
  });
  spinner.stop();

  const previous = await latestComparableRun(runsDir, run);
  const stamp = run.startedAt.slice(0, 19).replace(/:/g, "-");
  await mkdir(runsDir, { recursive: true });
  await mkdir(reportsDir, { recursive: true });
  await writeFile(path.join(runsDir, `${stamp}.json`), JSON.stringify(run, null, 2), "utf8");
  const reportPath = path.join(reportsDir, `eval-${stamp}.md`);
  await writeFile(reportPath, formatEvalReport(run, previous && summarize(previous)), "utf8");

  const s = summarize(run);
  console.log(`${run.results.length} questions in ${seconds(performance.now() - runStart)}${only ? " (subset)" : ""}`);
  console.log(`  Retrieval, all expected sections: ${s.retrievalAll} of ${s.rules} (some ${s.retrievalSome}, none ${s.retrievalNone})`);
  console.log(`  Answers citing an expected section: ${s.grounded} of ${s.rules}`);
  console.log(`  Traps declined: ${s.trapsPassed} of ${s.traps}`);
  if (s.errors) console.log(`  Errors: ${s.errors}`);
  console.log(`  Average answer time: ${seconds(s.averageAnswerMs)}`);
  if (previous) {
    console.log(`Compared with the previous run of the same questions (${previous.startedAt.slice(0, 16).replace("T", " ")}):`);
    for (const line of compareRuns(s, summarize(previous))) console.log(`  ${line}`);
  } else {
    console.log("No previous run of the same questions to compare with.");
  }
  console.log(`\nReport to review: ${path.relative(process.cwd(), reportPath)}`);
}

/**
 * The most recent saved run with exactly the same questions, if any: comparing a subset with a full run
 * would show changes that are only differences in the questions. File names start with the date.
 */
async function latestComparableRun(dir: string, current: EvalRun): Promise<EvalRun | undefined> {
  const files = (await readdir(dir).catch(() => [] as string[])).filter((f) => f.endsWith(".json")).sort().reverse();
  for (const file of files) {
    const run = JSON.parse(await readFile(path.join(dir, file), "utf8")) as EvalRun;
    if (sameQuestions(run, current)) return run;
  }
  return undefined;
}

main().catch((error) => {
  spinner.stop();
  console.error(explainModelError(error));
  process.exit(1);
});