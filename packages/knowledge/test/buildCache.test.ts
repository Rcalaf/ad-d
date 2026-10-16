import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import * as lancedb from "@lancedb/lancedb";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildIndex, chunkMarkdown, RulesIndex, type BuildProgress, type Embedder } from "../src/index";

/** Fake embedder that records every text it is asked to embed. */
class RecordingEmbedder implements Embedder {
  embedded: string[] = [];
  constructor(readonly model = "fake-model") {}
  async embed(texts: string[]): Promise<number[][]> {
    this.embedded.push(...texts);
    return texts.map((t) => [t.length % 7, 1, 0, 0]);
  }
}

const book = (dwarves: string) => `# Player's Handbook

## Races

### Dwarves

${dwarves}

### Elves

Elves are graceful.

### Gnomes

Gnomes are curious.
`;

describe("buildIndex with an embedding cache", { timeout: 15_000 }, () => {
  beforeAll(async () => {
    const warmupDir = await mkdtemp(path.join(tmpdir(), "cache-warmup-"));
    await (await lancedb.connect(warmupDir)).tableNames();
    await rm(warmupDir, { recursive: true, force: true });
  }, 30_000);

  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "cache-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("embeds every chunk on the first build", async () => {
    const embedder = new RecordingEmbedder();
    const chunks = chunkMarkdown(book("Dwarves are stocky."), "phb");
    const result = await buildIndex(dir, chunks, embedder);
    expect(embedder.embedded).toHaveLength(chunks.length);
    expect(result).toMatchObject({ reused: 0, embedded: chunks.length });
  });

  it("reuses every vector when nothing changed", async () => {
    const chunks = chunkMarkdown(book("Dwarves are stocky."), "phb");
    await buildIndex(dir, chunks, new RecordingEmbedder());
    const second = new RecordingEmbedder();
    const result = await buildIndex(dir, chunks, second);
    expect(second.embedded).toEqual([]);
    expect(result).toMatchObject({ reused: chunks.length, embedded: 0 });
    expect(await (await RulesIndex.open(dir, second)).count()).toBe(chunks.length);
  });

  it("embeds only the chunks whose text changed", async () => {
    await buildIndex(dir, chunkMarkdown(book("Dwarves are stocky."), "phb"), new RecordingEmbedder());
    const second = new RecordingEmbedder();
    await buildIndex(dir, chunkMarkdown(book("Dwarves are short and stocky."), "phb"), second);
    expect(second.embedded).toHaveLength(1);
    expect(second.embedded[0]).toContain("Dwarves are short and stocky.");
  });

  it("embeds everything again with a different embedding model", async () => {
    const chunks = chunkMarkdown(book("Dwarves are stocky."), "phb");
    await buildIndex(dir, chunks, new RecordingEmbedder("model-a"));
    const other = new RecordingEmbedder("model-b");
    await buildIndex(dir, chunks, other);
    expect(other.embedded).toHaveLength(chunks.length);
  });

  it("keeps only the vectors of the current chunks in the cache", async () => {
    await buildIndex(dir, chunkMarkdown(book("Dwarves are stocky."), "phb"), new RecordingEmbedder());
    const chunks = chunkMarkdown(book("Dwarves are short and stocky."), "phb");
    await buildIndex(dir, chunks, new RecordingEmbedder());
    const cache = await (await lancedb.connect(dir)).openTable("embedding_cache");
    expect(await cache.countRows()).toBe(chunks.length);
  });

  it("reports each stage, and embedding progress up to the total", async () => {
    const events: BuildProgress[] = [];
    const chunks = chunkMarkdown(book("Dwarves are stocky."), "phb");
    await buildIndex(dir, chunks, new RecordingEmbedder(), { onProgress: (e) => events.push(e), batchSize: 2 });
    expect([...new Set(events.map((e) => e.stage))]).toEqual(["cache", "embedding", "writing", "keyword-index", "cleanup"]);
    const embedding = events.filter((e) => e.stage === "embedding");
    expect(embedding.at(-1)).toMatchObject({ done: chunks.length, total: chunks.length });
    expect(embedding.length).toBeGreaterThan(1);
  });
});