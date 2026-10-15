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
  /** Line in the book file where the chunk's text starts (1-based), to find it when fixing the source. */
  line: number;
  /** True when the chunk contains a Markdown table. */
  hasTable: boolean;
}

export interface ChunkOptions {
  /** Size limit in characters before a section is split. Default 2000. */
  maxChars?: number;
}

/** A line of the book, with the printed pages it appears on (two if a page break falls inside it). */
interface Line {
  text: string;
  pages: number[];
  /** Line number in the book file, 1-based. */
  line: number;
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
/** A page marker anywhere in a line. The "g" flag finds every marker, not only the first. */
const PAGE_MARKER = /<!--\s*page\s+(\d+)\s*-->/gi;
/** A heading that is a table title, such as "Table 8: Racial Ability Adjustments". */
const TABLE_TITLE = /^\s*(?:\*\*)?\s*Table\s+\d+\s*[:.]/i;
const TABLE_ROW = /^\s*\|/;
/**
 * A table footnote: starts with a reference mark, an escaped asterisk (\*), possibly in italics (*\*),
 * a dagger, or "Note:". A normal bullet point ("* text") is not a footnote.
 */
const TABLE_NOTE = /^\s*[*_]{0,2}\s*(\\\*|†|‡|notes?:)/i;

/**
 * Splits a Markdown book into chunks that follow its headings.
 * Paragraphs and tables are never cut; long sections are split between paragraphs.
 */
export function chunkMarkdown(markdown: string, book: string, options: ChunkOptions = {}): Chunk[] {
  const maxChars = options.maxChars ?? 2000;
  const chunks: Chunk[] = [];
  // Counts pieces per heading path across the whole book, so a path that appears more than once
  // (a section continuing after a table, or two sections with the same title) never repeats an id.
  const piecesPerPath = new Map<string, number>();

  for (const section of splitIntoSections(markdown)) {
    const blocks = splitIntoBlocks(section.lines);
    for (const piece of packBlocks(blocks, maxChars)) {
      const text = blocksText(piece);
      const pathKey = section.headingPath.join("|");
      const index = piecesPerPath.get(pathKey) ?? 0;
      piecesPerPath.set(pathKey, index + 1);
      chunks.push({
        id: makeId(book, section.headingPath, index),
        book,
        headingPath: section.headingPath,
        text,
        pages: pagesOf(piece),
        line: piece[0].lines[0].line,
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
  /** While inside a "Table N:" section: where to return when the table ends, and whether rows have started. */
  let table: { parentPath: string[]; rowsSeen: boolean } | undefined;

  for (const [lineIndex, raw] of markdown.split(/\r?\n/).entries()) {
    const read = readPageMarkers(raw, page);
    page = read.page;
    if (read.markerOnly) continue;
    const text = read.text;

    const heading = HEADING.exec(text);
    if (heading) {
      sections.push(current);
      if (TABLE_TITLE.test(heading[2])) {
        // A table title covers only its table. Remember the section it sits in, to return there afterwards.
        const parentPath = table ? table.parentPath : current.headingPath;
        table = { parentPath, rowsSeen: false };
        current = { headingPath: [...parentPath, heading[2]], lines: [] };
        continue;
      }
      table = undefined;
      const level = heading[1].length;
      path.splice(level - 1); // forget headings at this level and deeper
      path[level - 1] = heading[2];
      current = { headingPath: path.filter((h): h is string => Boolean(h)), lines: [] };
      continue;
    }

    if (table) {
      if (TABLE_ROW.test(text)) {
        table.rowsSeen = true;
      } else if (table.rowsSeen && text.trim() !== "" && !TABLE_NOTE.test(text)) {
        // The table has ended: what follows belongs to the section the table sits in.
        sections.push(current);
        current = { headingPath: table.parentPath, lines: [] };
        table = undefined;
      }
    }
    if (!SEPARATOR.test(text)) current.lines.push({ text, pages: read.pages, line: lineIndex + 1 });
  }
  sections.push(current);
  return sections;
}

/**
 * Finds the page markers in a line, wherever they are, and removes them from the text.
 * Text before a marker belongs to the previous page, text after it to the new one.
 */
function readPageMarkers(raw: string, pageBefore: number | undefined) {
  const markers = [...raw.matchAll(PAGE_MARKER)];
  if (markers.length === 0) {
    return { text: raw, pages: pageBefore === undefined ? [] : [pageBefore], page: pageBefore, markerOnly: false };
  }
  const pages: number[] = [];
  if (pageBefore !== undefined && raw.slice(0, markers[0].index).trim() !== "") pages.push(pageBefore);
  markers.forEach((marker, i) => {
    const after = raw.slice(marker.index + marker[0].length, markers[i + 1]?.index ?? raw.length);
    if (after.trim() !== "") pages.push(Number(marker[1]));
  });
  const text = raw.replace(PAGE_MARKER, " ").replace(/\s{2,}/g, " ").trim();
  const page = Number(markers[markers.length - 1][1]);
  return { text, pages, page, markerOnly: text === "" };
}

/** Step 2: split a section into blocks at blank lines. A table has no blank lines, so it is one block. */
function splitIntoBlocks(lines: Line[]): Block[] {
  const blocks: Block[] = [];
  let current: Line[] = [];
  for (const line of [...lines, { text: "", pages: [], line: 0 }]) {
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
  const pages = blocks.flatMap((b) => b.lines.flatMap((l) => l.pages));
  return [...new Set(pages)].sort((a, b) => a - b);
}

function isTable(text: string): boolean {
  return text.split("\n").some((line) => TABLE_ROW.test(line));
}

function makeId(book: string, headingPath: string[], index: number): string {
  return createHash("sha1").update(`${book}|${headingPath.join("|")}|${index}`).digest("hex").slice(0, 16);
}
