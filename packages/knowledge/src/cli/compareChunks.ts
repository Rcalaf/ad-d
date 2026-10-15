import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chunkMarkdown, type Chunk } from "../chunker";
import { compareChunks, type ChunkChange } from "../chunkCompare";
import { listIndexedChunks } from "../store";
import { dataPaths, explainError } from "./config";

const EXAMPLES = 30;

/**
 * Compares the chunks in the current index with what the chunker produces now from data/books.
 * Run it after changing the chunker or a book, before rebuilding, to see exactly what will change.
 */
async function main() {
  const { booksDir, indexDir, reportsDir } = dataPaths();
  const indexed = await listIndexedChunks(indexDir);
  const files = (await readdir(booksDir)).filter((f) => f.endsWith(".md") && !f.endsWith("-condensed.md")).sort();
  const current: Chunk[] = [];
  for (const file of files) current.push(...chunkMarkdown(await readFile(path.join(booksDir, file), "utf8"), path.basename(file, ".md")));

  const result = compareChunks(indexed, current);
  const where = (p?: string[]) => (p ? p.slice(1).join(" > ") || p.join(" > ") : "-");
  const excerpt = (c: ChunkChange) => c.text.slice(0, 120).replace(/\s+/g, " ").replace(/`/g, "'");
  const section = (title: string, items: ChunkChange[], line: (c: ChunkChange) => string) => [
    `## ${title} (${items.length})`,
    ``,
    ...items.slice(0, EXAMPLES).map(line),
    ...(items.length > EXAMPLES ? [`- ... and ${items.length - EXAMPLES} more.`] : []),
    ``,
  ];

  const report = [
    `# Chunk comparison: index vs. current chunker`,
    ``,
    `Indexed chunks: ${indexed.length}. Chunks now: ${current.length}. Unchanged: ${result.unchanged}.`,
    ``,
    ...section("Moved: same text, new location", result.moved, (c) => `- **${c.book}**: ${where(c.before)} → **${where(c.after)}**\n  - \`${excerpt(c)}\``),
    ...section("Added or changed: text not in the index", result.added, (c) => `- **${c.book}**: ${where(c.after)}\n  - \`${excerpt(c)}\``),
    ...section("Removed or changed: indexed text not produced any more", result.removed, (c) => `- **${c.book}**: ${where(c.before)}\n  - \`${excerpt(c)}\``),
  ].join("\n");

  await mkdir(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, "compare-chunks.md");
  await writeFile(reportPath, report, "utf8");
  console.log(`Indexed ${indexed.length}, now ${current.length}: unchanged ${result.unchanged}, moved ${result.moved.length}, added ${result.added.length}, removed ${result.removed.length}`);
  console.log(`Details: ${path.relative(process.cwd(), reportPath) || reportPath}`);
}

main().catch((error) => {
  console.error(explainError(error));
  process.exit(1);
});
