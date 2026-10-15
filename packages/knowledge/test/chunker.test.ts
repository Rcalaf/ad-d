import { describe, expect, it } from "vitest";
import { chunkMarkdown, embeddingText } from "../src/chunker";

const sample = `# Player's Handbook

<!-- page 7 -->

Intro paragraph.

## Chapter 2: Races

### Dwarves

Dwarves are short and stocky.

| Ability | Adjustment |
| --- | --- |
| Constitution | +1 |
| Charisma | -1 |

---

<!-- page 8 -->

### Elves

Elves are graceful.

## Chapter 3: Classes

Classes overview.
`;

describe("chunkMarkdown", () => {
  const chunks = chunkMarkdown(sample, "phb");

  it("creates one chunk per section, with its heading path", () => {
    expect(chunks.map((c) => c.headingPath.join(" > "))).toEqual([
      "Player's Handbook",
      "Player's Handbook > Chapter 2: Races > Dwarves",
      "Player's Handbook > Chapter 2: Races > Elves",
      "Player's Handbook > Chapter 3: Classes",
    ]);
  });

  it("forgets deeper headings when a higher-level heading starts", () => {
    const classes = chunks.find((c) => c.text.startsWith("Classes overview"));
    expect(classes?.headingPath).toEqual(["Player's Handbook", "Chapter 3: Classes"]);
  });

  it("keeps tables whole and marks chunks that contain them", () => {
    const dwarves = chunks.find((c) => c.headingPath.at(-1) === "Dwarves");
    expect(dwarves?.hasTable).toBe(true);
    expect(dwarves?.text).toContain("| Constitution | +1 |\n| Charisma | -1 |");
  });

  it("drops separator lines and sections without text of their own", () => {
    expect(chunks.every((c) => !/^-{3,}$/m.test(c.text))).toBe(true);
    expect(chunks.some((c) => c.headingPath.at(-1) === "Chapter 2: Races")).toBe(false);
  });

  it("records the printed pages and removes the page markers from the text", () => {
    expect(chunks.map((c) => c.pages)).toEqual([[7], [7], [8], [8]]);
    expect(chunks.every((c) => !c.text.includes("<!--"))).toBe(true);
  });

  it("records every page a chunk spans", () => {
    const [chunk] = chunkMarkdown("## Rule\n\n<!-- page 41 -->\n\nFirst part.\n\n<!-- page 42 -->\n\nSecond part.", "phb");
    expect(chunk.pages).toEqual([41, 42]);
  });

  it("splits long sections between paragraphs, never inside one", () => {
    const longSection = `## Long\n\n${"A".repeat(150)}\n\n${"B".repeat(150)}\n\n${"C".repeat(150)}`;
    const pieces = chunkMarkdown(longSection, "phb", { maxChars: 320 });
    expect(pieces.map((p) => p.text)).toEqual([`${"A".repeat(150)}\n\n${"B".repeat(150)}`, "C".repeat(150)]);
  });

  it("keeps an oversized table whole rather than splitting it", () => {
    const table = ["| A | B |", "| --- | --- |", ...Array.from({ length: 40 }, (_, i) => `| ${i} | ${i} |`)].join("\n");
    const pieces = chunkMarkdown(`## Table\n\n${table}`, "phb", { maxChars: 100 });
    expect(pieces).toHaveLength(1);
    expect(pieces[0].text).toBe(table);
  });

  it("splits an oversized text block at line breaks, keeping each line whole", () => {
    const glossary = Array.from({ length: 30 }, (_, i) => `**Term ${i}:** definition number ${i}.`).join("\n");
    const pieces = chunkMarkdown(`## Glossary\n\n${glossary}`, "phb", { maxChars: 200 });
    expect(pieces.length).toBeGreaterThan(1);
    expect(pieces.every((p) => p.text.length <= 200)).toBe(true);
    expect(pieces.flatMap((p) => p.text.split("\n").filter(Boolean))).toHaveLength(30);
  });

  it("files the text after a table under the section the table belongs to", () => {
    const md = `## Chapter 2: Races

### Dwarves

Dwarves are short and stocky.

##### Table 8: Racial Ability Adjustments

| Race | Adjustments |
| --- | --- |
| Dwarf | +1 Constitution |

In melee, dwarves add 1 to hit orcs.

### Elves

Elves are graceful.`;
    const chunks = chunkMarkdown(md, "phb");
    expect(chunks.map((c) => [c.headingPath.slice(1).join(" > "), c.text.slice(0, 12)])).toEqual([
      ["Dwarves", "Dwarves are "],
      ["Dwarves > Table 8: Racial Ability Adjustments", "| Race | Adj"],
      ["Dwarves", "In melee, dw"],
      ["Elves", "Elves are gr"],
    ]);
  });

  it("keeps footnotes with their table, but returns bullet points to the parent section", () => {
    const md = "### Constitution\n\n#### Table 3: Constitution\n\n| Score | HP |\n| --- | --- |\n| 17 | +2 (+3)* |\n\n*\\* Parenthetical bonus applies to warriors only.*\n\n* **Magic Malfunction:** a normal bullet point.";
    const chunks = chunkMarkdown(md, "phb");
    expect(chunks.map((c) => c.headingPath.at(-1))).toEqual(["Table 3: Constitution", "Constitution"]);
    expect(chunks[0].text).toContain("Parenthetical bonus applies to warriors only");
    expect(chunks[1].text).toContain("Magic Malfunction");
  });

  it("keeps consecutive tables under the same parent section", () => {
    const md = "### Dwarves\n\n#### Table 8: A\n\n| A |\n| --- |\n| 1 |\n\n#### Table 9: B\n\n| B |\n| --- |\n| 2 |\n\nMore about dwarves.";
    expect(chunkMarkdown(md, "phb").map((c) => c.headingPath.join(" > "))).toEqual([
      "Dwarves > Table 8: A",
      "Dwarves > Table 9: B",
      "Dwarves",
    ]);
  });

  it("gives every chunk a unique id, even when a section continues after a table or a title repeats", () => {
    const md = "## Rules\n\nBefore.\n\n#### Table 1: T\n\n| A |\n| --- |\n| 1 |\n\nAfter.\n\n## Rules\n\nSame title again.";
    const chunks = chunkMarkdown(md, "phb");
    expect(chunks.filter((c) => c.headingPath.at(-1) === "Rules")).toHaveLength(3);
    expect(new Set(chunks.map((c) => c.id)).size).toBe(chunks.length);
  });

  it("removes page markers inside a line and records the pages on both sides", () => {
    const md = "## Encounters\n\n<!-- page 135 -->\n\nOne principle of wilderness adventuring (which <!-- page 136 --> makes it more dangerous) is variety.";
    const [chunk] = chunkMarkdown(md, "dmg");
    expect(chunk.text).toBe("One principle of wilderness adventuring (which makes it more dangerous) is variety.");
    expect(chunk.pages).toEqual([135, 136]);
  });

  it("assigns only the new page to text that starts right after an inline marker", () => {
    const md = "## X\n\n<!-- page 10 -->\n\nEnd of page ten.\n\n<!-- page 11 --> Start of page eleven.";
    const chunks = chunkMarkdown(md, "phb", { maxChars: 20 });
    expect(chunks.map((c) => c.pages)).toEqual([[10], [11]]);
  });

  it("records the line in the book where each chunk starts", () => {
    const chunks = chunkMarkdown("# Book\n\nIntro.\n\n## Chapter\n\nFirst.\n\nSecond.", "phb", { maxChars: 8 });
    expect(chunks.map((c) => [c.text, c.line])).toEqual([["Intro.", 3], ["First.", 7], ["Second.", 9]]);
  });

  it("treats a bold line standing alone as a subheading of the current section", () => {
    const md = "## Priests\n\nIntro.\n\n**Requirements**\n\nWisdom 9.\n\n**Weapons Allowed**\n\nBlunt weapons.\n\n## Rogues\n\nThieves.";
    expect(chunkMarkdown(md, "phb").map((c) => c.headingPath.join(" > "))).toEqual([
      "Priests",
      "Priests > Requirements",
      "Priests > Weapons Allowed",
      "Rogues",
    ]);
  });

  it("does not treat spell school labels, sentences or bold text inside a paragraph as subheadings", () => {
    const md = "### Fireball\n\n**(Evocation)**\n\nRange: 10 yds.\n\n**Note:** this is a sentence.\n\nA **bold** word in a line.";
    expect(new Set(chunkMarkdown(md, "phb").map((c) => c.headingPath.join(" > ")))).toEqual(new Set(["Fireball"]));
  });

  it("only treats bold lines that look like titles as subheadings", () => {
    const md = [
      "## Magical Item Tables", "", "Intro.", "",
      "**Subtable B (3–4)Table 89:Table 89: D20 Potions and Oils (D6) Roll Item XP Value**", "", "Garbled line above.", "",
      "**Spellcaster employing spells usable**", "", "Not a title: lowercase words.", "",
      "**(Alteration)Reversible**", "", "A spell school label.", "",
      "**Step 1: Roll Ability Scores (chapter 1)**", "", "A real subheading, with a lowercase word in parentheses.", "",
      "**Fighting from Horseback**", "", "A real subheading with a small lowercase word.",
    ].join("\n");
    expect([...new Set(chunkMarkdown(md, "dmg").map((c) => c.headingPath.join(" > ")))]).toEqual([
      "Magical Item Tables",
      "Magical Item Tables > Step 1: Roll Ability Scores (chapter 1)",
      "Magical Item Tables > Fighting from Horseback",
    ]);
  });

  it("ignores a bold line that repeats the title of its own section", () => {
    const md = "### Encounter Reactions\n\nIntro.\n\n**Encounter Reactions**\n\nMore text.";
    expect([...new Set(chunkMarkdown(md, "dmg").map((c) => c.headingPath.join(" > ")))]).toEqual(["Encounter Reactions"]);
  });

  it("recognizes a table title without a colon", () => {
    const md = "## Combat\n\n#### Table 83\n\n| A |\n| --- |\n| 1 |\n\nText after the table.";
    expect(chunkMarkdown(md, "dmg").map((c) => c.headingPath.join(" > "))).toEqual(["Combat > Table 83", "Combat"]);
  });

  it("keeps footnotes marked with plain asterisks with their table, but not bullets with a bold label", () => {
    const md = "### Priests\n\n#### Table 24: Spells\n\n| Level | Spells |\n| --- | --- |\n| 1 | 2* |\n\n* Maximum spell ability\n*** All 1s and 2s count as 3s.\n\n* **Granted Powers:** a bullet point.";
    const chunks = chunkMarkdown(md, "phb");
    expect(chunks.map((c) => c.headingPath.at(-1))).toEqual(["Table 24: Spells", "Priests"]);
    expect(chunks[0].text).toContain("* Maximum spell ability");
    expect(chunks[0].text).toContain("*** All 1s and 2s");
  });

  it("removes converter comments from the text and keeps them as notes on the chunk they describe", () => {
    const md = "## Races\n\n#### Table 7: Limits\n\n<!-- UNCLEAR: header cells not detected -->\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\nText <!-- UNCLEAR: smudged word --> here.";
    const chunks = chunkMarkdown(md, "phb");
    expect(chunks.every((c) => !c.text.includes("<!--"))).toBe(true);
    expect(chunks.map((c) => c.notes)).toEqual([["UNCLEAR: header cells not detected"], ["UNCLEAR: smudged word"]]);
    expect(chunks[1].text).toBe("Text here.");
  });

  it("drops a chunk that would contain only a converter comment", () => {
    const md = "## Races\n\n<!-- UNCLEAR: something -->\n\n## Classes\n\nText.";
    expect(chunkMarkdown(md, "phb").map((c) => c.headingPath.at(-1))).toEqual(["Classes"]);
  });

  it("produces stable ids, and an embedding text that starts with the heading path", () => {
    expect(chunkMarkdown(sample, "phb").map((c) => c.id)).toEqual(chunks.map((c) => c.id));
    expect(new Set(chunks.map((c) => c.id)).size).toBe(chunks.length);
    expect(embeddingText(chunks[1])).toBe(`Player's Handbook > Chapter 2: Races > Dwarves\n\n${chunks[1].text}`);
  });
});