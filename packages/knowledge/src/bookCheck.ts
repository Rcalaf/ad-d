/**
 * Structural checks for a converted Markdown book, run before indexing.
 * It finds problems a conversion typically introduces. It cannot tell whether a value is right,
 * only where the structure looks wrong, so each finding points to a place to check against the book.
 */

/** Fix: certainly wrong. Review: probably wrong, needs judgment against the book. Info: fine, worth knowing. */
export type Severity = "fix" | "review" | "info";

export type FindingKind =
  | "heading-jump"
  | "table-no-separator"
  | "table-columns"
  | "table-no-title"
  | "table-number-missing"
  | "table-number-duplicate"
  | "page-order"
  | "page-jump"
  | "unclear";

export interface Finding {
  kind: FindingKind;
  severity: Severity;
  /** 1-based line number in the book file, when the finding has one. */
  line?: number;
  /** The line as written in the file, to recognize it when fixing. */
  excerpt?: string;
  message: string;
  hint: string;
}

export interface BookReport {
  findings: Finding[];
  headingsByLevel: Record<number, number>;
  tableCount: number;
  tableNumbers: number[];
  pages: { count: number; first?: number; last?: number };
}

const HEADING = /^(#{1,6})\s+(.+?)\s*$/;
const PAGE_MARKER = /^\s*<!--\s*page\s+(\d+)\s*-->\s*$/i;
const UNCLEAR = /<!--\s*UNCLEAR:?\s*(.*?)\s*-->/i;
const TABLE_ROW = /^\s*\|/;
const SEPARATOR_ROW = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;
/** A table title at the start of a line, as a heading, in bold, or plain: "#### Table 14: ...". */
const TABLE_TITLE = /^\s*(?:#{1,6}\s+|\*\*)?\s*Table\s+(\d+)\s*[:.]/i;

export function checkBook(markdown: string): BookReport {
  const lines = markdown.split(/\r?\n/);
  const findings: Finding[] = [];
  const headingsByLevel = checkHeadings(lines, findings);
  const tableCount = checkTables(lines, findings);
  const tableNumbers = checkTableNumbers(lines, findings);
  const pages = checkPages(lines, findings);
  checkUnclear(lines, findings);
  findings.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
  return { findings, headingsByLevel, tableCount, tableNumbers, pages };
}

/** Headings should go down one level at a time: a "####" directly under a "##" means a level is missing. */
function checkHeadings(lines: string[], findings: Finding[]): Record<number, number> {
  const byLevel: Record<number, number> = {};
  let previous = 0;
  lines.forEach((text, i) => {
    const heading = HEADING.exec(text);
    if (!heading) return;
    const level = heading[1].length;
    byLevel[level] = (byLevel[level] ?? 0) + 1;
    if (previous > 0 && level > previous + 1) {
      const suggested = "#".repeat(previous + 1);
      const isTableTitle = TABLE_TITLE.test(text);
      findings.push({
        kind: "heading-jump",
        severity: isTableTitle ? "info" : "review",
        line: i + 1,
        excerpt: text.trim(),
        message: `Heading jumps from level ${previous} to level ${level}.`,
        hint: isTableTitle
          ? "Harmless for search: this is a table title, and the chunker skips the missing levels. Leave it unless you want consistent levels."
          : `If this section belongs directly under the previous heading, change "${heading[1]}" to "${suggested}". Leave it if the book really nests it this way.`,
      });
    }
    previous = level;
  });
  return byLevel;
}

/** Every table needs a separator row, the same number of columns in every row, and a title above it. */
function checkTables(lines: string[], findings: Finding[]): number {
  let count = 0;
  let i = 0;
  while (i < lines.length) {
    if (!TABLE_ROW.test(lines[i])) {
      i++;
      continue;
    }
    const start = i;
    while (i < lines.length && TABLE_ROW.test(lines[i])) i++;
    const rows = lines.slice(start, i);
    const columns = cellCount(rows[0]);
    count++;

    if (rows.length < 2 || !SEPARATOR_ROW.test(rows[1])) {
      findings.push({
        kind: "table-no-separator",
        severity: "fix",
        line: start + 1,
        excerpt: rows[0].trim(),
        message: "Table has no separator row after its header, so it is not a valid Markdown table.",
        hint: `Add this line right after the header row: ${"| " + Array(columns).fill("---").join(" | ") + " |"}`,
      });
    }
    rows.forEach((row, offset) => {
      const cells = cellCount(row);
      if (cells === columns) return;
      findings.push({
        kind: "table-columns",
        severity: "fix",
        line: start + offset + 1,
        excerpt: row.trim(),
        message: `Row has ${cells} cells; the header has ${columns}.`,
        hint:
          cells < columns
            ? "Compare with the printed table. A missing value needs an empty cell (| |) in its position; a row that continues on the next line should be joined into one."
            : "Compare with the printed table. Extra cells usually mean a value was split in two, or a stray | character entered the text.",
      });
    });
    const above = lines.slice(Math.max(0, start - 4), start).filter((l) => l.trim() !== "");
    if (!above.some((l) => TABLE_TITLE.test(l))) {
      findings.push({
        kind: "table-no-title",
        severity: "review",
        line: start + 1,
        excerpt: rows[0].trim(),
        message: "No 'Table N:' title in the lines above this table.",
        hint: 'Add the title as printed in the book on its own line above the table, for example "#### Table 12: Title". If the book prints this table without a number, leave it.',
      });
    }
  }
  return count;
}

function cellCount(row: string): number {
  return row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").length;
}

/** Numbered tables should form a sequence: a missing number usually means a table was lost or mislabeled. */
function checkTableNumbers(lines: string[], findings: Finding[]): number[] {
  const occurrences = new Map<number, number[]>();
  lines.forEach((text, i) => {
    const match = TABLE_TITLE.exec(text);
    if (!match) return;
    const n = Number(match[1]);
    occurrences.set(n, [...(occurrences.get(n) ?? []), i + 1]);
  });
  const found = [...occurrences.keys()].sort((a, b) => a - b);

  for (let n = found[0]; found.length > 0 && n <= found[found.length - 1]; n++) {
    if (occurrences.has(n)) continue;
    findings.push({
      kind: "table-number-missing",
      severity: "review",
      message: `Table ${n} is missing from the sequence ${found[0]} to ${found[found.length - 1]}.`,
      hint: `Look for Table ${n} in the printed book. If it exists, add it with its title in the right place; if the book skips the number, ignore this.`,
    });
  }
  for (const [n, at] of occurrences) {
    if (at.length < 2) continue;
    for (const line of at) {
      findings.push({
        kind: "table-number-duplicate",
        severity: "review",
        line,
        excerpt: lines[line - 1].trim(),
        message: `Table ${n} appears ${at.length} times (lines ${at.join(", ")}).`,
        hint: "Check the number against the book: usually one of them is a different table with a misread number, or the same title was repeated.",
      });
    }
  }
  return found;
}

/** Page markers should increase by one; a jump suggests a skipped page, a repeat or decrease a mislabel. */
function checkPages(lines: string[], findings: Finding[]) {
  const pages: number[] = [];
  lines.forEach((text, i) => {
    const match = PAGE_MARKER.exec(text);
    if (!match) return;
    const page = Number(match[1]);
    const previous = pages.at(-1);
    if (previous !== undefined && page <= previous) {
      findings.push({
        kind: "page-order",
        severity: "fix",
        line: i + 1,
        excerpt: text.trim(),
        message: `Page ${page} comes after page ${previous}.`,
        hint: "Check the page number against the book; a repeated or decreasing number gives wrong citations for everything until the next marker.",
      });
    } else if (previous !== undefined && page > previous + 1) {
      findings.push({
        kind: "page-jump",
        severity: "review",
        line: i + 1,
        excerpt: text.trim(),
        message: `Pages jump from ${previous} to ${page}.`,
        hint: `Check whether pages ${previous + 1} to ${page - 1} are missing from the conversion. Full-page illustrations or blank pages legitimately have no text.`,
      });
    }
    pages.push(page);
  });
  return { count: pages.length, first: pages[0], last: pages.at(-1) };
}

function checkUnclear(lines: string[], findings: Finding[]): void {
  lines.forEach((text, i) => {
    const match = UNCLEAR.exec(text);
    if (!match) return;
    findings.push({
      kind: "unclear",
      severity: "fix",
      line: i + 1,
      excerpt: text.trim(),
      message: `Marked unclear by the converter: ${match[1] || "no description"}.`,
      hint: "Check this passage on the printed page, write the correct text, and remove the marker.",
    });
  });
}