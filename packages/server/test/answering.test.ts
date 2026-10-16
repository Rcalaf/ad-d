import type { BaseMessage } from "@langchain/core/messages";
import type { ExpandOptions, Passage, SearchResult } from "@dnd/knowledge";
import { describe, expect, it } from "vitest";
import { answerQuestion, type AnswerModel } from "../src/answering/answerQuestion";
import { findCitations } from "../src/answering/citations";
import { formatSources } from "../src/answering/sources";
import { PromptTooLongError } from "../src/llm/contextWindow";

const passage = (overrides: Partial<Passage> = {}): Passage => ({
  book: "phb",
  headingPath: ["Player's Handbook", "Chapter 2: Player Character Races", "Dwarves"],
  text: "By nature, dwarves are nonmagical and never use magical spells.",
  pages: [28],
  notes: [],
  pieces: [5],
  pieceCount: 8,
  resultRanks: [1],
  ...overrides,
});

const MAGE = passage({
  headingPath: ["Player's Handbook", "Chapter 3: Player Character Classes", "Wizard", "Mage"],
  text: "Ability Requirements: Intelligence 9 Races Allowed: Human, Elf, Half-elf",
  pages: [44, 45],
});
const TABLE_7 = passage({
  book: "dmg",
  headingPath: ["Dungeon Master's Guide", "Chapter 2: Player Character Races", "A Nonhuman World"],
  text: "Table 7: Racial Class and Level Limits\n\n| Race | Class | Maximum Level |\n| --- | --- | --- |\n| Dwarf | Fighter | 15 |",
  pages: [22],
  notes: ["Printed as a bar chart: the values are the numbers printed on the bars."],
});

/** A fake index: returns fixed passages, and records the size limit it was given. */
function fakeIndex(passages: Passage[], found = passages.length) {
  const calls: { maxChars?: number }[] = [];
  return {
    calls,
    search: async () => Array.from({ length: found }, () => ({}) as SearchResult),
    expand: async (_results: SearchResult[], options: ExpandOptions = {}) => {
      calls.push({ maxChars: options.maxChars });
      return passages;
    },
  };
}

/** A scripted model: answers with fixed text and records the messages it received. */
class ScriptedModel implements AnswerModel {
  received: BaseMessage[][] = [];
  constructor(
    private readonly answer: string,
    private readonly inputTokens?: number,
  ) {}
  async invoke(messages: BaseMessage[]) {
    this.received.push(messages);
    return { content: this.answer, usage_metadata: this.inputTokens === undefined ? undefined : { input_tokens: this.inputTokens, output_tokens: 50, total_tokens: this.inputTokens + 50 } };
  }
}

const budget = { contextTokens: 8192, answerTokens: 1024 };
const textOf = (message: BaseMessage) => String(message.content);

describe("formatSources", () => {
  it("numbers each passage, with its book, location, pages and converter notes before its text", () => {
    const text = formatSources([MAGE, TABLE_7]);
    expect(text).toContain("[1] Player's Handbook · Chapter 3: Player Character Classes > Wizard > Mage · p. 44-45");
    expect(text).toContain("[2] Dungeon Master's Guide · Chapter 2: Player Character Races > A Nonhuman World · p. 22");
    expect(text).toContain("Converter note: Printed as a bar chart");
    expect(text.indexOf("[1]")).toBeLessThan(text.indexOf("Races Allowed"));
    expect(text.indexOf("Races Allowed")).toBeLessThan(text.indexOf("[2]"));
  });
});

describe("findCitations", () => {
  it("finds single and grouped citations, ignoring gap markers and other brackets", () => {
    expect(findCitations("No [1]. See [2, 3] and [3][4]. Gap [...] and [Table 7].")).toEqual([1, 2, 3, 4]);
  });
});

