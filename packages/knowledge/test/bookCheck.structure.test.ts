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

  it("reports bold lines the chunker treats as subheadings, as information", () => {
    const md = "Text.\n\n**Racial Abilities**\n\nDwarves see in the dark.\n\n**Note:** this is a sentence, not a heading.\n\nMore.";
    const found = find(md, "heading-bold-line");
    expect(found.map((f) => [f.line, f.severity])).toEqual([[3, "info"]]);
  });

  it("does not report spell school labels as bold headings", () => {
    expect(kinds("### Fireball\n\n**(Evocation)**\n\nRange: 10 yds.")).not.toContain("heading-bold-line");
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

  it("recognizes a title captured inside the table, broken across cells", () => {
    const md = "Text.\n\n|  | Magical | Tab Wis | le 5: dom Chance |  |\n| --- | --- | --- | --- | --- |\n| 3 | -3 | 50% | - | - |";
    const found = checkBook(md).findings;
    expect(found.map((f) => f.kind)).toContain("table-title-in-table");
    expect(found.map((f) => f.kind)).not.toContain("table-no-title");
  });

  it("finds a table flattened into one line of text under its heading, instead of reporting a duplicate", () => {
    const md = "#### Table 30\n\nTable 30: Thief\u2019s Level Damage Multiplier 1\u20134 2 5\u20138 3 9\u201312 4 13+ 5";
    const found = checkBook(md).findings;
    expect(found.map((f) => f.kind)).toEqual(["table-flattened"]);
    expect(found[0]).toMatchObject({ severity: "fix", line: 3 });
  });

  it("accepts a table heading without a colon as the table's title", () => {
    expect(kinds("#### Table 83\n\n| A |\n| --- |\n| 1 |")).not.toContain("table-no-title");
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

  it("does not report repeated spell fields or school labels as page headers", () => {
    const spell = (i: number) => `**(Alteration)**\n\nRange: Touch\nComponents: V, S, M\nSaving Throw: None\n\nDescription of spell number ${i}.`;
    expect(kinds(Array.from({ length: 6 }, (_, i) => spell(i)).join("\n\n"))).not.toContain("text-repeated-line");
  });

  it("does not report school labels with a word after them as page headers", () => {
    const spell = (i: number) => `**(Alteration)Reversible**\n\nRange: Touch\n\nDescription of spell number ${i}.`;
    expect(kinds(Array.from({ length: 6 }, (_, i) => spell(i)).join("\n\n"))).not.toContain("text-repeated-line");
  });

  it("finds text garbled by a decorative font, as runs of mixed symbols", () => {
    const [f] = find('The Player\u2019s Handbook and the D!"#$%" l&\'($) fuide give you what you need.', "text-garbled");
    expect(f).toMatchObject({ line: 1, severity: "review" });
  });

  it("finds text scrambled into fragments", () => {
    const md = "P The P the m a DM the A ships Cla the addit enco W easily helps Ye really chara to dri her a The Player's Handbook.";
    expect(find(md, "text-garbled")).toHaveLength(1);
  });

  it("does not report normal prose, tables, comments or dice notation as garbled", () => {
    const md = [
      "Dwarves are short and stocky, and they are very brave in a fight. A dwarf is at home in the dark.",
      "<!-- page 12 --> and <!-- UNCLEAR: smudge --> are comments.",
      "| S | M | L | a | b | c | d | e | f | g | h | i |",
      "Roll 1d6 + 2 or 2d4, then 1d8 vs. AC 5 at 30 ft. (a 10-ft. radius) for 1 rd. per lvl. If it is so, do it.",
      "**Note:** *italic* and ***bold italic*** text.",
      "**Method I (3d6):** roll three dice. **Weapons (missile):** bows.",
      "* **Half-Elf:** Fighter, Ranger, Mage, Cleric, Druid, Thief, Bard, F/C, F/T, F/D, F/M, C/R, C/M, T/M",
    ].join("\n");
    expect(kinds(md)).not.toContain("text-garbled");
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