import { boldHeadingTitle } from "./chunker";

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
  | "table-title-in-table"
  | "table-flattened"
  | "table-number-missing"
  | "table-number-duplicate"
  | "page-order"
  | "page-jump"
  | "page-inline"
  | "unclear"
  | "heading-underlined"
  | "heading-bold-line"
  | "heading-long"
  | "heading-empty"
  | "heading-markup"
  | "table-no-leading-pipe"
  | "table-html"
  | "text-hyphenation"
  | "text-repeated-line"
  | "text-bare-number"
  | "text-encoding"
  | "text-code-fence"
  | "text-html"
  | "text-garbled"
  | "chunk-short"
  | "chunk-duplicate"
  | "chunk-starts-midsentence"
  | "chunk-table-title-without-table"
  | "chunk-no-heading"
  | "chunk-oversized-text";

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
/** A page marker anywhere in a line. */
const PAGE_MARKER = /<!--\s*page\s+(\d+)\s*-->/gi;
const UNCLEAR = /<!--\s*UNCLEAR:?\s*(.*?)\s*-->/i;
const TABLE_ROW = /^\s*\|/;
const SEPARATOR_ROW = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;
/**
 * A table title: as a heading, with or without a colon ("#### Table 14: ...", "#### Table 83"),
 * or as a bold or plain line with a colon ("**Table 14: ...**"). Plain lines need the colon,
 * so a sentence like "Table 31 can be used..." is not mistaken for a title.
 */
