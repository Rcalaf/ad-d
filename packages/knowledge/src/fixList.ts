import type { Finding, FindingKind } from "./bookCheck";

/**
 * A fix list is the check report reorganized for fixing by hand: one file per book,
 * tasks ordered by printed page, so the Markdown can be corrected while reading the PDF in order,
 * and a guide for each kind of problem that occurs in the book.
 */

export interface FixGuide {
  title: string;
  /** What to look at in the PDF. */
  check: string;
  /** What to do in the Markdown, in order. */
  steps: string[];
  /** A short Markdown example of the problem and its correction. */
  before?: string;
  after?: string;
}

export const FIX_GUIDES: Partial<Record<FindingKind, FixGuide>> = {
  unclear: {
    title: "Passage the converter marked as unclear",
    check: "Read the passage or table at that point on the printed page; the marker says what the converter was unsure about.",
    steps: [
      "Compare the text, or every cell of the table, with the page.",
      "Correct whatever differs. For tables, check the header row first: a missing or shifted header makes every value below it wrong.",
      "Delete the <!-- UNCLEAR: ... --> line once the passage matches the page.",
    ],
  },
  "table-title-in-table": {
    title: "Table title captured inside the table",
    check: "Find the table on the page and note its exact title, its column headings and its first rows.",
    steps: [
      "Write the title on its own line above the table: #### Table N: Title.",
      "Remove the title fragments from the table's cells.",
      "Rewrite the header row with the column headings from the page, then the separator row (| --- | per column).",
      "Check every row against the page: when the title was misplaced, values have usually shifted into the wrong columns.",
    ],
    before: "|  | Magical | Tab Wis | le 5: dom Chance |  |\n| --- | --- | --- | --- | --- |\n| 3 | -3 | 50% | ... |",
    after: "#### Table 5: (title from the page)\n\n| (heading 1) | (heading 2) | (heading 3) | (heading 4) | (heading 5) |\n| --- | --- | --- | --- | --- |\n| 3 | -3 | 50% | ... | ... |",
  },
  "table-flattened": {
    title: "Table written as one line of text",
    check: "Find the table on the page: its title, column headings and every row.",
    steps: [
      "Put the full title in the heading: #### Table N: Title.",
      "Replace the line of run-together values with a Markdown table: a header row, a separator row, and one line per row of the printed table.",
      "If text from the following paragraph ended up on the same line after the values, move it back into its paragraph.",
    ],
    before: "#### Table 30\n\nTable 30: Thief's Level Damage Multiplier 1–4 2 5–8 3 9–12 4 13+ 5",
    after: "#### Table 30: (title from the page)\n\n| Thief's Level | Damage Multiplier |\n| --- | --- |\n| 1–4 | 2 |\n| 5–8 | 3 |\n| 9–12 | 4 |\n| 13+ | 5 |",
  },
  "table-no-separator": {
    title: "Table without a separator row, or a table split in two",
    check: "Look at the table on the page: is it one table that continues, or a separate table?",
    steps: [
      "If the task says the rows continue a previous table: delete the blank lines between the two parts, and move any page marker between them to just after the table.",
      "Otherwise, add the separator row after the header row, with one --- per column (the task's hint gives the exact line).",
    ],
  },
  "table-columns": {
    title: "Table row with the wrong number of cells",
    check: "Find the row on the page and count its values.",
    steps: [
      "A missing value: add an empty cell (| |) in its position, or the value from the page if the converter lost it.",
      "An extra cell: a value split in two, or a stray | character; merge or remove it.",
      "A row that wraps onto the next line in the Markdown: join both lines into one row.",
    ],
  },
  "table-no-title": {
    title: "Table without a numbered title above it",
    check: "Look above the table on the page for its number and title.",
    steps: [
      "If the page shows a title, add it on its own line above the table: #### Table N: Title.",
      "If the page shows the table without a number, leave it: this task will stay in the list, and that's fine.",
    ],
  },
  "table-number-missing": {
    title: "Table number missing from the sequence",
    check: "Find Table N in the book (the table of contents or the surrounding pages).",
    steps: [
      "Often its title was captured inside another table or flattened: fixing those tasks usually makes this one disappear.",
      "If the table exists but is missing from the Markdown, add it with its title, in the right place.",
      "If the book skips the number, leave it.",
    ],
  },
  "table-number-duplicate": {
    title: "Table number used twice",
    check: "Look at both places in the book.",
    steps: [
      "If it's the same table printed twice (as in the Player's Handbook's tables at the end of the book), leave it.",
      "If the heading and the title are split across two lines (#### Table 57, then Table 57: Title on its own line), merge them into one heading and delete the extra line.",
      "If one of them is a different table with a misread number, correct the number.",
    ],
    before: "#### Table 57\n\nTable 57: Armor Modifiers for Wrestling",
    after: "#### Table 57: Armor Modifiers for Wrestling",
  },
  "table-no-leading-pipe": {
    title: "Table rows without a leading |",
    check: "No need to check the page unless the values look wrong.",
    steps: ["Add a | at the start and the end of every row, including the header and the --- row."],
    before: "Race | Bonus\n--- | ---\nDwarf | +1",
    after: "| Race | Bonus |\n| --- | --- |\n| Dwarf | +1 |",
  },
  "table-html": {
    title: "Table written in HTML",
    check: "Find the table on the page to confirm its columns and rows.",
    steps: ["Rewrite it as a Markdown table: header row, separator row, one line per row.", "Delete the HTML tags."],
  },
  "chunk-table-title-without-table": {
    title: "Table title with no table under it",
    check: "Find the table on the page.",
    steps: [
      "The converter often couldn't rebuild it: its values may follow as plain text, or there may be an UNCLEAR note.",
      "Rebuild it as a Markdown table under its title, from the page.",
      "Delete any plain-text leftovers of the table and the UNCLEAR note.",
    ],
  },
  "heading-jump": {
    title: "Heading more than one level below the previous one",
    check: "Look at how the book nests this section.",
    steps: [
      "If the section belongs directly under the previous heading, use one more # than that heading (the hint suggests the level).",
      "If the book really nests it this way, leave it.",
    ],
  },
  "heading-underlined": {
    title: "Heading written as underlined text",
    check: "No need to check the page.",
    steps: ["Turn the title line into a heading with #, at the level that fits.", "Delete the line of === or --- under it."],
    before: "Dwarves\n-------",
    after: "### Dwarves",
  },
  "heading-long": {
    title: "Paragraph marked as a heading",
    check: "No need to check the page.",
    steps: ["Remove the # marks at the start of the line, so it becomes normal text."],
  },
  "heading-empty": {
    title: "Heading with no text",
    check: "Look at the page for the section title at that point.",
    steps: ["Add the title after the # marks, or delete the line if there is no title."],
  },
  "page-order": {
    title: "Page number out of order",
    check: "Check which page this text is on.",
    steps: ["Correct the number in <!-- page N -->. Every citation until the next marker depends on it."],
  },
  "page-jump": {
    title: "Pages skipped",
    check: "Look at the skipped pages in the PDF.",
    steps: [
      "If they hold text (not only illustrations or blank space), that text is missing from the Markdown: add it, with its page markers.",
      "If they are full-page illustrations, the cover or blank pages, leave it.",
    ],
  },
  "text-garbled": {
    title: "Garbled text",
    check: "Read the line on the page.",
    steps: [
      "Symbols such as D!\"#$%\" l&'($) fuide are words printed in a decorative font: replace them with the words from the page. The same string often repeats: search and replace across the file (Cmd+Shift+H in VS Code).",
      "Scattered fragments (\"with g unable t runts an o speak\") are two columns or a drop capital read out of order: retype the passage from the page.",
    ],
    before: "The D!\"#$%\" l&'($) fuide is reserved for Dungeon Masters.",
    after: "The (words from the page) is reserved for Dungeon Masters.",
  },
  "chunk-starts-midsentence": {
    title: "Text that starts in the middle of a sentence",
    check: "Read the sentence on the page, and the paragraph around it.",
    steps: [
      "Sentence order scrambled (\"based on the assumption Everything in this book is that...\"): retype the sentence in the page's order.",
      "A blank line inside a paragraph, often at a page break: delete the blank line so the paragraph is whole. A page marker can stay inline: ...the paragraph <!-- page 36 --> continues here.",
    ],
    before: "Everything in this book is based\n\n<!-- page 6 -->\n\non the assumption that you are familiar with the Player's Handbook.",
    after: "Everything in this book is based <!-- page 6 --> on the assumption that you are familiar with the Player's Handbook.",
  },
  "chunk-duplicate": {
    title: "The same text in two places",
    check: "Find where the text belongs on the page.",
    steps: ["If it's printed twice in the book, leave it.", "Otherwise keep the copy in the right place and delete the other."],
  },
  "chunk-no-heading": {
    title: "Text before the first heading",
    check: "Look at the start of the book.",
    steps: ["If it's text the converter added (an introduction, a note), delete it.", "If it belongs to the book, add the heading it falls under."],
  },
  "chunk-oversized-text": {
    title: "Long text without paragraph breaks",
    check: "Look at the paragraphs on the page.",
    steps: ["Add a blank line between paragraphs or entries, as the page shows them."],
  },
  "text-hyphenation": {
    title: "Word broken at the end of a line",
    check: "No need to check the page unless the word is unclear.",
    steps: ["Join the two parts into one word on the first line, unless it's a real hyphenated word."],
    before: "Dwarves have an innate abil-\nity to detect slopes.",
    after: "Dwarves have an innate ability\nto detect slopes.",
  },
  "text-repeated-line": {
    title: "Line repeated many times",
    check: "Check whether the line is a running header or footer on the printed pages.",
    steps: ["If it is, delete every occurrence (search in VS Code with Cmd+F).", "If it's real text that repeats, leave it."],
  },
  "text-bare-number": {
    title: "Line with only a number",
    check: "Check whether it's a page number.",
    steps: ["Delete it, or replace it with <!-- page N --> if no marker exists for that page."],
  },
  "text-encoding": {
    title: "Damaged characters",
    check: "Read the words on the page.",
    steps: ["Retype the affected words. Ligatures (ﬁ, ﬂ) look normal but are single characters: retype them as two letters."],
  },
  "text-code-fence": {
    title: "Code fence left by the converter",
    check: "No need to check the page.",
    steps: ["Delete the ``` line, unless the book really contains code."],
  },
  "text-html": {
    title: "HTML tags in the text",
    check: "No need to check the page unless the meaning is unclear.",
    steps: ["Replace the tags with plain text: a line break as a new line (or a space inside a table cell), emphasis as *text*, a footnote mark as a plain *."],
  },
};

