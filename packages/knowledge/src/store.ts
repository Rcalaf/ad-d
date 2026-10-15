import * as lancedb from "@lancedb/lancedb";
import { embeddingText, type Chunk } from "./chunker";
import type { Embedder } from "./embedder";
import { reciprocalRankFusion } from "./fusion";

const CHUNKS_TABLE = "chunks";
const META_TABLE = "meta";

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
  vector: number[];
}

interface MetaRow {
  model: string;
  dimensions: number;
  chunkCount: number;
  builtAt: string;
}

/** Embeds the chunks and writes a new index, replacing any previous one in the same folder. */
export async function buildIndex(dir: string, chunks: Chunk[], embedder: Embedder): Promise<MetaRow> {
  if (chunks.length === 0) throw new Error("No chunks to index.");

  const vectors = await embedder.embed(chunks.map(embeddingText));
  if (vectors.length !== chunks.length) {
    throw new Error(`Expected ${chunks.length} vectors, received ${vectors.length}.`);
  }
  const dimensions = vectors[0].length;
  if (vectors.some((v) => v.length !== dimensions)) throw new Error("Vectors have inconsistent dimensions.");

  const rows: ChunkRow[] = chunks.map((chunk, i) => ({
    id: chunk.id,
    book: chunk.book,
    headingPath: JSON.stringify(chunk.headingPath),
    text: chunk.text,
    searchText: embeddingText(chunk),
    pages: JSON.stringify(chunk.pages),
    hasTable: chunk.hasTable,
    vector: vectors[i],
  }));
  const meta: MetaRow = { model: embedder.model, dimensions, chunkCount: rows.length, builtAt: new Date().toISOString() };

  const db = await lancedb.connect(dir);
  const tables = [
    await db.createTable(CHUNKS_TABLE, rows as unknown as Record<string, unknown>[], { mode: "overwrite" }),
    await db.createTable(META_TABLE, [meta as unknown as Record<string, unknown>], { mode: "overwrite" }),
  ];
  await tables[0].createIndex(KEYWORD_COLUMN, { config: keywordIndex() });
  // LanceDB keeps every previous version of a table. A rebuild replaces everything,
  // so older versions are never needed: remove them to keep data/index from growing.
  for (const table of tables) await table.optimize({ cleanupOlderThan: new Date() });
  return meta;
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
