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
  /**
   * Converter notes about this text, such as "UNCLEAR: header cells not detected". Removed from the text,
   * since they are not book content, but kept so an agent can warn that a source may be unreliable.
   */
  notes: string[];
  /** True when the chunk contains a Markdown table. */
  hasTable: boolean;
  /**
   * Number of the section in the book, counting sections in book order from 0. Tables belong to the
   * section they sit in, so a section's pieces run in book order: text, table, text after the table.
   */
  section: number;
  /** Position of the chunk within its section, from 0. */
  piece: number;
  /** How many pieces the section has. */
  pieceCount: number;
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
  /** Converter notes that apply to this line. */
  notes: string[];
}

/** A paragraph or a table: the smallest unit the chunker never cuts. */
interface Block {
  lines: Line[];
}

interface Section {
  headingPath: string[];
  lines: Line[];
  /**
   * Sections that share a group are one stretch of the book: a section, the tables inside it,
   * and its text after each table. A new heading (real or bold) starts a new group.
   */
  group: number;
}

const HEADING = /^(#{1,6})\s+(.+?)\s*$/;
const SEPARATOR = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
/** A page marker anywhere in a line. The "g" flag finds every marker, not only the first. */
const PAGE_MARKER = /<!--\s*page\s+(\d+)\s*-->/gi;
/** A heading that is a table title, such as "Table 8: Racial Ability Adjustments" or "Table 83". */
const TABLE_TITLE = /^\s*(?:\*\*)?\s*Table\s+\d+\b/i;
/** Any HTML comment except page markers: notes the converter left, such as <!-- UNCLEAR: ... -->. */
const NOTE_COMMENT = /<!--(?!\s*page\s+\d+\s*-->)\s*([\s\S]*?)\s*-->/gi;
/** A line that is entirely bold text. */
const BOLD_LINE = /^\s*\*\*([^*]+)\*\*\s*$/;
const TABLE_ROW = /^\s*\|/;
/**
 * A table footnote: starts with a reference mark: an escaped asterisk (\*), possibly in italics (*\*),
 * a dagger, "Note:", or one to three plain asterisks and a space ("* Maximum spell ability").
 * A bullet with a bold label ("* **Granted Powers:** ...") is not a footnote.
 */
const TABLE_NOTE = /^\s*(?:[*_]{0,2}\s*(\\\*|†|‡|notes?:)|\*{1,3}\s+(?!\*\*))/i;

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
  // Section numbers follow the groups in book order, counting only groups that produce chunks.
  const sectionOfGroup = new Map<number, number>();
  const piecesInSection = new Map<number, number>();

  for (const section of splitIntoSections(markdown)) {
    const pieces = packBlocks(splitIntoBlocks(section.lines), maxChars);
    if (pieces.length === 0) continue;
    if (!sectionOfGroup.has(section.group)) sectionOfGroup.set(section.group, sectionOfGroup.size);
    const sectionNumber = sectionOfGroup.get(section.group)!;
    for (const piece of pieces) {
      const text = blocksText(piece);
      const pathKey = section.headingPath.join("|");
      const index = piecesPerPath.get(pathKey) ?? 0;
      piecesPerPath.set(pathKey, index + 1);
      const position = piecesInSection.get(sectionNumber) ?? 0;
      piecesInSection.set(sectionNumber, position + 1);
      chunks.push({
        id: makeId(book, section.headingPath, index),
        book,
        headingPath: section.headingPath,
        text,
        pages: pagesOf(piece),
        line: piece[0].lines[0].line,
        notes: [...new Set(piece.flatMap((b) => b.lines.flatMap((l) => l.notes)))],
        hasTable: isTable(text),
        section: sectionNumber,
        piece: position,
        pieceCount: 0, // set below, once the whole section is known
      });
    }
  }
  for (const chunk of chunks) chunk.pieceCount = piecesInSection.get(chunk.section)!;
  return chunks;
}

/** The text used to create the embedding: the heading path gives the passage its context. */
export function embeddingText(chunk: Chunk): string {
  return `${chunk.headingPath.join(" > ")}\n\n${chunk.text}`;
}

