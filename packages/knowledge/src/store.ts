import { createHash } from "node:crypto";
import * as lancedb from "@lancedb/lancedb";
import { embeddingText, tableTitleOf, type Chunk } from "./chunker";
import type { Embedder } from "./embedder";
import { reciprocalRankFusion } from "./fusion";

const CHUNKS_TABLE = "chunks";
const META_TABLE = "meta";
/** Vectors from previous builds, keyed by a fingerprint of the model and the text. */
const CACHE_TABLE = "embedding_cache";

/** A search hit: the chunk, its combined score, and how each search ranked it. */
export interface SearchResult {
  id: string;
  book: string;
  headingPath: string[];
  text: string;
  pages: number[];
  hasTable: boolean;
  /** Reciprocal rank fusion score: higher is better. Only meaningful for comparing results of one search. */
  score: number;
  /** Rank in the vector search (1 = closest in meaning), if it was found there. */
  vectorRank?: number;
  /** Cosine similarity to the question, from the vector search: 1 is identical meaning, 0 unrelated. */
  similarity?: number;
  /** Rank in the keyword search (1 = best keyword match), if it was found there. */
  keywordRank?: number;
  /** Converter notes about this text, such as an unreliable table. Empty when there are none. */
  notes: string[];
  /** Section number in the book, position in the section and the section's number of pieces (see Chunk). */
  section: number;
  piece: number;
  pieceCount: number;
}

/**
 * A passage for the model: one or more pieces of the same section, joined in book order.
 * Tables keep their place in the section, with their title in front of their rows; a table that
 * doesn't fit in the size budget is named in its place. Pieces that are not next to each other
 * are separated by "[...]".
 */
export interface Passage {
  book: string;
  headingPath: string[];
  text: string;
  pages: number[];
  notes: string[];
  /** Pieces included, in order, and how many the section has. */
  pieces: number[];
  pieceCount: number;
  /** Ranks (1 = best) of the search results this passage contains. */
  resultRanks: number[];
}

export interface ExpandOptions {
  /**
   * Text pieces to add on each side of a search result. Default 1. Tables between are added too,
   * without counting, so a table never uses up the radius.
   */
  radius?: number;
  /**
   * Size limit for all passages together, in characters. The pieces the search found are always
   * included; neighbours are added in rank order only while the total stays within the limit.
   * Default 12,000 characters, about 3,000 tokens.
   */
  maxChars?: number;
}

/** A chunk as stored in the index, without its vector: for comparing the index with the books. */
export interface IndexedChunk {
  book: string;
  headingPath: string[];
  text: string;
}

/** hybrid: both searches combined (default). vector or keyword: one search alone, to compare. */
export type SearchMode = "hybrid" | "vector" | "keyword";

export interface SearchOptions {
  limit?: number;
  mode?: SearchMode;
}

/**
 * Keyword index settings: English stemming matches regular plurals ("mages" finds "mage"),
 * and common words ("can", "the", "be") are ignored. Irregular forms such as dwarf/dwarves
 * still need vector search, which is why both are combined.
 */
const keywordIndex = () => lancedb.Index.fts({ language: "English", stem: true, removeStopWords: true });
// A function, not a constant: LanceDB index configurations can only be used once.
const KEYWORD_COLUMN = "searchText";

/**
 * How a chunk is stored. Lists are stored as JSON strings: LanceDB infers each column's type
 * from the data, and an empty list (a chunk without pages) gives it nothing to infer from.
 */
interface ChunkRow {
  id: string;
  book: string;
  headingPath: string;
  text: string;
  /** Heading path plus text: what the keyword index searches, so headings count as keywords too. */
  searchText: string;
  pages: string;
  hasTable: boolean;
  /** Converter notes, as JSON. */
  notes: string;
  section: number;
  piece: number;
  pieceCount: number;
  vector: number[];
}

interface MetaRow {
  model: string;
  dimensions: number;
  chunkCount: number;
  builtAt: string;
}

/** One step of a build, reported as it happens. Embedding progress is reported after every batch. */
export type BuildProgress =
  | { stage: "cache"; reused: number; toEmbed: number }
  | { stage: "embedding"; done: number; total: number; elapsedMs: number }
  | { stage: "writing" }
  | { stage: "keyword-index" }
  | { stage: "cleanup" };

export interface BuildOptions {
  /** Called at each stage of the build, and after every batch while embedding. */
  onProgress?: (progress: BuildProgress) => void;
  /** Texts sent to the embedder per call. Default 16. */
  batchSize?: number;
}

