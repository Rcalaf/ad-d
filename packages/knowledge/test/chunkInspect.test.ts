import { describe, expect, it } from "vitest";
import { chunkMarkdown } from "../src/chunker";
import { inspectChunks } from "../src/chunkInspect";

const inspect = (markdown: string) => inspectChunks(chunkMarkdown(markdown, "phb"));

describe("inspectChunks", () => {
  it("finds nothing unusual in well-formed chunks", () => {
    const md = `# Book\n\n## Races\n\n${"Dwarves are short and stocky, and very brave. ".repeat(4)}\n\n## Classes\n\n${"Fighters are trained in all weapons and armor. ".repeat(4)}`;
    expect(inspect(md)).toEqual([]);
  });

  it("lists very short chunks with their location and line", () => {
    const [f] = inspect(`# Book\n\n## Races\n\nShort.\n\n## Classes\n\n${"Long enough text about classes. ".repeat(8)}`);
    expect(f).toMatchObject({ kind: "chunk-short", severity: "info", line: 5 });
    expect(f.message).toContain("Races");
  });

  it("finds the same text in two different chunks", () => {
    const text = "This paragraph was duplicated by the conversion, word for word, in two places.";
    const found = inspect(`# Book\n\n## A\n\n${text}\n\n## B\n\n${text}`).filter((f) => f.kind === "chunk-duplicate");
    expect(found).toHaveLength(1);
    expect(found[0].message).toMatch(/also at line 9/);
  });

  it("finds chunks that start in the middle of a sentence", () => {
    // A blank line inside a paragraph (typical at a page break) splits it into two blocks.
    const md = `# Book\n\n## Rules\n\n${"A sentence. ".repeat(14)}\n\nand this one was cut by a blank line inside the paragraph.`;
    const found = inspectChunks(chunkMarkdown(md, "phb", { maxChars: 170 })).filter((f) => f.kind === "chunk-starts-midsentence");
    expect(found).toHaveLength(1);
  });

  it("does not treat list items, tables or lowercase-only terms as broken sentences", () => {
    const md = `# Book\n\n## Rules\n\n${"A sentence. ".repeat(14)}\n\n* item\n\n| a | b |\n| --- | --- |\n| 1 | 2 |`;
    const found = inspectChunks(chunkMarkdown(md, "phb", { maxChars: 170 })).filter((f) => f.kind === "chunk-starts-midsentence");
    expect(found).toEqual([]);
  });

  it("finds a table title with no table under it", () => {
    const found = inspect(`# Book\n\n## Races\n\n#### Table 7: Racial Limits\n\n${"Text that is not a table at all. ".repeat(6)}`);
    expect(found.map((f) => f.kind)).toContain("chunk-table-title-without-table");
  });

  it("finds text before the first heading", () => {
    const [f] = inspect(`${"Here is the converted text of the book. ".repeat(5)}\n\n# Book\n\n${"Intro text for the book. ".repeat(8)}`);
    expect(f).toMatchObject({ kind: "chunk-no-heading", line: 1 });
  });

  it("finds sections whose text exceeds the size limit without paragraph breaks", () => {
    const [f] = inspectChunks(chunkMarkdown(`# Book\n\n## Glossary\n\n${"word ".repeat(500)}`, "phb"));
    expect(f).toMatchObject({ kind: "chunk-oversized-text", severity: "review" });
  });
});