describe("answerQuestion", () => {
  it("sends the instructions as the system message, then the numbered sources, with the question last", async () => {
    const model = new ScriptedModel("No [1].");
    await answerQuestion("Can a dwarf be a mage?", { index: fakeIndex([MAGE]), model, budget });
    const [system, human] = model.received[0];
    expect(system._getType()).toBe("system");
    expect(textOf(system)).toMatch(/only the numbered sources/i);
    expect(textOf(human)).toContain("[1] Player's Handbook");
    expect(textOf(human).trim().endsWith("Can a dwarf be a mage?")).toBe(true);
  });

  it("returns the answer, the sources and the source numbers it cites", async () => {
    const result = await answerQuestion("Can a dwarf be a mage?", { index: fakeIndex([MAGE, TABLE_7]), model: new ScriptedModel("No: mages must be human, elf or half-elf [1]."), budget });
    expect(result.answer).toBe("No: mages must be human, elf or half-elf [1].");
    expect(result.sources.map((s) => s.number)).toEqual([1, 2]);
    expect(result.cited).toEqual([1]);
    expect(result.checks).toEqual({ unknownCitations: [], uncited: false });
  });

  it("flags citations to sources that don't exist", async () => {
    const result = await answerQuestion("Can a dwarf be a mage?", { index: fakeIndex([MAGE]), model: new ScriptedModel("No [1], see also [3]."), budget });
    expect(result.checks.unknownCitations).toEqual([3]);
  });

  it("flags an answer that cites nothing", async () => {
    const result = await answerQuestion("Can a dwarf be a mage?", { index: fakeIndex([MAGE]), model: new ScriptedModel("No, never."), budget });
    expect(result.checks.uncited).toBe(true);
  });

  it("doesn't call the model when the search finds nothing", async () => {
    const model = new ScriptedModel("Invented answer [1].");
    const result = await answerQuestion("What is a tarrasque?", { index: fakeIndex([], 0), model, budget });
    expect(model.received).toEqual([]);
    expect(result.sources).toEqual([]);
    expect(result.answer).toMatch(/no passages/i);
  });

  it("gives the expansion the source budget derived from the window, capped by the configured maximum", async () => {
    const small = fakeIndex([MAGE]);
    await answerQuestion("Can a dwarf be a mage?", { index: small, model: new ScriptedModel("No [1]."), budget: { contextTokens: 4096, answerTokens: 1024 } });
    expect(small.calls[0].maxChars).toBeGreaterThan(5000);
    expect(small.calls[0].maxChars).toBeLessThan(8000);
    const large = fakeIndex([MAGE]);
    await answerQuestion("Can a dwarf be a mage?", { index: large, model: new ScriptedModel("No [1]."), budget: { contextTokens: 32_768, answerTokens: 1024 }, maxSourceChars: 12_000 });
    expect(large.calls[0].maxChars).toBe(12_000);
  });

  it("refuses a prompt that can't fit, without calling the model", async () => {
    const model = new ScriptedModel("No [1].");
    const hugeQuestion = "Can a dwarf be a mage? ".repeat(2000);
    await expect(answerQuestion(hugeQuestion, { index: fakeIndex([MAGE]), model, budget })).rejects.toThrow(PromptTooLongError);
    expect(model.received).toEqual([]);
  });

  it("reports the estimated and reported token counts, and warns when the model read more than the estimate allowed", async () => {
    const ok = await answerQuestion("Can a dwarf be a mage?", { index: fakeIndex([MAGE]), model: new ScriptedModel("No [1].", 900), budget });
    expect(ok.tokens).toMatchObject({ reported: 900 });
    expect(ok.tokens.estimated).toBeGreaterThan(0);
    expect(ok.usageWarning).toBeUndefined();
    const cut = await answerQuestion("Can a dwarf be a mage?", { index: fakeIndex([MAGE]), model: new ScriptedModel("No [1].", 7000), budget });
    expect(cut.usageWarning).toMatch(/may have been cut/);
  });
});