export interface BuildResult extends MetaRow {
  /** Chunks whose vector came from the cache, and chunks sent to the embedding model. */
  reused: number;
  embedded: number;
  /** Duration of each stage, in milliseconds. */
  timings: Record<"cache" | "embedding" | "writing" | "keywordIndex" | "cleanup", number>;
}

/**
 * The cache key of a chunk: a fingerprint of the embedding model and the exact text that is embedded.
 * Any change to the text or its location, or a different model, gives a different key.
 */
function cacheKey(model: string, text: string): string {
  return createHash("sha256").update(`${model}\u0000${text}`).digest("hex");
}

/**
 * Embeds the chunks and writes a new index, replacing any previous one in the same folder.
 * Vectors of unchanged chunks are reused from the cache, so a rebuild after small corrections
 * only sends the changed chunks to the embedding model.
 */
export async function buildIndex(dir: string, chunks: Chunk[], embedder: Embedder, options: BuildOptions = {}): Promise<BuildResult> {
  if (chunks.length === 0) throw new Error("No chunks to index.");
  const { onProgress = () => {}, batchSize = 16 } = options;
  const timings = { cache: 0, embedding: 0, writing: 0, keywordIndex: 0, cleanup: 0 };
  let stageStart = performance.now();
  const endStage = (name: keyof typeof timings) => {
    timings[name] = performance.now() - stageStart;
    stageStart = performance.now();
  };
  const db = await lancedb.connect(dir);

  // 1. Cache: find which chunks already have a vector.
  const texts = chunks.map(embeddingText);
  const keys = texts.map((text) => cacheKey(embedder.model, text));
  const cached = new Map<string, number[]>();
  if ((await db.tableNames()).includes(CACHE_TABLE)) {
    const cacheTable = await db.openTable(CACHE_TABLE);
    for (const row of await cacheTable.query().select(["key", "vector"]).limit(await cacheTable.countRows()).toArray()) {
      cached.set(row.key, Array.from(row.vector as ArrayLike<number>));
    }
  }
  // Chunks whose vector is in the cache, and the distinct texts that still need embedding.
  const reused = keys.filter((key) => cached.has(key)).length;
  const missing = [...new Set(keys.filter((key) => !cached.has(key)))];
  const textOfKey = new Map(keys.map((key, i) => [key, texts[i]]));
  onProgress({ stage: "cache", reused, toEmbed: missing.length });
  endStage("cache");

  // 2. Embedding: only the missing texts, batch by batch, reporting progress.
  const embedStart = performance.now();
  for (let start = 0; start < missing.length; start += batchSize) {
    const batch = missing.slice(start, start + batchSize);
    const vectors = await embedder.embed(batch.map((key) => textOfKey.get(key)!));
    if (vectors.length !== batch.length) throw new Error(`Expected ${batch.length} vectors, received ${vectors.length}.`);
    batch.forEach((key, i) => cached.set(key, vectors[i]));
    onProgress({ stage: "embedding", done: Math.min(start + batchSize, missing.length), total: missing.length, elapsedMs: performance.now() - embedStart });
  }
  if (missing.length === 0) onProgress({ stage: "embedding", done: 0, total: 0, elapsedMs: 0 });
  endStage("embedding");

  const vectors = keys.map((key) => cached.get(key)!);
  const dimensions = vectors[0].length;
  if (vectors.some((v) => v.length !== dimensions)) throw new Error("Vectors have inconsistent dimensions.");

  // 3. Writing: the index, its metadata, and the cache reduced to the current chunks.
  onProgress({ stage: "writing" });
  const rows: ChunkRow[] = chunks.map((chunk, i) => ({
    id: chunk.id,
    book: chunk.book,
    headingPath: JSON.stringify(chunk.headingPath),
    text: chunk.text,
    searchText: texts[i],
    pages: JSON.stringify(chunk.pages),
    hasTable: chunk.hasTable,
    notes: JSON.stringify(chunk.notes),
    section: chunk.section,
    piece: chunk.piece,
    pieceCount: chunk.pieceCount,
    vector: vectors[i],
  }));
  const meta: MetaRow = { model: embedder.model, dimensions, chunkCount: rows.length, builtAt: new Date().toISOString() };
  const cacheRows = [...new Set(keys)].map((key) => ({ key, vector: cached.get(key)! }));
  const tables = [
    await db.createTable(CHUNKS_TABLE, rows as unknown as Record<string, unknown>[], { mode: "overwrite" }),
    await db.createTable(META_TABLE, [meta as unknown as Record<string, unknown>], { mode: "overwrite" }),
    await db.createTable(CACHE_TABLE, cacheRows, { mode: "overwrite" }),
  ];
  endStage("writing");

  onProgress({ stage: "keyword-index" });
  await tables[0].createIndex(KEYWORD_COLUMN, { config: keywordIndex() });
  endStage("keywordIndex");

  // LanceDB keeps every previous version of a table. A rebuild replaces everything,
  // so older versions are never needed: remove them to keep data/index from growing.
  onProgress({ stage: "cleanup" });
  for (const table of tables) await table.optimize({ cleanupOlderThan: new Date() });
  endStage("cleanup");

  return { ...meta, reused, embedded: missing.length, timings };
}

