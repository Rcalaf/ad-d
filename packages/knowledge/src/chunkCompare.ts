import type { Chunk } from "./chunker";
import type { IndexedChunk } from "./store";

export interface ChunkChange {
  book: string;
  text: string;
  /** Location before (in the index), if the text existed there. */
  before?: string[];
  /** Location now (from the chunker), if the text exists now. */
  after?: string[];
}

export interface ChunkComparison {
  unchanged: number;
  /** Same text, different location: a heading change or a new subheading. */
  moved: ChunkChange[];
  /** Text that exists now but was not indexed: new, or changed in content. */
  added: ChunkChange[];
  /** Text that was indexed but is not produced any more: removed, or changed in content. */
  removed: ChunkChange[];
}

/**
 * Compares the chunks in an index with the chunks the chunker produces now from the same books.
 * Texts are compared with whitespace normalized; a changed text shows up as one removed and one added.
 */
export function compareChunks(indexed: IndexedChunk[], current: Chunk[]): ChunkComparison {
  const key = (book: string, text: string) => `${book}\u0000${text.replace(/\s+/g, " ").trim()}`;
  const before = new Map<string, IndexedChunk[]>();
  for (const c of indexed) before.set(key(c.book, c.text), [...(before.get(key(c.book, c.text)) ?? []), c]);

  const result: ChunkComparison = { unchanged: 0, moved: [], added: [], removed: [] };
  for (const c of current) {
    const candidates = before.get(key(c.book, c.text));
    if (!candidates || candidates.length === 0) {
      result.added.push({ book: c.book, text: c.text, after: c.headingPath });
      continue;
    }
    // Prefer a match at the same location; otherwise the text moved.
    const samePlace = candidates.findIndex((old) => old.headingPath.join("|") === c.headingPath.join("|"));
    const [match] = candidates.splice(samePlace >= 0 ? samePlace : 0, 1);
    if (samePlace >= 0) result.unchanged++;
    else result.moved.push({ book: c.book, text: c.text, before: match.headingPath, after: c.headingPath });
  }
  for (const remaining of before.values()) {
    for (const c of remaining) result.removed.push({ book: c.book, text: c.text, before: c.headingPath });
  }
  return result;
}
