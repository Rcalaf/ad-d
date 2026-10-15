import { describe, expect, it } from "vitest";
import { checkBook, type FindingKind } from "../src/bookCheck";

const kinds = (markdown: string): FindingKind[] => checkBook(markdown).findings.map((f) => f.kind);
const find = (markdown: string, kind: FindingKind) => checkBook(markdown).findings.filter((f) => f.kind === kind);

describe("checkBook: headings", () => {
  it("finds headings written as underlined text", () => {
    const [f] = find("Intro.\n\nRaces\n=====\n\nText.\n\nDwarves\n-------\n\nMore.", "heading-underlined");
    expect(f).toMatchObject({ line: 3, severity: "review" });
    expect(find("Intro.\n\nRaces\n=====\n\nText.\n\nDwarves\n-------\n\nMore.", "heading-underlined")).toHaveLength(2);
  });

  it("does not mistake a separator after a blank line for an underlined heading", () => {
    expect(kinds("Text.\n\n---\n\nMore.")).not.toContain("heading-underlined");
  });

  it("finds bold lines that look like headings, standing alone between blank lines", () => {
    const md = "Text.\n\n**Racial Abilities**\n\nDwarves see in the dark.\n\n**Note:** this is a sentence, not a heading.\n\nMore.";
    const found = find(md, "heading-bold-line");
    expect(found.map((f) => f.line)).toEqual([3]);
  });

  it("flags headings that are too long to be headings, and empty headings", () => {
    const long = `## ${"This paragraph was marked as a heading by mistake, ".repeat(3)}`;
    expect(kinds(long)).toContain("heading-long");
    expect(kinds("# Book\n##\nText")).toContain("heading-empty");
  });

  it("reports formatting inside headings as information", () => {
    expect(find("# Book\n## **Chapter 2** ##", "heading-markup")[0].severity).toBe("info");
  });
});

describe("checkBook: tables", () => {
  it("finds table rows written without a leading pipe", () => {
    const [f] = find("Table 1: X\n\nRace | Bonus\n--- | ---\nDwarf | +1", "table-no-leading-pipe");
    expect(f).toMatchObject({ line: 3, severity: "fix" });
  });

  it("explains a table split in two by a page break, instead of only saying the separator is missing", () => {
    const md = "#### Table 1: X\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n<!-- page 12 -->\n\n| 3 | 4 |\n| 5 | 6 |";
    const [f] = find(md, "table-no-separator");
    expect(f.message).toMatch(/continues the table/);
    expect(f.hint).toMatch(/join/i);
  });

  it("finds HTML tables, as something to fix", () => {
    expect(find("Text\n<table><tr><td>1</td></tr></table>", "table-html")[0].severity).toBe("fix");
  });
});

describe("checkBook: HTML", () => {
  it("finds any other HTML tag left by the converter, as something to review", () => {
    const found = find("A value<br>on two lines.\n\nDamage 1d8<sup>*</sup>.\n\n<span class='x'>Styled</span>", "text-html");
    expect(found.map((f) => f.line)).toEqual([1, 3, 5]);
    expect(found[1].message).toContain("<sup>");
  });

  it("does not flag our own page and unclear comments, or comparisons like <5", () => {
    expect(kinds("<!-- page 12 -->\nText <!-- UNCLEAR: smudge --> here.\nA score <5 or a < b is fine.")).not.toContain("text-html");
  });

  it("does not report a table tag twice", () => {
    expect(kinds("<table><tr><td>1</td></tr></table>")).toEqual(["table-html"]);
  });
});

describe("checkBook: text", () => {
  it("finds words broken by a hyphen at the end of a line", () => {
    const [f] = find("Dwarves have an innate abil-\nity to detect slopes.", "text-hyphenation");
    expect(f).toMatchObject({ line: 1 });
    expect(f.message).toContain("abil-ity");
  });

  it("does not flag hyphenated words that continue normally", () => {
    expect(kinds("A half-\nElf is not broken here.")).not.toContain("text-hyphenation");
  });

  it("finds lines repeated many times, like leftover page headers", () => {
    const md = Array.from({ length: 6 }, (_, i) => `Player's Handbook\n\nParagraph ${i}.`).join("\n\n");
    const found = find(md, "text-repeated-line");
    expect(found).toHaveLength(1);
    expect(found[0].message).toContain("6 times");
  });

  it("finds lines that contain only a number, like leftover page numbers", () => {
    expect(find("Text.\n\n42\n\nMore text.", "text-bare-number").map((f) => f.line)).toEqual([3]);
  });

  it("finds encoding damage and typographic ligatures", () => {
    expect(find("The Ã©lite fighter â€” brave.", "text-encoding")).toHaveLength(1);
    expect(find("A magical eﬀect on the ﬁghter.", "text-encoding")).toHaveLength(1);
  });

  it("finds code fences left by the converter", () => {
    expect(find("```markdown\n# Book\n```", "text-code-fence").map((f) => f.line)).toEqual([1, 3]);
  });
});