/**
 * Reads every chunk stored in an index, without vectors and without needing the embedding model.
 * Used to compare what is indexed with what the chunker produces now.
 */
export async function listIndexedChunks(dir: string): Promise<IndexedChunk[]> {
  const db = await lancedb.connect(dir);
  if (!(await db.tableNames()).includes(CHUNKS_TABLE)) throw new Error(`No index found in ${dir}. Build it first.`);
  const table = await db.openTable(CHUNKS_TABLE);
  const rows = await table.query().select(["book", "headingPath", "text"]).limit(await table.countRows()).toArray();
  return rows.map((row) => ({ book: row.book, headingPath: JSON.parse(row.headingPath), text: row.text }));
}

/** A built index, opened for searching. */
export class RulesIndex {
  private constructor(
    private readonly table: lancedb.Table,
    private readonly embedder: Embedder,
    readonly meta: MetaRow,
  ) {}

  /** Opens an index and refuses to use it with a different embedding model than the one that built it. */
  static async open(dir: string, embedder: Embedder): Promise<RulesIndex> {
    const db = await lancedb.connect(dir);
    const tables = await db.tableNames();
    if (!tables.includes(CHUNKS_TABLE) || !tables.includes(META_TABLE)) {
      throw new Error(`No index found in ${dir}. Build it first.`);
    }
    const [meta] = (await (await db.openTable(META_TABLE)).query().toArray()) as MetaRow[];
    if (meta.model !== embedder.model) {
      throw new Error(
        `The index was built with "${meta.model}", but the current embedding model is "${embedder.model}". Rebuild the index.`,
      );
    }
    const table = await db.openTable(CHUNKS_TABLE);
    const indices = await table.listIndices();
    if (!indices.some((index) => index.columns.includes(KEYWORD_COLUMN))) {
      throw new Error("The index has no keyword search: it was built by an older version. Rebuild the index.");
    }
    const columns = (await table.schema()).fields.map((field) => field.name);
    if (!columns.includes("section") || !columns.includes("piece")) {
      throw new Error("The index has no piece numbers: it was built by an older version. Rebuild the index.");
    }
    return new RulesIndex(table, embedder, meta);
  }

  async count(): Promise<number> {
    return this.table.countRows();
  }

  /**
   * Finds the chunks most relevant to the question. In hybrid mode, runs a vector search (meaning)
   * and a keyword search (exact words), and combines their rankings with reciprocal rank fusion.
   */
  async search(question: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { limit = 5, mode = "hybrid" } = options;
    // Each search returns more candidates than needed, so the fusion has enough to choose from.
    const candidates = Math.max(limit * 4, 20);

    const vectorRows = mode === "keyword" ? [] : await this.vectorSearch(question, candidates);
    const keywordRows = mode === "vector" ? [] : await this.keywordSearch(question, candidates);

    const rowsById = new Map<string, Record<string, any>>();
    for (const row of [...vectorRows, ...keywordRows]) rowsById.set(row.id, row);
    const similarityById = new Map(vectorRows.map((row) => [row.id, 1 - row._distance]));

    const fused = reciprocalRankFusion([vectorRows.map((r) => r.id), keywordRows.map((r) => r.id)]);
    return fused.slice(0, limit).map(({ id, score, ranks }) => {
      const row = rowsById.get(id)!;
      return {
        id,
        book: row.book,
        headingPath: JSON.parse(row.headingPath),
        text: row.text,
        pages: JSON.parse(row.pages),
        hasTable: row.hasTable,
        score,
        vectorRank: ranks[0],
        // Cosine distance is 1 minus cosine similarity, so similarity is 1 minus the distance.
        similarity: similarityById.get(id),
        keywordRank: ranks[1],
        notes: row.notes ? JSON.parse(row.notes) : [],
        section: row.section,
        piece: row.piece,
        pieceCount: row.pieceCount,
      };
    });
  }

