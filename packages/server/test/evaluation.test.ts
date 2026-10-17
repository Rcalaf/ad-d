import { describe, expect, it } from "vitest";
import type { AnswerResult } from "../src/answering/answerQuestion";
import type { Source } from "../src/answering/sources";
import { missingSections, parseQuestions, type EvalQuestion } from "../src/evaluation/questions";
import { compareRuns, runEvaluation, sameQuestions, sourceMatches, summarize, type EvalRun } from "../src/evaluation/runEvaluation";
import { formatEvalReport } from "../src/evaluation/report";

const source = (number: number, book: string, path: string[]): Source => ({
  number,
  book,
  title: book === "phb" ? "Player's Handbook" : "Dungeon Master's Guide",
  location: path.join(" > "),
  pages: [44],
  notes: [],
});

const answer = (overrides: Partial<AnswerResult>): AnswerResult => ({
  question: "q",
  answer: "No [1].",
  sources: [],
  cited: [],
  checks: { unknownCitations: [], uncited: false },
  notEnglish: false,
  tokens: { promptChars: 1000, estimated: 334, reported: 250 },
  timings: { retrievalMs: 200, modelMs: 18_000 },
  ...overrides,
});

const RULE: EvalQuestion = {
  id: "dwarf-mage",
  question: "Can a dwarf be a mage?",
  kind: "rule",
  expected: "No: mages must be human, elf or half-elf.",
  expectedSections: [{ book: "phb", section: "Mage" }, { book: "phb", section: "Dwarves" }],
  status: "draft",
  note: "From the search output.",
};
const TRAP: EvalQuestion = {
  id: "trap-advantage",
  question: "How does the advantage mechanic work?",
  kind: "trap",
  expected: "Not in 2nd Edition: the books don't cover it.",
  expectedSections: [],
  status: "draft",
  note: "Advantage is a 5th Edition mechanic.",
};

describe("parseQuestions", () => {
  it("reads a valid question set", () => {
    expect(parseQuestions(JSON.stringify([RULE, TRAP]))).toHaveLength(2);
  });

  it("explains what is wrong with an invalid question, naming it", () => {
    expect(() => parseQuestions(JSON.stringify([{ ...RULE, kind: "quiz" }]))).toThrow(/dwarf-mage/);
    expect(() => parseQuestions(JSON.stringify([{ ...RULE, expectedSections: [] }]))).toThrow(/rule questions need at least one expected section/);
    expect(() => parseQuestions(JSON.stringify([RULE, RULE]))).toThrow(/duplicate id: dwarf-mage/);
  });
});

describe("missingSections", () => {
  it("lists expected sections that don't appear as a heading in that book", () => {
    const headings = [
      { book: "phb", headingPath: ["Player's Handbook", "Chapter 3: Player Character Classes", "Wizard", "Mage"] },
      { book: "dmg", headingPath: ["Dungeon Master's Guide", "Dwarves"] },
    ];
    expect(missingSections([RULE], headings)).toEqual([{ id: "dwarf-mage", book: "phb", section: "Dwarves" }]);
  });
});

describe("sourceMatches", () => {
  it("matches a source when the book is the same and the section is one of its headings, ignoring case", () => {
    const mage = source(1, "phb", ["Chapter 3: Player Character Classes", "Wizard", "Mage"]);
    expect(sourceMatches(mage, { book: "phb", section: "mage" })).toBe(true);
    expect(sourceMatches(mage, { book: "dmg", section: "Mage" })).toBe(false);
    expect(sourceMatches(mage, { book: "phb", section: "Mag" })).toBe(false);
  });
});

