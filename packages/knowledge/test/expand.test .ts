import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import * as lancedb from "@lancedb/lancedb";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildIndex, chunkMarkdown, RulesIndex, type Embedder } from "../src/index";

/** Fake embedder: the same vector for everything, so these tests rely on keyword search, which is deterministic. */
class ConstantEmbedder implements Embedder {
  readonly model = "fake-constant";
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(() => [1, 0, 0, 0]);
  }
}

const paragraph = (word: string) => `${word} ${"filler text about the dwarven race and its customs. ".repeat(3)}`.trim();
// "Dwarves" is split into 5 pieces of one paragraph each (maxChars 200); each paragraph has a unique word.
const book = `# Player's Handbook

## Chapter 2: Races

<!-- page 23 -->

### Dwarves

${paragraph("alpha")}

${paragraph("bravo")}

<!-- page 24 -->

${paragraph("charlie")}

${paragraph("delta")}

${paragraph("echo")}

### Elves

${paragraph("foxtrot")}
`;

/** A section whose text is interrupted by a table, as Dwarves is by Table 8 in the Player's Handbook. */
const tableBook = `# Player's Handbook

## Chapter 2: Races

### Dwarves

Before the table, dwarves choose their classes.

<!-- page 27 -->

#### Table 8: Racial Ability Adjustments

| Race | Adjustments |
| --- | --- |
| Dwarf | +1 Constitution |
| Elf | +1 Dexterity |

<!-- second table -->

golf After the table, dwarves are nonmagical.

### Elves

Elves are graceful.
`;

describe("RulesIndex.expand", { timeout: 15_000 }, () => {
  beforeAll(async () => {
    const warmupDir = await mkdtemp(path.join(tmpdir(), "expand-warmup-"));
    await (await lancedb.connect(warmupDir)).tableNames();
    await rm(warmupDir, { recursive: true, force: true });
  }, 30_000);

  let dir: string;
  let index: RulesIndex;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "expand-"));
    const embedder = new ConstantEmbedder();
    await buildIndex(dir, chunkMarkdown(book, "phb", { maxChars: 200 }), embedder);
    index = await RulesIndex.open(dir, embedder);
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("returns each result's section and position, so its neighbours can be found", async () => {
    const [hit] = await index.search("charlie", { mode: "keyword", limit: 1 });
    expect(hit).toMatchObject({ piece: 2, pieceCount: 5 });
  });

  it("adds the pieces before and after a result, from the same section, in book order", async () => {
    const results = await index.search("charlie", { mode: "keyword", limit: 1 });
    const [passage] = await index.expand(results);
    expect(passage.pieces).toEqual([1, 2, 3]);
    expect(passage.text.indexOf("bravo")).toBeLessThan(passage.text.indexOf("charlie"));
    expect(passage.text.indexOf("charlie")).toBeLessThan(passage.text.indexOf("delta"));
    expect(passage.pages).toEqual([23, 24]);
    expect(passage.resultRanks).toEqual([1]);
  });

  it("does not cross into another section", async () => {
    const [passage] = await index.expand(await index.search("echo", { mode: "keyword", limit: 1 }));
    expect(passage.pieces).toEqual([3, 4]);
    expect(passage.text).not.toContain("foxtrot");
  });

  it("merges results from the same section into one passage", async () => {
    const results = await index.search("bravo delta", { mode: "keyword", limit: 2 });
    const passages = await index.expand(results);
    expect(passages).toHaveLength(1);
    expect(passages[0].pieces).toEqual([0, 1, 2, 3, 4]);
    expect(passages[0].resultRanks.sort()).toEqual([1, 2]);
  });

  it("always keeps the pieces the search found, and drops neighbours first when over the size budget", async () => {
    const results = await index.search("charlie", { mode: "keyword", limit: 1 });
    const [passage] = await index.expand(results, { maxChars: 50 });
    expect(passage.pieces).toEqual([2]);
  });

  it("marks a gap between pieces that are not next to each other", async () => {
    const results = await index.search("alpha echo", { mode: "keyword", limit: 2 });
    const [passage] = await index.expand(results, { radius: 0 });
    expect(passage.pieces).toEqual([0, 4]);
    expect(passage.text).toContain("[...]");
  });

  it("passes through a table to the text before it, and puts the table's title in front of its rows", async () => {
    await buildIndex(dir, chunkMarkdown(tableBook, "phb"), new ConstantEmbedder());
    const index2 = await RulesIndex.open(dir, new ConstantEmbedder());
    const [passage] = await index2.expand(await index2.search("golf", { mode: "keyword", limit: 1 }));
    expect(passage.headingPath).toEqual(["Player's Handbook", "Chapter 2: Races", "Dwarves"]);
    expect(passage.text.indexOf("Before the table")).toBeLessThan(passage.text.indexOf("Table 8: Racial Ability Adjustments"));
    expect(passage.text.indexOf("Table 8: Racial Ability Adjustments")).toBeLessThan(passage.text.indexOf("| Dwarf | +1 Constitution |"));
    expect(passage.text.indexOf("| Dwarf | +1 Constitution |")).toBeLessThan(passage.text.indexOf("golf"));
  });

  it("names a table that doesn't fit in the budget instead of dropping it silently", async () => {
    // A table of about 600 characters, with a budget leaving room for 200 more: the text before it fits, the table doesn't.
    const longRows = Array.from({ length: 20 }, (_, i) => `| Race ${i} | +1 Strength |`).join("\n");
    const md = tableBook.replace("| Elf | +1 Dexterity |", `| Elf | +1 Dexterity |\n${longRows}`);
    await buildIndex(dir, chunkMarkdown(md, "phb"), new ConstantEmbedder());
    const index2 = await RulesIndex.open(dir, new ConstantEmbedder());
    const results = await index2.search("golf", { mode: "keyword", limit: 1 });
    const [passage] = await index2.expand(results, { maxChars: results[0].text.length + 200 });
    expect(passage.text).toContain("[Table 8: Racial Ability Adjustments, p. 27, not included]");
    expect(passage.text).toContain("Before the table");
  });

  it("counts only text pieces in the radius, so consecutive tables don't use it up", async () => {
    const md = tableBook.replace("<!-- second table -->", "#### Table 9: Saving Throw Bonuses\n\n| Con | Bonus |\n| --- | --- |\n| 7 | +2 |");
    await buildIndex(dir, chunkMarkdown(md, "phb"), new ConstantEmbedder());
    const index2 = await RulesIndex.open(dir, new ConstantEmbedder());
    const [passage] = await index2.expand(await index2.search("golf", { mode: "keyword", limit: 1 }));
    expect(passage.text).toContain("Before the table");
    expect(passage.text).toContain("Table 9: Saving Throw Bonuses");
  });

  it("asks to rebuild an index made before pieces were numbered", async () => {
    const table = await (await lancedb.connect(dir)).openTable("chunks");
    await table.dropColumns(["section", "piece", "pieceCount"]);
    await expect(RulesIndex.open(dir, new ConstantEmbedder())).rejects.toThrow(/Rebuild the index/);
  });
});