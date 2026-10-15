import { describe, expect, it } from "vitest";
import { checkBook } from "../src/bookCheck";
import { FIX_GUIDES, formatFixList, locateLines } from "../src/fixList";
import type { FindingKind } from "../src/bookCheck";

const book = `# Player's Handbook

<!-- page 7 -->

## Chapter 1: Abilities

Intro text.

<!-- UNCLEAR: smudged value -->

<!-- page 8 -->

### Strength

| Score | Bonus |
| --- | --- |
| 3 | -3 | extra |

## Chapter 2: Races

<!-- page 9 -->

The D!"#$%" l&'($) fuide says so.
`;

describe("locateLines", () => {
  it("gives each line its printed page and the section it belongs to", () => {
    const where = locateLines(book);
    expect(where[3]).toEqual({ page: 7, section: "Player's Handbook" });
    expect(where[17]).toEqual({ page: 8, section: "Chapter 1: Abilities > Strength" });
    expect(where[23]).toEqual({ page: 9, section: "Chapter 2: Races" });
  });

  it("leaves the page empty before the first page marker", () => {
    expect(locateLines("# Book\n\nText.")[3]).toEqual({ page: undefined, section: "Book" });
  });
});

describe("formatFixList", () => {
  const report = checkBook(book);
  const list = formatFixList("phb.md", book, report.findings, "../books", new Date("2026-10-15T10:00:00Z"));

  it("lists the fix and review tasks under the printed page they are on, in page order", () => {
    const page7 = list.indexOf("### Page 7");
    const page8 = list.indexOf("### Page 8");
    const page9 = list.indexOf("### Page 9");
    expect(page7).toBeGreaterThan(0);
    expect(page7).toBeLessThan(page8);
    expect(page8).toBeLessThan(page9);
    expect(list.slice(page7, page8)).toContain("unclear");
    expect(list.slice(page8, page9)).toContain("table-columns");
    expect(list.slice(page9)).toContain("text-garbled");
  });

  it("gives each task a link to its line, its section and a link to its guide", () => {
    expect(list).toMatch(/- \[ \] \*\*Fix\*\* · \[line 17\]\(\.\.\/books\/phb\.md#L17\) · Chapter 1: Abilities > Strength/);
    expect(list).toContain("[guide](#guide-table-columns)");
  });

  it("includes the guides for the kinds that occur, and only those", () => {
    expect(list).toContain('<a id="guide-table-columns"></a>');
    expect(list).toContain('<a id="guide-unclear"></a>');
    expect(list).not.toContain('<a id="guide-table-flattened"></a>');
  });

  it("leaves information-only findings out of the task list", () => {
    const info = checkBook("# Book\n\n## Chapter\n\n#### Table 1: X\n\n| A |\n| --- |\n| 1 |");
    const onlyInfo = formatFixList("phb.md", "", info.findings.filter((f) => f.severity === "info"), "../books", new Date());
    expect(onlyInfo).toContain("Nothing to fix");
  });

  it("puts tasks that have no line, such as a missing table number, under the whole book", () => {
    const md = "# Book\n\n#### Table 1: A\n\n| A |\n| --- |\n| 1 |\n\n#### Table 3: C\n\n| C |\n| --- |\n| 3 |";
    const r = checkBook(md);
    const text = formatFixList("phb.md", md, r.findings, "../books", new Date());
    expect(text.indexOf("### Whole book")).toBeLessThan(text.indexOf("### Page") === -1 ? Infinity : text.indexOf("### Page"));
    expect(text).toContain("Table 2 is missing");
  });

  it("merges all missing table numbers into one task", () => {
    const md = "# Book\n\n#### Table 1: A\n\n| A |\n| --- |\n| 1 |\n\n#### Table 5: E\n\n| E |\n| --- |\n| 5 |";
    const text = formatFixList("phb.md", md, checkBook(md).findings, "../books", new Date());
    expect(text).toContain("3 table numbers are missing from the sequence: 2, 3, 4.");
    expect(text.match(/- \[ \] .*`table-number-missing`/g)).toHaveLength(1);
  });

  it("lists a duplicated table number once, naming both lines", () => {
    const md = "# Book\n\n#### Table 32\n\nTable 32: Armor Modifiers\n\n| A |\n| --- |\n| 1 |";
    const text = formatFixList("phb.md", md, checkBook(md).findings, "../books", new Date());
    expect(text.match(/- \[ \] .*`table-number-duplicate`/g)).toHaveLength(1);
    expect(text).toContain("(lines 3, 5)");
  });
});

describe("FIX_GUIDES", () => {
  it("has a guide with steps for every kind of finding that needs action", () => {
    const actionable: FindingKind[] = [
      "unclear", "table-no-separator", "table-columns", "table-no-title", "table-title-in-table", "table-flattened",
      "table-number-missing", "table-number-duplicate", "table-no-leading-pipe", "table-html", "heading-jump",
      "heading-underlined", "heading-long", "heading-empty", "page-order", "page-jump", "text-hyphenation",
      "text-repeated-line", "text-bare-number", "text-encoding", "text-code-fence", "text-html", "text-garbled",
      "chunk-duplicate", "chunk-starts-midsentence", "chunk-table-title-without-table", "chunk-no-heading", "chunk-oversized-text",
    ];
    for (const kind of actionable) {
      expect(FIX_GUIDES[kind]?.steps.length, kind).toBeGreaterThan(0);
    }
  });
});