const TABLE_TITLE = /^\s*(?:#{1,6}\s+(?:\*\*)?\s*Table\s+(\d+)\b|(?:\*\*)?\s*Table\s+(\d+)\s*[:.])/i;
const tableNumber = (match: RegExpExecArray) => Number(match[1] ?? match[2]);
/** Fragments of a table title inside table cells, such as "Tab Wis" or "able 3:". */
const TITLE_IN_TABLE = /\bTab|able\s*\d+\s*:/i;

export function checkBook(markdown: string): BookReport {
  const lines = markdown.split(/\r?\n/);
  const findings: Finding[] = [];
  const headingsByLevel = checkHeadings(lines, findings);
  const tableCount = checkTables(lines, findings);
  const tableNumbers = checkTableNumbers(lines, findings);
  const pages = checkPages(lines, findings);
  checkUnclear(lines, findings);
  checkHeadingShapes(lines, findings);
  checkTableShapes(lines, findings);
  checkText(lines, findings);
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
      const previousRow = previousContentLine(lines, start);
      const continues = previousRow !== undefined && TABLE_ROW.test(lines[previousRow]);
      findings.push({
        kind: "table-no-separator",
        severity: "fix",
        line: start + 1,
        excerpt: rows[0].trim(),
        message: continues
          ? `Rows without a header: this probably continues the table that ends at line ${previousRow + 1}, split by a blank line or page break.`
          : "Table has no separator row after its header, so it is not a valid Markdown table.",
        hint: continues
          ? "Join the two parts: remove the blank lines between them, and move any page marker that sits between them to just after the table."
          : `Add this line right after the header row: ${"| " + Array(columns).fill("---").join(" | ") + " |"}`,
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
    const titleInside = rows.slice(0, 2).find((row) => TITLE_IN_TABLE.test(row));
    if (titleInside) {
      findings.push({
        kind: "table-title-in-table",
        severity: "fix",
        line: start + 1,
        excerpt: titleInside.trim(),
        message: "The table's title seems to have been captured inside the table, broken across cells.",
        hint: 'Move the title above the table as "#### Table N: Title", and check every header cell and value against the printed page: when the title was misplaced, columns have often shifted too.',
      });
    } else if (!above.some((l) => TABLE_TITLE.test(l))) {
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
    const n = tableNumber(match);
    occurrences.set(n, [...(occurrences.get(n) ?? []), i + 1]);
  });
  const found = [...occurrences.keys()].sort((a, b) => a - b);

  for (let n = found[0]; found.length > 0 && n <= found[found.length - 1]; n++) {
    if (occurrences.has(n)) continue;
    findings.push({
      kind: "table-number-missing",
      severity: "review",
      message: `Table ${n} is missing from the sequence ${found[0]} to ${found[found.length - 1]}.`,
      hint: `Look for Table ${n} in the printed book. Often its title was captured inside another table (see table-title-in-table findings). If the table exists, give it its title; if the book skips the number, ignore this.`,
    });
  }
  for (const [n, at] of occurrences) {
    if (at.length < 2) continue;
    // A "#### Table N" heading followed within a few lines by "Table N: ..." as plain text:
    // the converter wrote the table as one line of text. Report that, not a duplicate.
    const flattened = at.find((line, i) => {
      const heading = at[i - 1];
      const text = lines[line - 1];
      // A flattened table carries its values on the line: several numbers after the title.
      const values = (text.replace(TABLE_TITLE, "").match(/\d+/g) ?? []).length;
      return heading !== undefined && line - heading <= 6 && HEADING.test(lines[heading - 1]) && !HEADING.test(text) && !TABLE_ROW.test(text) && values >= 4;
    });
    if (flattened !== undefined && at.length === 2) {
      findings.push({
        kind: "table-flattened",
        severity: "fix",
        line: flattened,
        excerpt: lines[flattened - 1].trim(),
        message: `Table ${n} was written as a single line of text instead of a table.`,
        hint: `Rebuild it from the printed page as a Markdown table under its heading "#### Table ${n}: Title", and move any text that follows the values on the same line back into the paragraph it belongs to.`,
      });
      continue;
    }
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
    const markers = [...text.matchAll(PAGE_MARKER)];
    if (markers.length > 0 && text.replace(PAGE_MARKER, "").trim() !== "") {
      findings.push({
        kind: "page-inline",
        severity: "info",
        line: i + 1,
        excerpt: text.trim(),
        message: "Page marker inside a line of text.",
        hint: "Handled automatically: the chunker removes the marker and records both pages. Move it to its own line only if you prefer a cleaner file.",
      });
    }
    for (const marker of markers) {
      const page = Number(marker[1]);
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
    }
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

/** The index of the closest line above `index` that has content, skipping blank lines and page markers. */
function previousContentLine(lines: string[], index: number): number | undefined {
  for (let i = index - 1; i >= 0; i--) {
    const text = lines[i].replace(PAGE_MARKER, "").trim();
    if (text !== "") return i;
  }
  return undefined;
}

const UNDERLINE = /^\s*(=+|-+)\s*$/;
const HEADING_MARKUP = /[*_`[\]]|#\s*$/;
const MAX_HEADING_CHARS = 100;

/** Headings that won't be recognized as headings, or that are probably not headings at all. */
function checkHeadingShapes(lines: string[], findings: Finding[]): void {
  lines.forEach((text, i) => {
    const next = lines[i + 1];
    const before = lines[i - 1];
    // An underlined heading: a text line directly followed by a line of = or -.
    if (text.trim() !== "" && !HEADING.test(text) && !TABLE_ROW.test(text) && next !== undefined && UNDERLINE.test(next)) {
      const level = next.trim().startsWith("=") ? "##" : "###";
      findings.push({
        kind: "heading-underlined",
        severity: "review",
        line: i + 1,
        excerpt: `${text.trim()} / ${next.trim()}`,
        message: "Heading written as underlined text. The chunker does not recognize this style, and removes the underline as a separator.",
        hint: `Write it as "${level} ${text.trim()}" (choosing the level that fits the book's structure), and delete the underline.`,
      });
    }
    // A bold line standing alone: the chunker treats it as a subheading, using the same rule.
    const boldTitle = boldHeadingTitle(lines, i);
    if (boldTitle !== undefined) {
      findings.push({
        kind: "heading-bold-line",
        severity: "info",
        line: i + 1,
        excerpt: text.trim(),
        message: `Bold line treated by the chunker as a subheading: "${boldTitle}".`,
        hint: "No action needed. Turn it into a real heading only if you want a cleaner file, or remove the bold if it is not a section title.",
      });
    }
    const heading = HEADING.exec(text) ?? /^(#{1,6})\s*$/.exec(text);
    if (!heading) return;
    const title = (heading[2] ?? "").trim();
    if (title === "") {
      findings.push({
        kind: "heading-empty",
        severity: "fix",
        line: i + 1,
        excerpt: text.trim(),
        message: "Heading with no text.",
        hint: "Add the title from the book, or delete the line.",
      });
    } else if (title.length > MAX_HEADING_CHARS) {
      findings.push({
        kind: "heading-long",
        severity: "review",
        line: i + 1,
        excerpt: text.trim(),
        message: `Heading of ${title.length} characters: probably a paragraph marked as a heading by mistake.`,
        hint: "Remove the # marks if this is ordinary text; every chunk below it currently carries it as its location.",
      });
    } else if (HEADING_MARKUP.test(title)) {
      findings.push({
        kind: "heading-markup",
        severity: "info",
        line: i + 1,
        excerpt: text.trim(),
        message: "Heading contains formatting characters (*, _, `, brackets or trailing #).",
        hint: "Harmless for search, but they appear in citations. Remove them for cleaner locations.",
      });
    }
  });
}

/** A table separator row written without a leading pipe, such as "--- | ---": a reliable sign of a pipeless table. */
const PIPELESS_SEPARATOR = /^\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/;

/** Tables the chunker and checker would not recognize as tables. */
function checkTableShapes(lines: string[], findings: Finding[]): void {
  lines.forEach((text, i) => {
    const header = lines[i - 1];
    if (PIPELESS_SEPARATOR.test(text) && header !== undefined && header.includes("|") && !TABLE_ROW.test(header)) {
      findings.push({
        kind: "table-no-leading-pipe",
        severity: "fix",
        line: i,
        excerpt: header.trim(),
        message: "Table rows without a leading |: the chunker does not recognize them as a table.",
        hint: "Add a | at the start and end of every row of this table, including the header and the --- row.",
      });
    }
    if (/<table[\s>]/i.test(text)) {
      findings.push({
        kind: "table-html",
        severity: "fix",
        line: i + 1,
        excerpt: text.trim(),
        message: "HTML table: the chunker only recognizes Markdown tables.",
        hint: "Convert it to a Markdown table, with a header row, a separator row (| --- |) and one line per row.",
      });
    }
  });
}

const HYPHEN_BREAK = /([A-Za-z]+)-\s*$/;
const STARTS_LOWERCASE = /^\s*([a-z]+)/;
const BARE_NUMBER = /^\s*\d{1,3}\s*$/;
const ENCODING_DAMAGE = /Ã.|â€|Â |\uFFFD|[\uFB00-\uFB06]/;
const CODE_FENCE = /^\s*(```|~~~)/;
/** An HTML tag: "<" followed directly by a letter, so comments ("<!--") and comparisons ("<5", "a < b") don't match. */
const HTML_TAG = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(\s[^<>]*)?\/?>/g;
/** Table tags are reported once, as a table, by checkTableShapes. */
const TABLE_TAGS = new Set(["table", "thead", "tbody", "tfoot", "tr", "td", "th", "caption"]);
const REPEAT_THRESHOLD = 5;
/** "Range: Touch", "**Saving Throw:** None": a short label, a colon, and a value. */
const FIELD_LINE = /^[*_]{0,2}[A-Z][A-Za-z /'-]{1,30}:[*_]{0,2}\s*\S/;
/** A label in parentheses, possibly bold and followed by one word: "**(Alteration)**", "**(Alteration)Reversible**". */
const LABEL_LINE = /^[*_]{0,2}\([^)]*\)\s*[A-Za-z]*[*_]{0,2}$/;

/** Leftovers from the page layout or the conversion that end up inside the text. */
function checkText(lines: string[], findings: Finding[]): void {
  const counts = new Map<string, number[]>();

  lines.forEach((text, i) => {
    const hyphen = HYPHEN_BREAK.exec(text);
    const next = STARTS_LOWERCASE.exec(lines[i + 1] ?? "");
    if (hyphen && next && !TABLE_ROW.test(text)) {
      findings.push({
        kind: "text-hyphenation",
        severity: "review",
        line: i + 1,
        excerpt: text.trim().slice(-60),
        message: `Word probably broken across lines: "${hyphen[1]}-${next[1]}".`,
        hint: `Join it into "${hyphen[1]}${next[1]}" on one line, unless it is a real hyphenated word.`,
      });
    }
    if (BARE_NUMBER.test(text) && !TABLE_ROW.test(text)) {
      findings.push({
        kind: "text-bare-number",
        severity: "review",
        line: i + 1,
        excerpt: text.trim(),
        message: "Line containing only a number: probably a leftover page number.",
        hint: "Delete it if it is a page number. If it marks a page, replace it with <!-- page N -->.",
      });
    }
    if (ENCODING_DAMAGE.test(text)) {
      findings.push({
        kind: "text-encoding",
        severity: "fix",
        line: i + 1,
        excerpt: text.trim().slice(0, 100),
        message: "Damaged characters (such as Ã© for é) or typographic ligatures (such as ﬁ for fi).",
        hint: "Retype the affected words. Ligatures look normal but are single characters, so searches for 'fighter' won't find 'ﬁghter'.",
      });
    }
    const garbled = garbledReason(text);
    if (garbled) {
      findings.push({
        kind: "text-garbled",
        severity: "review",
        line: i + 1,
        excerpt: text.trim().slice(0, 100),
        message: `Text looks garbled: ${garbled}.`,
        hint: "Compare with the printed page and retype the passage. Decorative fonts and drop capitals are the usual cause; the agents would read this text as it is.",
      });
    }
    const tags = [...new Set([...text.matchAll(HTML_TAG)].map((m) => m[1].toLowerCase()))].filter((t) => !TABLE_TAGS.has(t));
    if (tags.length > 0) {
      findings.push({
        kind: "text-html",
        severity: "review",
        line: i + 1,
        excerpt: text.trim().slice(0, 100),
        message: `HTML tags left by the converter: ${tags.map((t) => `<${t}>`).join(", ")}.`,
        hint: "Replace them with plain text or Markdown: a line break as a new line (or a space inside a table cell), emphasis as *text*, a footnote mark as a plain *. The tags reach the agents as literal text.",
      });
    }
    if (CODE_FENCE.test(text)) {
      findings.push({
        kind: "text-code-fence",
        severity: "review",
        line: i + 1,
        excerpt: text.trim(),
        message: "Code fence: often left by the converter around its output.",
        hint: "Delete it unless the book really contains code. Lines between fences may be misread as headings.",
      });
    }
    const normalized = text.trim();
    // Field lines ("Saving Throw: None") and labels ("**(Alteration)**") legitimately repeat, as in spell entries.
    const isFieldOrLabel = FIELD_LINE.test(normalized) || LABEL_LINE.test(normalized);
    if (normalized.length >= 10 && !isFieldOrLabel && !HEADING.test(text) && !TABLE_ROW.test(text) && !PAGE_MARKER.test(text)) {
      counts.set(normalized, [...(counts.get(normalized) ?? []), i + 1]);
    }
    PAGE_MARKER.lastIndex = 0;
  });

  for (const [text, at] of counts) {
    if (at.length < REPEAT_THRESHOLD) continue;
    findings.push({
      kind: "text-repeated-line",
      severity: "review",
      line: at[0],
      excerpt: text.slice(0, 100),
      message: `The same line appears ${at.length} times (first at line ${at[0]}): probably a leftover page header or footer.`,
      hint: "If it is a running header or footer from the printed pages, delete every occurrence; it adds noise to many chunks.",
    });
  }
}

/** Symbols that never appear four in a row in real text, except Markdown markup (*, _, |, #, `). */
const SYMBOL_RUN = /[!"#$%&'()*+,/:;<=>?@[\]\\^`{|}~]{4,}/g;
/** One- and two-letter words common in these books; any other very short token suggests fragments. */
const COMMON_SHORT = new Set([
  "a", "i", "an", "as", "at", "be", "by", "do", "go", "he", "if", "in", "is", "it", "me", "my", "no", "of", "on", "or", "so", "to", "up", "us", "we",
  "dm", "ac", "hp", "xp", "gp", "sp", "cp", "ep", "pp", "hd", "ft", "yd", "rd", "lb", "oz", "pc", "vs", "ok",
]);
const MIN_TOKENS_FOR_FRAGMENTS = 15;

/** Why a line looks garbled, or undefined. Two signals: runs of mixed symbols, and many word fragments. */
function garbledReason(raw: string): string | undefined {
  if (TABLE_ROW.test(raw)) return undefined;
  const text = raw.replace(/<!--[\s\S]*?-->/g, " ");
  // Markdown markup doesn't count: "**Method I (3d6):**" ends in "):**", which is only "):" without it.
  const symbolRun = [...text.matchAll(SYMBOL_RUN)]
    .map((m) => m[0])
    .find((run) => {
      const withoutMarkup = run.replace(/[*_|#`]/g, "");
      return withoutMarkup.length >= 4 && new Set(withoutMarkup).size >= 3;
    });
  if (symbolRun) return `a run of mixed symbols ("${symbolRun}")`;

  // Tokens with a slash or a digit are abbreviations or values ("F/C", "1d6"), not fragments.
  const tokens = text
    .split(/\s+/)
    .filter((t) => !/[/\d]/.test(t))
    .map((t) => t.replace(/[^A-Za-z]/g, ""))
    .filter((t) => t.length > 0);
  if (tokens.length < MIN_TOKENS_FOR_FRAGMENTS) return undefined;
  const fragments = tokens.filter((t) => t.length <= 2 && !COMMON_SHORT.has(t.toLowerCase()));
  if (fragments.length >= 3 && fragments.length / tokens.length >= 0.15) {
    return `many word fragments (${fragments.slice(0, 6).join(", ")})`;
  }
  return undefined;
}