describe("runEvaluation", () => {
  const sources = [source(1, "phb", ["Chapter 3", "Wizard", "Mage"]), source(2, "dmg", ["Chapter 2", "A Nonhuman World"])];

  it("scores retrieval and grounding for rule questions", async () => {
    const run = await runEvaluation([RULE], async () => answer({ sources, cited: [1] }));
    expect(run.results[0]).toMatchObject({ retrieval: "some", expectedFound: ["phb: Mage"], citesExpected: true, passed: undefined });
  });

  it("doesn't count citing an unexpected source as grounded", async () => {
    const run = await runEvaluation([RULE], async () => answer({ sources, cited: [2] }));
    expect(run.results[0].citesExpected).toBe(false);
  });

  it("passes a trap when the answer cites nothing, and fails it when the answer cites sources", async () => {
    const declined = await runEvaluation([TRAP], async () => answer({ answer: "The sources don't cover this.", sources, cited: [], checks: { unknownCitations: [], uncited: true } }));
    expect(declined.results[0].passed).toBe(true);
    const invented = await runEvaluation([TRAP], async () => answer({ sources, cited: [1, 2] }));
    expect(invented.results[0].passed).toBe(false);
  });

  it("records an error for a question instead of stopping the whole run", async () => {
    const run = await runEvaluation([RULE, TRAP], async (q) => {
      if (q.id === "dwarf-mage") throw new Error("Ollama not reachable");
      return answer({ checks: { unknownCitations: [], uncited: true } });
    });
    expect(run.results.map((r) => r.error)).toEqual(["Ollama not reachable", undefined]);
  });

  it("announces each question as it starts", async () => {
    const seen: string[] = [];
    await runEvaluation([RULE, TRAP], async () => answer({}), { onQuestion: (q, i, total) => seen.push(`${i + 1}/${total} ${q.id}`) });
    expect(seen).toEqual(["1/2 dwarf-mage", "2/2 trap-advantage"]);
  });
});

describe("summarize and compareRuns", () => {
  const run = (retrievalAll: number): EvalRun => ({
    startedAt: "2026-10-18T10:00:00.000Z",
    model: "qwen2.5:7b",
    results: [
      { id: "a", question: "a", kind: "rule", status: "draft", expected: "", answer: "", sources: [], cited: [], retrieval: retrievalAll > 0 ? "all" : "none", expectedFound: [], expectedMissing: [], matchingSources: [], citesExpected: true, warnings: [], answerMs: 10_000 },
      { id: "t", question: "t", kind: "trap", status: "draft", expected: "", answer: "", sources: [], cited: [], expectedFound: [], expectedMissing: [], matchingSources: [], citesExpected: false, passed: true, warnings: [], answerMs: 20_000 },
    ],
  });

  it("counts retrieval, grounding, traps and the average answer time", () => {
    expect(summarize(run(1))).toEqual({ rules: 1, retrievalAll: 1, retrievalSome: 0, retrievalNone: 0, grounded: 1, traps: 1, trapsPassed: 1, errors: 0, averageAnswerMs: 15_000 });
  });

  it("only treats runs with exactly the same questions as comparable", () => {
    const a = run(1);
    const subset = { ...run(1), results: run(1).results.slice(0, 1) };
    const reordered = { ...run(0), results: [...run(0).results].reverse() };
    expect(sameQuestions(a, run(0))).toBe(true);
    expect(sameQuestions(a, reordered)).toBe(true);
    expect(sameQuestions(a, subset)).toBe(false);
  });

  it("describes the change from a previous run", () => {
    expect(compareRuns(summarize(run(1)), summarize(run(0)))).toContain("retrieval, all expected sections: 1 (was 0)");
  });
});

describe("formatEvalReport", () => {
  it("shows each question with its expected answer, the answer, and an empty verdict to fill in", async () => {
    const r = await runEvaluation([RULE], async () => answer({ answer: "No, dwarves can't [1].", sources: [source(1, "phb", ["Chapter 3", "Wizard", "Mage"])], cited: [1] }));
    const report = formatEvalReport(r, undefined);
    expect(report).toContain("Can a dwarf be a mage?");
    expect(report).toContain("**Expected:** No: mages must be human, elf or half-elf.");
    expect(report).toContain("**Answer:** No, dwarves can't [1].");
    expect(report).toContain("**Your verdict:** correct / partly right / wrong");
    expect(report).toContain("✓ [1] Player's Handbook · Chapter 3 > Wizard > Mage · p. 44 · expected");
  });
});