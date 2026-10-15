import { describe, expect, it } from "vitest";
import { checkBook, type FindingKind } from "../src/bookCheck";
import { formatReport } from "../src/reportFormat";

const kinds = (markdown: string): FindingKind[] => checkBook(markdown).findings.map((f) => f.kind);

describe("checkBook", () => {
  it("finds nothing wrong in a well-formed book", () => {
    const report = checkBook(`# Book
<!-- page 1 -->
## Chapter 1
### Section
#### Table 1: Strength

| Score | Bonus |
| --- | --- |
| 3 | -3 |
<!-- page 2 -->
#### Table 2: Dexterity

| Score | Bonus |
| --- | --- |
| 18 | +3 |`);
    expect(report.findings).toEqual([]);
    expect(report.tableCount).toBe(2);
    expect(report.tableNumbers).toEqual([1, 2]);
    expect(report.pages).toEqual({ count: 2, first: 1, last: 2 });
  });

  it("asks to review a section heading that skips a level, suggesting the expected level", () => {
    const [finding] = checkBook("# Book\n## Chapter\n#### Too deep").findings;
    expect(finding).toMatchObject({ kind: "heading-jump", severity: "review", line: 3, excerpt: "#### Too deep" });
    expect(finding.hint).toContain('change "####" to "###"');
  });

  it("treats a table title that skips a level as information only", () => {
    const [finding] = checkBook("# Book\n## Chapter\n##### Table 1: X\n\n| A |\n| --- |\n| 1 |").findings;
    expect(finding).toMatchObject({ kind: "heading-jump", severity: "info" });
  });

  it("flags rows with a different number of cells than the header, as something to fix", () => {
    const findings = checkBook("Table 1: X\n\n| A | B | C |\n| --- | --- | --- |\n| 1 | 2 |\n| 1 | 2 | 3 |").findings;
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ kind: "table-columns", severity: "fix", line: 5, excerpt: "| 1 | 2 |" });
    expect(findings[0].hint).toContain("empty cell");
  });

  it("gives the exact separator line to add when it is missing", () => {
    const finding = checkBook("Table 1: X\n\n| A | B | C |\n| 1 | 2 | 3 |").findings.find((f) => f.kind === "table-no-separator");
    expect(finding?.hint).toContain("| --- | --- | --- |");
  });

  it("asks to review a table without a title", () => {
    expect(kinds("Some text\n\n| A | B |\n| --- | --- |\n| 1 | 2 |")).toEqual(["table-no-title"]);
  });

  it("finds missing and duplicated table numbers, ignoring references in the text", () => {
    const findings = checkBook("#### Table 1: A\n#### Table 3: C\n**Table 3: C again**\nAs shown in Table 2, ...").findings;
    expect(findings.map((f) => f.kind).sort()).toEqual(["table-number-duplicate", "table-number-duplicate", "table-number-missing"]);
    expect(findings.find((f) => f.kind === "table-number-missing")?.message).toContain("Table 2");
  });

  it("separates page markers that go backwards (fix) from jumps (review)", () => {
    const findings = checkBook("<!-- page 10 -->\n<!-- page 11 -->\n<!-- page 13 -->\n<!-- page 13 -->\n<!-- page 12 -->").findings;
    expect(findings.map((f) => [f.kind, f.severity])).toEqual([
      ["page-jump", "review"],
      ["page-order", "fix"],
      ["page-order", "fix"],
    ]);
  });

  it("reports page markers inside a line as information, and checks their order too", () => {
    const findings = checkBook("<!-- page 135 -->\nOne principle (which <!-- page 136 --> makes it) is variety.\n<!-- page 136 -->").findings;
    expect(findings.map((f) => [f.kind, f.severity, f.line])).toEqual([
      ["page-inline", "info", 2],
      ["page-order", "fix", 3],
    ]);
  });

  it("lists passages the converter marked as unclear, as something to fix", () => {
    const [finding] = checkBook("Text\n<!-- UNCLEAR: smudged value in row 4 -->\nMore").findings;
    expect(finding).toMatchObject({ kind: "unclear", severity: "fix", line: 2 });
    expect(finding.message).toContain("smudged value in row 4");
  });
});

describe("formatReport", () => {
  it("writes a summary table, groups findings by severity and kind, and links lines to the book", () => {
    const report = checkBook("# Book\n## Chapter\n#### Too deep\n<!-- UNCLEAR: torn page -->");
    const markdown = formatReport([{ file: "phb.md", report, chunkCount: 3, medianChunkChars: 400 }], "../books", new Date("2026-10-13T10:00:00Z"));
    expect(markdown).toContain("| phb.md | 1 | 1 | 0 |");
    expect(markdown.indexOf("### Fix")).toBeLessThan(markdown.indexOf("### Review"));
    expect(markdown).toContain("#### unclear (1)");
    expect(markdown).toContain("[line 4](../books/phb.md#L4)");
  });

  it("shows at most 20 examples per kind and counts the rest", () => {
    const report = checkBook(Array.from({ length: 25 }, (_, i) => `Text ${i}.\n\n${i + 1}\n`).join("\n"));
    const markdown = formatReport([{ file: "phb.md", report, chunkCount: 1, medianChunkChars: 10 }], "../books", new Date());
    expect(markdown).toContain("#### text-bare-number (25)");
    expect(markdown).toContain("... and 5 more of this kind.");
  });
});
