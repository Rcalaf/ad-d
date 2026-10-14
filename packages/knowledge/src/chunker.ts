import { createHash } from "node:crypto";

/** A retrievable piece of a book: one section, or part of a long section. */
export interface Chunk {
  /** Stable id: the same book content always produces the same id. */
  id: string;
  /** Which book the chunk comes from, for example "phb" or "dmg". */
  book: string;
  /** Headings above the chunk, from the book title down to the subsection. */
  headingPath: string[];
  /** The section text, without its heading and without page markers. */
  text: string;
  /** Printed pages the chunk comes from; empty if the book has no page markers. */
  pages: number[];
  /** True when the chunk contains a Markdown table. */
  hasTable: boolean;
}

export interface ChunkOptions {
  /** Size limit in characters before a section is split. Default 2000. */
  maxChars?: number;
}

/** A line of the book, with the printed page it appears on. */
interface Line {
  text: string;
  page?: number;
}

/** A paragraph or a table: the smallest unit the chunker never cuts. */
interface Block {
  lines: Line[];
}

interface Section {
  headingPath: string[];
  lines: Line[];
}

const HEADING = /^(#{1,6})\s+(.+?)\s*$/;
const SEPARATOR = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
const PAGE_MARKER = /^\s*<!--\s*page\s+(\d+)\s*-->\s*$/i;

/**
 * Splits a Markdown book into chunks that follow its headings.
 * Paragraphs and tables are never cut; long sections are split between paragraphs.
 */
export function chunkMarkdown(markdown: string, book: string, options: ChunkOptions = {}): Chunk[] {
  const maxChars = options.maxChars ?? 2000;
  const chunks: Chunk[] = [];

  for (const section of splitIntoSections(markdown)) {
    const blocks = splitIntoBlocks(section.lines);
    for (const [index, piece] of packBlocks(blocks, maxChars).entries()) {
      const text = blocksText(piece);
      chunks.push({
        id: makeId(book, section.headingPath, index),
        book,
        headingPath: section.headingPath,
        text,
        pages: pagesOf(piece),
        hasTable: isTable(text),
      });
    }
  }
  return chunks;
}

/** The text used to create the embedding: the heading path gives the passage its context. */
export function embeddingText(chunk: Chunk): string {
  return `${chunk.headingPath.join(" > ")}\n\n${chunk.text}`;
}

/** Step 1: walk the lines, track headings and pages, and group lines by section. */
function splitIntoSections(markdown: string): Section[] {
  const path: (string | undefined)[] = [];
  const sections: Section[] = [];
  let current: Section = { headingPath: [], lines: [] };
  let page: number | undefined;

  for (const text of markdown.split(/\r?\n/)) {
    const pageMarker = PAGE_MARKER.exec(text);
    if (pageMarker) {
      page = Number(pageMarker[1]);
      continue;
    }
    const heading = HEADING.exec(text);
    if (heading) {
      sections.push(current);
      const level = heading[1].length;
      path.splice(level - 1); // forget headings at this level and deeper
      path[level - 1] = heading[2];
      current = { headingPath: path.filter((h): h is string => Boolean(h)), lines: [] };
      continue;
    }
    if (!SEPARATOR.test(text)) current.lines.push({ text, page });
  }
  sections.push(current);
  return sections;
}

/** Step 2: split a section into blocks at blank lines. A table has no blank lines, so it is one block. */
function splitIntoBlocks(lines: Line[]): Block[] {
  const blocks: Block[] = [];
  let current: Line[] = [];
  for (const line of [...lines, { text: "" }]) {
    if (line.text.trim() === "") {
      if (current.length > 0) blocks.push({ lines: current });
      current = [];
    } else {
      current.push(line);
    }
  }
  return blocks;
}

/**
 * Step 3: group consecutive blocks into pieces up to maxChars.
 * An oversized table stays whole; an oversized text block (a glossary, a long dialogue)
 * is split into its lines first, since each line is usually a self-contained entry.
 */
function packBlocks(blocks: Block[], maxChars: number): Block[][] {
  const units = blocks.flatMap((block) =>
    blockText(block).length > maxChars && !isTable(blockText(block)) ? block.lines.map((line) => ({ lines: [line] })) : [block],
  );
  const pieces: Block[][] = [];
  let current: Block[] = [];
  for (const unit of units) {
    const candidate = [...current, unit];
    if (current.length > 0 && blocksText(candidate).length > maxChars) {
      pieces.push(current);
      current = [unit];
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) pieces.push(current);
  return pieces;
}

function blockText(block: Block): string {
  return block.lines.map((line) => line.text.trim()).join("\n");
}

function blocksText(blocks: Block[]): string {
  return blocks.map(blockText).join("\n\n");
}

function pagesOf(blocks: Block[]): number[] {
  const pages = blocks.flatMap((b) => b.lines.map((l) => l.page)).filter((p): p is number => p !== undefined);
  return [...new Set(pages)].sort((a, b) => a - b);
}

function isTable(text: string): boolean {
  return text.split("\n").some((line) => line.trimStart().startsWith("|"));
}

function makeId(book: string, headingPath: string[], index: number): string {
  return createHash("sha1").update(`${book}|${headingPath.join("|")}|${index}`).digest("hex").slice(0, 16);
}
