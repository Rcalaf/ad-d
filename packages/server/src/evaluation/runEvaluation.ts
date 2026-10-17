import type { AnswerResult } from "../answering/answerQuestion";
import type { Source } from "../answering/sources";
import type { EvalQuestion, ExpectedSection } from "./questions";

export interface EvalResult {
  id: string;
  question: string;
  kind: EvalQuestion["kind"];
  status: EvalQuestion["status"];
  expected: string;
  answer: string;
  sources: Source[];
  cited: number[];
  /** Rule questions: were the expected sections among the sources? */
  retrieval?: "all" | "some" | "none";
  expectedFound: string[];
  expectedMissing: string[];
  /** Numbers of the sources that come from an expected section. */
  matchingSources: number[];
  /** Did the answer cite at least one source from an expected section? */
  citesExpected: boolean;
  /** Trap questions: did the system decline, citing nothing? */
  passed?: boolean;
  warnings: string[];
  answerMs: number;
  /** Set when the question couldn't be run, for example if Ollama stopped. */
  error?: string;
}

export interface EvalRun {
  startedAt: string;
  model: string;
  results: EvalResult[];
}

const label = (s: ExpectedSection) => `${s.book}: ${s.section}`;

/** A source matches an expected section when the book is the same and the section is one of its headings. */
export function sourceMatches(source: Source, expected: ExpectedSection): boolean {
  if (source.book !== expected.book) return false;
  const headings = [source.title, ...source.location.split(" > ")].map((h) => h.trim().toLowerCase());
  return headings.includes(expected.section.trim().toLowerCase());
}

/**
 * Runs each question through the answering workflow and scores what code can score reliably:
 * retrieval, grounding in an expected section, and declined traps. Content is judged by a person.
 * A failing question is recorded as an error and the run continues.
 */
export async function runEvaluation(
  questions: EvalQuestion[],
  ask: (question: EvalQuestion) => Promise<AnswerResult>,
  options: { model?: string; onQuestion?: (question: EvalQuestion, index: number, total: number) => void } = {},
): Promise<EvalRun> {
  const run: EvalRun = { startedAt: new Date().toISOString(), model: options.model ?? "unknown", results: [] };
  for (const [i, q] of questions.entries()) {
    options.onQuestion?.(q, i, questions.length);
    const base = { id: q.id, question: q.question, kind: q.kind, status: q.status, expected: q.expected };
    try {
      run.results.push(score(q, await ask(q), base));
    } catch (error) {
      run.results.push({
        ...base,
        answer: "",
        sources: [],
        cited: [],
        expectedFound: [],
        expectedMissing: q.expectedSections.map(label),
        matchingSources: [],
        citesExpected: false,
        warnings: [],
        answerMs: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return run;
}

function score(q: EvalQuestion, result: AnswerResult, base: Pick<EvalResult, "id" | "question" | "kind" | "status" | "expected">): EvalResult {
  const found = q.expectedSections.filter((e) => result.sources.some((s) => sourceMatches(s, e)));
  const missing = q.expectedSections.filter((e) => !found.includes(e));
  const matchingSources = result.sources.filter((s) => q.expectedSections.some((e) => sourceMatches(s, e))).map((s) => s.number);
  const citesExpected = matchingSources.some((n) => result.cited.includes(n));

  const warnings: string[] = [];
  for (const n of result.checks.unknownCitations) warnings.push(`cites [${n}], which is not a source`);
  if (q.kind === "rule" && result.checks.uncited) warnings.push("cites no sources");
  if (result.notEnglish) warnings.push("declined as not English");
  if (result.usageWarning) warnings.push(result.usageWarning);

  return {
    ...base,
    answer: result.answer,
    sources: result.sources,
    cited: result.cited,
    retrieval: q.kind === "rule" ? (missing.length === 0 ? "all" : found.length > 0 ? "some" : "none") : undefined,
    expectedFound: found.map(label),
    expectedMissing: missing.map(label),
    matchingSources,
    citesExpected,
    // A trap is passed when the system declines: no sources found, or an answer citing nothing.
    passed: q.kind === "trap" ? result.sources.length === 0 || result.cited.length === 0 : undefined,
    warnings,
    answerMs: result.timings.modelMs,
  };
}

export interface EvalSummary {
  rules: number;
  retrievalAll: number;
  retrievalSome: number;
  retrievalNone: number;
  /** Rule questions whose answer cites an expected section. */
  grounded: number;
  traps: number;
  trapsPassed: number;
  errors: number;
  averageAnswerMs: number;
}

export function summarize(run: EvalRun): EvalSummary {
  const ok = run.results.filter((r) => !r.error);
  const rules = ok.filter((r) => r.kind === "rule");
  const traps = ok.filter((r) => r.kind === "trap");
  return {
    rules: rules.length,
    retrievalAll: rules.filter((r) => r.retrieval === "all").length,
    retrievalSome: rules.filter((r) => r.retrieval === "some").length,
    retrievalNone: rules.filter((r) => r.retrieval === "none").length,
    grounded: rules.filter((r) => r.citesExpected).length,
    traps: traps.length,
    trapsPassed: traps.filter((r) => r.passed).length,
    errors: run.results.length - ok.length,
    averageAnswerMs: ok.length ? Math.round(ok.reduce((sum, r) => sum + r.answerMs, 0) / ok.length) : 0,
  };
}

/** Runs are comparable only when they asked exactly the same questions, in any order. */
export function sameQuestions(a: EvalRun, b: EvalRun): boolean {
  const ids = (run: EvalRun) => run.results.map((r) => r.id).sort().join("|");
  return ids(a) === ids(b);
}

/** The changes from a previous run, one line per measure. */
export function compareRuns(current: EvalSummary, previous: EvalSummary): string[] {
  const line = (name: string, now: number, was: number) => `${name}: ${now} (was ${was})`;
  return [
    line("retrieval, all expected sections", current.retrievalAll, previous.retrievalAll),
    line("retrieval, some", current.retrievalSome, previous.retrievalSome),
    line("retrieval, none", current.retrievalNone, previous.retrievalNone),
    line("answers citing an expected section", current.grounded, previous.grounded),
    line("traps declined", current.trapsPassed, previous.trapsPassed),
    line("average answer time, s", Math.round(current.averageAnswerMs / 100) / 10, Math.round(previous.averageAnswerMs / 100) / 10),
  ];
}