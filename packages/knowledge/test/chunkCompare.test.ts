import { describe, expect, it } from "vitest";
import { chunkMarkdown } from "../src/chunker";
import { compareChunks } from "../src/chunkCompare";

const indexed = (book: string, headingPath: string[], text: string) => ({ book, headingPath, text });

describe("compareChunks", () => {
  const current = chunkMarkdown("# Book\n\n## Priests\n\n**Requirements**\n\nWisdom 9.\n\n## Rogues\n\nThieves.", "phb");

  it("counts chunks with the same text in the same place as unchanged", () => {
    const result = compareChunks([indexed("phb", ["Book", "Rogues"], "Thieves.")], current);
    expect(result.unchanged).toBe(1);
  });

  it("reports text that moved to a new location, with both locations", () => {
    const result = compareChunks([indexed("phb", ["Book", "Priests"], "Wisdom 9.")], current);
    expect(result.moved).toEqual([{ book: "phb", text: "Wisdom 9.", before: ["Book", "Priests"], after: ["Book", "Priests", "Requirements"] }]);
  });

  it("reports text that is new and text that disappeared", () => {
    const result = compareChunks([indexed("phb", ["Book", "Rogues"], "Old text <!-- UNCLEAR: x -->")], current);
    expect(result.added.map((c) => c.text)).toEqual(["Wisdom 9.", "Thieves."]);
    expect(result.removed.map((c) => c.text)).toEqual(["Old text <!-- UNCLEAR: x -->"]);
  });

  it("ignores differences in whitespace", () => {
    const result = compareChunks([indexed("phb", ["Book", "Rogues"], "Thieves.\n")], current);
    expect(result.unchanged).toBe(1);
  });
});