  /**
   * Turns search results into passages: adds the text pieces around each result from the same section,
   * with any tables in between, and merges results from the same section, within a size budget.
   * Passages keep the order of their best-ranked result.
   */
  async expand(results: SearchResult[], options: ExpandOptions = {}): Promise<Passage[]> {
    const { radius = 1, maxChars = 12_000 } = options;
    interface Piece {
      text: string;
      pages: number[];
      notes: string[];
      tableTitle?: string;
    }
    interface Group {
      first: SearchResult;
      ranks: number[];
      found: Set<number>;
      included: Map<number, Piece>;
    }
    // A table's rows don't say which table they are: its title goes in front of them.
    const render = (piece: Piece) => (piece.tableTitle ? `${piece.tableTitle}\n\n${piece.text}` : piece.text);

    const groups = new Map<string, Group>();
    results.forEach((result, i) => {
      const key = `${result.book}|${result.section}`;
      const group: Group = groups.get(key) ?? { first: result, ranks: [], found: new Set(), included: new Map() };
      group.ranks.push(i + 1);
      group.found.add(result.piece);
      group.included.set(result.piece, { text: result.text, pages: result.pages, notes: result.notes, tableTitle: tableTitleOf(result.headingPath) });
      groups.set(key, group);
    });

    // 1. The pieces the search found always go in.
    let used = [...groups.values()].reduce((sum, g) => sum + [...g.included.values()].reduce((s, p) => s + render(p).length + 2, 0), 0);

    // 2. Neighbours, group by group in rank order, closest first, within the budget.
    for (const group of groups.values()) {
      const { book, section, pieceCount } = group.first;
      if (pieceCount <= group.found.size) continue;
      const rows = await this.table
        .query()
        .where(`book = '${book.replace(/'/g, "''")}' AND section = ${section}`)
        .select(["piece", "text", "pages", "notes", "headingPath"])
        .limit(pieceCount)
        .toArray();
      const byPiece = new Map<number, Piece>(
        rows.map((row) => [
          row.piece,
          { text: row.text, pages: JSON.parse(row.pages), notes: row.notes ? JSON.parse(row.notes) : [], tableTitle: tableTitleOf(JSON.parse(row.headingPath)) },
        ]),
      );

      // Walk outwards from each found piece. Only text pieces count toward the radius; tables passed on the way come along.
      const distance = new Map<number, number>();
      for (const start of group.found) {
        for (const step of [-1, 1]) {
          let textPieces = 0;
          for (let n = start + step, d = 1; n >= 0 && n < pieceCount && textPieces < radius; n += step, d++) {
            const piece = byPiece.get(n);
            if (!piece) break;
            if (!group.found.has(n)) distance.set(n, Math.min(distance.get(n) ?? Infinity, d));
            if (!piece.tableTitle) textPieces++;
          }
        }
      }

      for (const n of [...distance.keys()].sort((a, b) => distance.get(a)! - distance.get(b)!)) {
        const piece = byPiece.get(n)!;
        const size = render(piece).length + 2;
        if (used + size <= maxChars) {
          used += size;
          group.included.set(n, piece);
        } else if (piece.tableTitle) {
          // Too big to include: name it, so the model knows the table exists.
          const pages = piece.pages.length ? `, p. ${piece.pages.join("-")}` : "";
          const placeholder = `[${piece.tableTitle}${pages}, not included]`;
          used += placeholder.length + 2;
          group.included.set(n, { text: placeholder, pages: [], notes: [] });
        }
      }
    }

    return [...groups.values()].map((group) => {
      const order = [...group.included.keys()].sort((a, b) => a - b);
      const pieces = order.map((n) => group.included.get(n)!);
      const parts = order.map((n, i) => (i > 0 && n !== order[i - 1] + 1 ? `[...]\n\n` : "") + render(group.included.get(n)!));
      const path = group.first.headingPath;
      return {
        book: group.first.book,
        // A passage is about the section, even when the best result was one of its tables.
        headingPath: tableTitleOf(path) ? path.slice(0, -1) : path,
        text: parts.join("\n\n"),
        pages: [...new Set(pieces.flatMap((p) => p.pages))].sort((a, b) => a - b),
        notes: [...new Set(pieces.flatMap((p) => p.notes))],
        pieces: order,
        pieceCount: group.first.pieceCount,
        resultRanks: group.ranks,
      };
    });
  }

  private async vectorSearch(question: string, limit: number) {
    const [vector] = await this.embedder.embed([question]);
    return this.table.vectorSearch(vector).distanceType("cosine").limit(limit).toArray();
  }

  private async keywordSearch(question: string, limit: number) {
    return this.table.query().fullTextSearch(question, { columns: KEYWORD_COLUMN }).limit(limit).toArray();
  }
}