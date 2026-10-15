import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import * as lancedb from "@lancedb/lancedb";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildIndex, chunkMarkdown, RulesIndex, type Embedder } from "../src/index";

/**
 * Fake embedder for tests: counts words into a fixed number of buckets.
 * Texts sharing words get similar vectors, which is enough to test the index
 * without running a real model. It records every call so tests can inspect them.
 */
class WordCountEmbedder implements Embedder {
  calls: string[][] = [];
  constructor(readonly model = "fake-words", private readonly dimensions = 64) {}

  async embed(texts: string[]): Promise<number[][]> {
    this.calls.push(texts);
    return texts.map((text) => {
      const vector = new Array(this.dimensions).fill(0);
      for (const word of text.toLowerCase().match(/[a-z]+/g) ?? []) {
        let hash = 0;
        for (const char of word) hash = (hash * 31 + char.charCodeAt(0)) % this.dimensions;
        vector[hash] += 1;
      }
      return vector;
    });
  }
}

/** Fake embedder that gives every text the same vector: vector search then carries no information. */
class ConstantEmbedder implements Embedder {
  readonly model = "fake-constant";
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(() => [1, 0, 0, 0]);
  }
}

const book = `# Player's Handbook

## Chapter 2: Races

<!-- page 23 -->

### Dwarves

Dwarves have infravision and can see heat in darkness. They resist magic and poison.

### Elves

Elves are graceful, resist sleep and charm spells, and are skilled with bows and swords.

## Chapter 3: Classes

<!-- page 26 -->

### Thief

Thieves pick pockets, open locks, find traps and move silently.

## Chapter 9: Combat

### Combat

To hit, a character rolls equal to or above their THAC0 minus the target's armor class.
`;

// LanceDB operations can be slow on a busy machine; 15 s avoids random failures.
describe("buildIndex and RulesIndex", { timeout: 15_000 }, () => {
  // The first LanceDB operation loads its native library, which can take several seconds.
  // Doing it once here, with its own time limit, keeps that delay out of the individual tests.
  beforeAll(async () => {
    const warmupDir = await mkdtemp(path.join(tmpdir(), "rules-index-warmup-"));
    await (await lancedb.connect(warmupDir)).tableNames();
    await rm(warmupDir, { recursive: true, force: true });
  }, 30_000);

  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "rules-index-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("finds the section closest in meaning, with its location in the book", async () => {
    const embedder = new WordCountEmbedder();
    await buildIndex(dir, chunkMarkdown(book, "phb"), embedder);
    const index = await RulesIndex.open(dir, embedder);

    const [best] = await index.search("can dwarves see in darkness with infravision", { limit: 3 });
    expect(best.headingPath).toEqual(["Player's Handbook", "Chapter 2: Races", "Dwarves"]);
    expect(best.book).toBe("phb");
    expect(best.pages).toEqual([23]);
  });

  it("returns results ordered by score, with vector similarities up to 1", async () => {
    const embedder = new WordCountEmbedder();
    await buildIndex(dir, chunkMarkdown(book, "phb"), embedder);
    const results = await (await RulesIndex.open(dir, embedder)).search("thieves open locks and find traps", { limit: 3 });

    expect(results[0].headingPath.at(-1)).toBe("Thief");
    const scores = results.map((r) => r.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(results.every((r) => r.similarity === undefined || r.similarity <= 1 + 1e-6)).toBe(true);
  });

  it("finds an exact term through keyword search when vector search gives no signal", async () => {
    // Every text gets the same vector, so vector search cannot tell chunks apart: only keywords can.
    const embedder = new ConstantEmbedder();
    await buildIndex(dir, chunkMarkdown(book, "phb"), embedder);
    const [best] = await (await RulesIndex.open(dir, embedder)).search("THAC0", { limit: 3 });
    expect(best.headingPath.at(-1)).toBe("Combat");
    expect(best.keywordRank).toBe(1);
  });

  it("reports how each result was found, by vector search, keyword search or both", async () => {
    const embedder = new WordCountEmbedder();
    await buildIndex(dir, chunkMarkdown(book, "phb"), embedder);
    const index = await RulesIndex.open(dir, embedder);
    const [both] = await index.search("thieves pick pockets", { limit: 1 });
    expect(both.vectorRank).toBe(1);
    expect(both.keywordRank).toBe(1);
    expect(both.similarity).toBeGreaterThan(0);
  });

  it("searches with one method alone when asked, to compare", async () => {
    const embedder = new WordCountEmbedder();
    await buildIndex(dir, chunkMarkdown(book, "phb"), embedder);
    const index = await RulesIndex.open(dir, embedder);
    const vectorOnly = await index.search("thieves pick pockets", { mode: "vector" });
    const keywordOnly = await index.search("thieves pick pockets", { mode: "keyword" });
    expect(vectorOnly.every((r) => r.keywordRank === undefined && r.vectorRank !== undefined)).toBe(true);
    expect(keywordOnly.every((r) => r.vectorRank === undefined && r.keywordRank !== undefined)).toBe(true);
  });

  it("returns an empty list from keyword search when no word matches, without failing", async () => {
    const embedder = new WordCountEmbedder();
    await buildIndex(dir, chunkMarkdown(book, "phb"), embedder);
    const results = await (await RulesIndex.open(dir, embedder)).search("infravisió dels nans", { mode: "keyword" });
    expect(results).toEqual([]);
  });

  it("asks to rebuild an index made before keyword search existed", async () => {
    const embedder = new WordCountEmbedder();
    await buildIndex(dir, chunkMarkdown(book, "phb"), embedder);
    const table = await (await lancedb.connect(dir)).openTable("chunks");
    for (const index of await table.listIndices()) await table.dropIndex(index.name);
    await expect(RulesIndex.open(dir, embedder)).rejects.toThrow(/Rebuild the index/);
  });

  it("embeds the heading path together with the text", async () => {
    const embedder = new WordCountEmbedder();
    await buildIndex(dir, chunkMarkdown(book, "phb"), embedder);
    expect(embedder.calls[0][0].startsWith("Player's Handbook > Chapter 2: Races > Dwarves")).toBe(true);
  });

  it("replaces the previous index instead of adding duplicates", async () => {
    const embedder = new WordCountEmbedder();
    const chunks = chunkMarkdown(book, "phb");
    await buildIndex(dir, chunks, embedder);
    await buildIndex(dir, chunks, embedder);
    const index = await RulesIndex.open(dir, embedder);
    expect(await index.count()).toBe(chunks.length);
    expect(index.meta.chunkCount).toBe(chunks.length);
  });

  it("keeps only the latest version of the index on disk", async () => {
    const embedder = new WordCountEmbedder();
    const chunks = chunkMarkdown(book, "phb");
    await buildIndex(dir, chunks, embedder);
    await buildIndex(dir, chunks, embedder);
    const table = await (await lancedb.connect(dir)).openTable("chunks");
    expect(await table.listVersions()).toHaveLength(1);
  });

  it("refuses to search with a different embedding model than the one that built the index", async () => {
    await buildIndex(dir, chunkMarkdown(book, "phb"), new WordCountEmbedder("model-a"));
    await expect(RulesIndex.open(dir, new WordCountEmbedder("model-b"))).rejects.toThrow(/Rebuild the index/);
  });

  it("explains when there is no index yet", async () => {
    await expect(RulesIndex.open(dir, new WordCountEmbedder())).rejects.toThrow(/No index found/);
  });

  it("refuses to build an empty index", async () => {
    await expect(buildIndex(dir, [], new WordCountEmbedder())).rejects.toThrow(/No chunks/);
  });
});
