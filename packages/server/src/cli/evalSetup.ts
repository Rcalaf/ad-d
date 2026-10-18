import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { OllamaEmbedder, RulesIndex, Spinner } from "@dnd/knowledge";
import { createSetupAgent } from "../agents/setup/agent";
import { loadSettings } from "../config";
import { CHECK_NAMES, formatSetupReport, parseScenarios, runSetupScenario, summarizeSetupRuns, type ScenarioRun } from "../evaluation/setupEval";
import { explainModelError } from "./errors";

const SCENARIOS_FILE = path.resolve(import.meta.dirname, "../../../../eval/setup-scenarios.json");
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const spinner = new Spinner();
process.on("SIGINT", () => {
  spinner.stop();
  process.exit(130);
});

/**
 * Plays the setup scenarios in eval/setup-scenarios.json against the real model, several times each,
 * and checks each conversation automatically. Creation is only requested: nothing is written to the games database.
 *   --runs N         conversations per scenario (default 3)
 *   --only id1,id2   run only these scenarios
 */
async function main() {
  const argAfter = (option: string) => {
    const at = process.argv.indexOf(option);
    return at >= 0 ? process.argv[at + 1] : undefined;
  };
  const runs = Number(argAfter("--runs") ?? 3);
  if (!Number.isInteger(runs) || runs < 1) throw new Error("--runs needs a whole number, at least 1.");
  const only = argAfter("--only")?.split(",").map((s) => s.trim());

  const settings = loadSettings();
  const scenarios = parseScenarios(await readFile(SCENARIOS_FILE, "utf8")).filter((s) => !only || only.includes(s.id));
  if (scenarios.length === 0) throw new Error("No scenarios to run.");
  const index = await RulesIndex.open(settings.indexDir, new OllamaEmbedder({ model: settings.embeddingModel, host: settings.ollamaHost }));

  const results: ScenarioRun[] = [];
  const start = performance.now();
  let status = "";
  spinner.start(() => `${status} · total ${seconds(performance.now() - start)}`);
  for (const scenario of scenarios) {
    for (let run = 1; run <= runs; run++) {
      // A fresh agent for every conversation: nothing carries over between runs.
      const agent = createSetupAgent(settings, index);
      const result = await runSetupScenario(scenario, agent, run, (turn, total) => {
        status = `${scenario.id}, run ${run} of ${runs}, turn ${turn} of ${total}`;
      });
      results.push(result);
      const failed = CHECK_NAMES.filter((c) => !result.checks[c]);
      spinner.log(`${scenario.id}, run ${run}: ${failed.length ? `failed ${failed.join(", ")}` : "all checks passed"}`);
    }
  }
  spinner.stop();

  const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const dataDir = path.dirname(settings.indexDir);
  const runsDir = path.join(dataDir, "eval", "setup-runs");
  const reportsDir = path.join(dataDir, "reports");
  await mkdir(runsDir, { recursive: true });
  await mkdir(reportsDir, { recursive: true });
  await writeFile(path.join(runsDir, `${stamp}.json`), JSON.stringify(results, null, 2), "utf8");
  const reportPath = path.join(reportsDir, `eval-setup-${stamp}.md`);
  await writeFile(reportPath, formatSetupReport(results, settings.llmModel), "utf8");

  const summary = summarizeSetupRuns(results);
  console.log(`\n${results.length} conversations in ${seconds(performance.now() - start)}, model ${settings.llmModel}:`);
  for (const [id, entry] of Object.entries(summary)) {
    console.log(`  ${id}: ${CHECK_NAMES.map((c) => `${c} ${entry.passed[c]}/${entry.runs}`).join(", ")}`);
  }
  console.log(`\nReport with every conversation: ${path.relative(process.cwd(), reportPath)}`);
}

main().catch((error) => {
  spinner.stop();
  console.error(explainModelError(error));
  process.exit(1);
});