/** Step 1: walk the lines, track headings and pages, and group lines by section. */
function splitIntoSections(markdown: string): Section[] {
  const lines = markdown.split(/\r?\n/);
  const path: (string | undefined)[] = [];
  const sections: Section[] = [];
  let group = 0;
  let current: Section = { headingPath: [], lines: [], group };
  let page: number | undefined;
  /** Level of the last real (#) heading: bold subheadings go one level below it. */
  let headingLevel = 0;
  /** Notes from comment-only lines, waiting for the next line of content they describe. */
  let pendingNotes: string[] = [];
  /** While inside a "Table N:" section: where to return when the table ends, and whether rows have started. */
  let table: { parentPath: string[]; rowsSeen: boolean } | undefined;

  const startSection = (level: number, title: string) => {
    path.splice(level - 1); // forget headings at this level and deeper
    path[level - 1] = title;
    current = { headingPath: path.filter((h): h is string => Boolean(h)), lines: [], group: ++group };
  };

  for (const [lineIndex, raw] of lines.entries()) {
    const read = readMarkers(raw, page);
    page = read.page;
    if (read.markerOnly) {
      pendingNotes.push(...read.notes);
      continue;
    }
    const text = read.text;

    const heading = HEADING.exec(text);
    if (heading) {
      sections.push(current);
      if (TABLE_TITLE.test(heading[2])) {
        // A table title covers only its table. Remember the section it sits in, to return there afterwards.
        const parentPath = table ? table.parentPath : current.headingPath;
        table = { parentPath, rowsSeen: false };
        // The table stays in the group of the section it sits in.
        current = { headingPath: [...parentPath, heading[2]], lines: [], group: current.group };
        continue;
      }
      table = undefined;
      headingLevel = heading[1].length;
      startSection(headingLevel, heading[2]);
      continue;
    }

    const boldTitle = boldHeadingTitle(lines, lineIndex);
    // A bold line repeating the current section's title adds nothing: keep it as text.
    if (boldTitle !== undefined && boldTitle !== current.headingPath.at(-1)) {
      // A bold line standing alone: a subheading the converter wrote as bold text.
      sections.push(current);
      table = undefined;
      startSection(headingLevel + 1, boldTitle);
      continue;
    }

    if (table) {
      if (TABLE_ROW.test(text)) {
        table.rowsSeen = true;
      } else if (table.rowsSeen && text.trim() !== "" && !TABLE_NOTE.test(text)) {
        // The table has ended: what follows belongs to the section the table sits in.
        sections.push(current);
        current = { headingPath: table.parentPath, lines: [], group: current.group };
        table = undefined;
      }
    }
    if (SEPARATOR.test(text)) continue;
    const notes = text.trim() === "" ? [] : [...pendingNotes, ...read.notes];
    if (text.trim() !== "") pendingNotes = [];
    current.lines.push({ text, pages: read.pages, line: lineIndex + 1, notes });
  }
  sections.push(current);
  return sections;
}

/** Short words that stay lowercase in English titles ("Fighting from Horseback"). */
const TITLE_SMALL_WORDS = new Set(["a", "an", "the", "and", "or", "nor", "but", "of", "to", "in", "on", "at", "for", "from", "by", "with", "as", "vs", "per", "into", "onto"]);
const MAX_TITLE_WORDS = 8;

/** The table title at the end of a heading path, such as "Table 8: Racial Ability Adjustments", if any. */
export function tableTitleOf(headingPath: string[]): string | undefined {
  const last = headingPath.at(-1);
  return last !== undefined && TABLE_TITLE.test(last) ? last : undefined;
}

/**
 * The title of a bold line that stands alone between blank lines, like "**Weapons Allowed**",
 * or undefined if the line is not one. Real subheadings in these books are short titles with
 * capitalized words; garbled converter output and sentences are not, so they are rejected:
 * lines ending in punctuation, spell school labels like "(Alteration)" (with or without a word
 * after them), table fragments ("Table 89:"), lines over 8 words, and lowercase content words
 * (words inside parentheses don't count: "Step 1: Roll Ability Scores (chapter 1)" is a title).
 * Shared with the book checker, so both apply exactly the same rule.
 */
export function boldHeadingTitle(lines: string[], index: number): string | undefined {
  const match = BOLD_LINE.exec(lines[index] ?? "");
  if (!match) return undefined;
  const title = match[1].trim();
  const blankBefore = index === 0 || lines[index - 1].trim() === "";
  const blankAfter = index === lines.length - 1 || lines[index + 1].trim() === "";
  if (!blankBefore || !blankAfter) return undefined;
  if (title.length < 3 || /[.:;,]$/.test(title) || title.startsWith("(") || /Table\s*\d/i.test(title)) return undefined;
  const words = title.replace(/\([^)]*\)/g, " ").split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
  if (words.length === 0 || words.length > MAX_TITLE_WORDS) return undefined;
  const lowercaseContent = words.some((w, i) => i > 0 && /^[a-z]/.test(w) && !TITLE_SMALL_WORDS.has(w.toLowerCase()));
  if (lowercaseContent || /^[a-z]/.test(words[0])) return undefined;
  return title;
}

/**
 * Finds the page markers and converter notes in a line, wherever they are, and removes them from the text.
 * Text before a page marker belongs to the previous page, text after it to the new one.
 */
function readMarkers(raw: string, pageBefore: number | undefined) {
  const notes = [...raw.matchAll(NOTE_COMMENT)].map((m) => m[1].trim()).filter(Boolean);
  const withoutNotes = notes.length > 0 ? raw.replace(NOTE_COMMENT, " ") : raw;
  const markers = [...withoutNotes.matchAll(PAGE_MARKER)];
  const pages: number[] = [];
  if (markers.length === 0) {
    if (pageBefore !== undefined) pages.push(pageBefore);
  } else {
    if (pageBefore !== undefined && withoutNotes.slice(0, markers[0].index).trim() !== "") pages.push(pageBefore);
    markers.forEach((marker, i) => {
      const after = withoutNotes.slice(marker.index + marker[0].length, markers[i + 1]?.index ?? withoutNotes.length);
      if (after.trim() !== "") pages.push(Number(marker[1]));
    });
  }
  const changed = notes.length > 0 || markers.length > 0;
  const text = changed ? withoutNotes.replace(PAGE_MARKER, " ").replace(/\s{2,}/g, " ").trim() : raw;
  const page = markers.length > 0 ? Number(markers[markers.length - 1][1]) : pageBefore;
  return { text, pages, page, notes, markerOnly: changed && text === "" };
}

/** Step 2: split a section into blocks at blank lines. A table has no blank lines, so it is one block. */
function splitIntoBlocks(lines: Line[]): Block[] {
  const blocks: Block[] = [];
  let current: Line[] = [];
  for (const line of [...lines, { text: "", pages: [], line: 0, notes: [] }]) {
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