export interface LineLocation {
  /** Printed page, from the last page marker at or before the line. */
  page?: number;
  /** Headings above the line, without the book title (unless it's the only one). */
  section: string;
}

const HEADING = /^(#{1,6})\s+(.+?)\s*$/;
const PAGE_MARKER = /<!--\s*page\s+(\d+)\s*-->/gi;

/** The page and section of every line, indexed by line number (1-based; index 0 is unused). */
export function locateLines(markdown: string): LineLocation[] {
  const locations: LineLocation[] = [{ section: "" }];
  const path: string[] = [];
  let page: number | undefined;
  for (const text of markdown.split(/\r?\n/)) {
    for (const marker of text.matchAll(PAGE_MARKER)) page = Number(marker[1]);
    const heading = HEADING.exec(text);
    if (heading) {
      path.splice(heading[1].length - 1);
      path[heading[1].length - 1] = heading[2];
    }
    const titles = path.filter(Boolean);
    locations.push({ page, section: (titles.length > 1 ? titles.slice(1) : titles).join(" > ") });
  }
  return locations;
}

/**
 * Formats the fix list of one book: the guides for the kinds that occur, then the tasks,
 * grouped by printed page in page order. Information-only findings are left out.
 */
export function formatFixList(file: string, markdown: string, findings: Finding[], booksPath: string, date: Date): string {
  const tasks = mergeDuplicateTables(mergeMissingTables(findings.filter((f) => f.severity !== "info")));
  const where = locateLines(markdown);
  const out: string[] = [`# Fix list: ${file}`, ``, `Generated ${date.toISOString().slice(0, 16).replace("T", " ")}.`, ``];

  if (tasks.length === 0) {
    out.push(`Nothing to fix: no Fix or Review findings in this book.`);
    return out.join("\n");
  }

  const fixCount = tasks.filter((t) => t.severity === "fix").length;
  out.push(
    `${tasks.length} tasks: ${fixCount} **Fix** (certainly wrong) and ${tasks.length - fixCount} **Review** (check against the book).`,
    ``,
    `## How to use this list`,
    ``,
    `1. Open the PDF and this list side by side, and work through the pages in order.`,
    `2. Each task links to its line in the Markdown file (open this list in VS Code's preview, Cmd+Shift+V, to follow the links).`,
    `3. Read the task's guide the first time you meet a kind of problem; the guides are at the end of the list.`,
    `4. After a working session, run \`pnpm --filter @dnd/knowledge check-books\`: the list is regenerated and fixed tasks disappear. There's no need to tick boxes.`,
    `5. A Review task you've checked and found correct will keep appearing; that's expected.`,
    ``,
    `## Tasks by page`,
    ``,
  );

  const byPage = new Map<string, Finding[]>();
  for (const task of tasks) {
    const page = task.line ? where[task.line]?.page : undefined;
    const key = task.line === undefined ? "Whole book" : page === undefined ? "Before the first page marker" : `Page ${page}`;
    byPage.set(key, [...(byPage.get(key) ?? []), task]);
  }
  const order = (key: string) => (key === "Whole book" ? -2 : key.startsWith("Before") ? -1 : Number(key.slice(5)));
  for (const [key, group] of [...byPage.entries()].sort((a, b) => order(a[0]) - order(b[0]))) {
    out.push(`### ${key}`, ``);
    for (const task of group.sort((a, b) => (a.line ?? 0) - (b.line ?? 0))) {
      const severity = task.severity === "fix" ? "**Fix**" : "Review";
      const link = task.line ? `[line ${task.line}](${booksPath}/${file}#L${task.line})` : "no line";
      const section = task.line ? where[task.line]?.section : undefined;
      const guide = FIX_GUIDES[task.kind] ? ` · [guide](#guide-${task.kind})` : "";
      out.push(`- [ ] ${severity} · ${link}${section ? ` · ${section}` : ""} · \`${task.kind}\`${guide}`);
      out.push(`  - ${task.message}`);
      if (task.excerpt) out.push(`  - Text: \`${task.excerpt.length > 100 ? `${task.excerpt.slice(0, 100)}...` : task.excerpt}\``);
    }
    out.push(``);
  }

  out.push(`## Guides`, ``);
  const kinds = [...new Set(tasks.map((t) => t.kind))];
  for (const kind of kinds) {
    const guide = FIX_GUIDES[kind];
    if (!guide) continue;
    out.push(`<a id="guide-${kind}"></a>`, ``, `### ${guide.title} (\`${kind}\`)`, ``, `**In the PDF:** ${guide.check}`, ``, `**In the Markdown:**`, ``);
    guide.steps.forEach((step, i) => out.push(`${i + 1}. ${step}`));
    out.push(``);
    if (guide.before && guide.after) {
      out.push(`Before:`, ``, "```markdown", guide.before, "```", ``, `After:`, ``, "```markdown", guide.after, "```", ``);
    }
  }
  return out.join("\n");
}

/** Missing table numbers are one task (check the sequence against the book), so they are merged into one line. */
function mergeMissingTables(tasks: Finding[]): Finding[] {
  const missing = tasks.filter((t) => t.kind === "table-number-missing");
  if (missing.length <= 1) return tasks;
  const numbers = missing.map((t) => /Table (\d+)/.exec(t.message)?.[1]).filter(Boolean);
  const merged: Finding = {
    ...missing[0],
    message: `${missing.length} table numbers are missing from the sequence: ${numbers.join(", ")}.`,
  };
  return [merged, ...tasks.filter((t) => t.kind !== "table-number-missing")];
}

/** A duplicated table number is reported on each of its lines; one task per number is enough, its message names both. */
function mergeDuplicateTables(tasks: Finding[]): Finding[] {
  const seen = new Set<string>();
  return tasks.filter((t) => {
    if (t.kind !== "table-number-duplicate") return true;
    if (seen.has(t.message)) return false;
    seen.add(t.message);
    return true;
  });
}
