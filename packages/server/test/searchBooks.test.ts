import { toJsonSchema } from "@langchain/core/utils/json_schema";
import { describe, expect, it } from "vitest";
import type { AnswerResult } from "../src/answering/answerQuestion";
import type { Source } from "../src/answering/sources";
import { searchBooksTool } from "../src/agents/tools/searchBooks";

const source = (number: number, notes: string[] = []): Source => ({
  number,
  book: number === 1 ? "dmg" : "phb",
  title: number === 1 ? "Dungeon Master Guide" : "Player's Handbook",
  location: number === 1 ? "Chapter 9: Combat > Character Death > Hovering on Death's Door (Optional Rule)" : "Chapter 9: Combat > Character Death",
  pages: number === 1 ? [104] : [141],
  notes,
});

const result = (overrides: Partial<AnswerResult>): AnswerResult => ({
  question: "q",
  answer: "With this optional rule, a character stays alive until -10 hit points [1].",
  sources: [source(1), source(2)],
  cited: [1],
  checks: { unknownCitations: [], uncited: false },
  notEnglish: false,
  tokens: { promptChars: 1, estimated: 1 },
  timings: { retrievalMs: 1, modelMs: 1 },
  ...overrides,
});

/** The tool with a fake answering function that records the questions it receives. */
function toolAnswering(overrides: Partial<AnswerResult> = {}) {
  const asked: string[] = [];
  const tool = searchBooksTool(async (question) => (asked.push(question), result(overrides)));
  return { tool, asked, run: (question: string) => tool.run(tool.schema.parse({ question })) };
}

describe("search_books", () => {
  it("passes the question on, and returns the answer with only the sources it cites: book, section and pages", async () => {
    const { run, asked } = toolAnswering();
    const text = await run("What is Hovering on Death's Door?");
    expect(asked).toEqual(["What is Hovering on Death's Door?"]);
    expect(text).toContain("a character stays alive until -10 hit points [1]");
    expect(text).toContain("[1] Dungeon Master Guide · Chapter 9: Combat > Character Death > Hovering on Death's Door (Optional Rule) · p. 104");
    expect(text).not.toContain("p. 141");
  });

  it("says the books don't cover it when the search finds nothing", async () => {
    const text = await toolAnswering({ sources: [], cited: [], answer: "I found no passages in the books about this question." }).run("How does advantage work?");
    expect(text).toMatch(/the books don't cover this/i);
  });

  it("withholds an answer that cites nothing, since it may not come from the books", async () => {
    const text = await toolAnswering({ answer: "Advantage means rolling twice.", cited: [], checks: { unknownCitations: [], uncited: true } }).run("How does advantage work?");
    expect(text).not.toContain("rolling twice");
    expect(text).toMatch(/don't answer this clearly/i);
  });

  it("warns when a cited source carries a converter note", async () => {
    const text = await toolAnswering({ sources: [source(1, ["UNCLEAR: header cells not detected"])] }).run("What does Table 7 say?");
    expect(text).toMatch(/\[1\].*converter note: its values may be unreliable/i);
  });

  it("is described to the model as one question about the books, in English", () => {
    const { tool } = toolAnswering();
    expect(tool.name).toBe("search_books");
    expect(tool.description).toMatch(/Player's Handbook.*Dungeon Master Guide/);
    const shown = toJsonSchema(tool.schema) as { properties: Record<string, { type: string; description?: string }> };
    expect(Object.keys(shown.properties)).toEqual(["question"]);
    expect(shown.properties.question).toMatchObject({ type: "string" });
    expect(shown.properties.question.description).toMatch(/english/i);
    expect(JSON.stringify(shown)).not.toContain("$ref");
  });
});