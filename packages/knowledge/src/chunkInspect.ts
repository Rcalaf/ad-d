import type { Chunk } from "./chunker";
import type { Finding } from "./bookCheck";

export interface InspectOptions {
  /** Chunks shorter than this are listed as information. Default 150 characters. */
  shortChars?: number;
  /** The chunker's size limit; text-only chunks above it lack paragraph breaks. Default 2000. */
  maxChars?: number;
}

const TABLE_TITLE = /^\s*(?:\*\*)?\s*Table\s+\d+\s*[:.]/i;
/** A lowercase word at the start, not a list item, table row or quotation: a sentence cut in two. */
const MIDSENTENCE_START = /^[a-z]/;

/**
 * Checks the chunks as the index will receive them. Complements checkBook, which looks at lines:
 * these problems only become visible once the text is split into chunks.
 */
export function inspectChunks(chunks: Chunk[], options: InspectOptions = {}): Finding[] {
  const { shortChars = 150, maxChars = 2000 } = options;
  const findings: Finding[] = [];
  const firstLineByText = new Map<string, number>();

  for (const chunk of chunks) {
    const location = chunk.headingPath.slice(1).join(" > ") || chunk.headingPath.join(" > ") || "(no heading)";
    const excerpt = chunk.text.slice(0, 100).replace(/\s+/g, " ");

    if (chunk.headingPath.length === 0) {
      findings.push({
        kind: "chunk-no-heading",
        severity: "review",
        line: chunk.line,
        excerpt,
        message: "Text before the first heading: this chunk has no location in the book.",
        hint: "If it is the converter's own text (an introduction, a note), delete it. If it belongs to the book, add the heading it falls under.",
      });
    }
    if (chunk.text.length < shortChars) {
      findings.push({
        kind: "chunk-short",
        severity: "info",
        line: chunk.line,
        excerpt,
        message: `Short chunk (${chunk.text.length} characters) in ${location}.`,
        hint: "Usually fine: a brief section or a chapter introduction. Check only if it looks like a fragment of a longer passage.",
      });
    }
    if (chunk.text.length > maxChars && !chunk.hasTable) {
      findings.push({
        kind: "chunk-oversized-text",
        severity: "review",
        line: chunk.line,
        excerpt,
        message: `Text of ${chunk.text.length} characters in ${location}, with no paragraph break the chunker could use.`,
        hint: "Add blank lines between paragraphs or entries in this section, so search can return them separately.",
      });
    }
    if (MIDSENTENCE_START.test(chunk.text)) {
      findings.push({
        kind: "chunk-starts-midsentence",
        severity: "review",
        line: chunk.line,
        excerpt,
        message: `Chunk in ${location} starts in the middle of a sentence.`,
        hint: "Usually a blank line inside a paragraph, often at a page break. Remove the blank line so the paragraph stays whole; keep any page marker on its own line or inline.",
      });
    }
    if (TABLE_TITLE.test(chunk.headingPath.at(-1) ?? "") && !chunk.hasTable) {
      findings.push({
        kind: "chunk-table-title-without-table",
        severity: "review",
        line: chunk.line,
        excerpt,
        message: `"${chunk.headingPath.at(-1)}" has no Markdown table under it.`,
        hint: "The table may be missing, or written in a form the chunker doesn't recognize (see table findings). Compare with the book.",
      });
    }
    const normalized = chunk.text.replace(/\s+/g, " ").trim();
    const first = firstLineByText.get(normalized);
    if (first !== undefined && normalized.length >= 40) {
      findings.push({
        kind: "chunk-duplicate",
        severity: "review",
        line: first,
        excerpt,
        message: `The same text appears in two chunks, at line ${first} and also at line ${chunk.line}.`,
        hint: "Usually content duplicated by the conversion. Keep the copy in the right place and delete the other.",
      });
    } else if (first === undefined) {
      firstLineByText.set(normalized, chunk.line);
    }
  }
  return findings;
}
