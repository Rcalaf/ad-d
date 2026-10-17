import { sourceHeading } from "../answering/sources";
import { compareRuns, summarize, type EvalRun, type EvalSummary } from "./runEvaluation";

/**
 * The evaluation report: a summary, the comparison with the previous run, then each question with its
 * expected answer, the answer, the sources and an empty verdict for the person reviewing it.
 */
export function formatEvalReport(run: EvalRun, previous: EvalSummary | undefined): string {
  const s = summarize(run);
  const out = [
    `# Rules evaluation`,
    ``,
    `${run.startedAt.slice(0, 16).replace("T", " ")} · model ${run.model} · ${run.results.length} questions`,
    ``,
    `| Measure | Result |`,
    `| --- | --- |`,
    `| Retrieval: all expected sections found | ${s.retrievalAll} of ${s.rules} |`,
    `| Retrieval: some | ${s.retrievalSome} |`,
    `| Retrieval: none | ${s.retrievalNone} |`,
    `| Answers citing an expected section | ${s.grounded} of ${s.rules} |`,
    `| Traps declined | ${s.trapsPassed} of ${s.traps} |`,
    `| Errors | ${s.errors} |`,
    `| Average answer time | ${(s.averageAnswerMs / 1000).toFixed(1)} s |`,
    ``,
  ];
  if (previous) out.push(`Compared with the previous run:`, ``, ...compareRuns(s, previous).map((l) => `- ${l}`), ``);
  out.push(
    `Code checks retrieval and citations, not whether the content is right: that is the verdict under each answer.`,
    `Questions marked draft have an expected answer not yet checked against the books.`,
    ``,
  );

  for (const [i, r] of run.results.entries()) {
    out.push(`## ${i + 1}. ${r.id} (${r.kind}, ${r.status})`, ``, `**Question:** ${r.question}`, ``, `**Expected:** ${r.expected}`, ``);
    if (r.error) {
      out.push(`**Error:** ${r.error}`, ``);
      continue;
    }
    out.push(`**Answer:** ${r.answer}`, ``);
    for (const source of r.sources) {
      const expected = r.matchingSources.includes(source.number) ? " · expected" : "";
      out.push(`- ${r.cited.includes(source.number) ? "✓" : "  "} ${sourceHeading(source)}${expected}`);
    }
    if (r.sources.length) out.push(``);
    const scores =
      r.kind === "rule"
        ? `Retrieval: ${r.retrieval}${r.expectedMissing.length ? ` (missing: ${r.expectedMissing.join("; ")})` : ""} · cites an expected section: ${r.citesExpected ? "yes" : "no"}`
        : `Trap declined: ${r.passed ? "yes" : "no"}`;
    out.push(`${scores} · answer ${(r.answerMs / 1000).toFixed(1)} s`, ``);
    if (r.warnings.length) out.push(`Warnings: ${r.warnings.join("; ")}`, ``);
    out.push(`**Your verdict:** correct / partly right / wrong`, ``);
  }
  return out.join("\n");
}