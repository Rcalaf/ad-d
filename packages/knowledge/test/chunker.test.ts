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

  it("produces stable ids, and an embedding text that starts with the heading path", () => {
    expect(chunkMarkdown(sample, "phb").map((c) => c.id)).toEqual(chunks.map((c) => c.id));
    expect(new Set(chunks.map((c) => c.id)).size).toBe(chunks.length);
    expect(embeddingText(chunks[1])).toBe(`Player's Handbook > Chapter 2: Races > Dwarves\n\n${chunks[1].text}`);
  });
});
