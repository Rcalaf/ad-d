import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { checkBook } from "../bookCheck";
import { chunkMarkdown } from "../chunker";
import { inspectChunks } from "../chunkInspect";
import { countBySeverity, formatReport, groupByKind, type BookResult } from "../reportFormat";
import { dataPaths, explainError } from "./config";

/** Checks every book in data/books, line by line and chunk by chunk, writes a full report, and prints a summary. */
async function main() {
  const { booksDir, reportsDir } = dataPaths();
  const files = (await readdir(booksDir)).filter((f) => f.endsWith(".md")).sort();
  if (files.length === 0) throw new Error(`No books found in ${booksDir}.`);

  const results: BookResult[] = [];
  for (const file of files) {
    const markdown = await readFile(path.join(booksDir, file), "utf8");
    const report = checkBook(markdown);
    const chunks = chunkMarkdown(markdown, path.basename(file, ".md"));
    report.findings.push(...inspectChunks(chunks));
    report.findings.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
    const sizes = chunks.map((c) => c.text.length).sort((a, b) => a - b);
    results.push({ file, report, chunkCount: chunks.length, medianChunkChars: sizes[Math.floor(sizes.length / 2)] ?? 0 });
  }

  await mkdir(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, "check-books.md");
  await writeFile(reportPath, formatReport(results, path.relative(reportsDir, booksDir), new Date()), "utf8");

  for (const { file, report } of results) {
    const c = countBySeverity(report.findings);
    console.log(`\n${file}: fix ${c.fix}, review ${c.review}, info ${c.info}`);
    for (const severity of ["fix", "review", "info"] as const) {
      for (const [kind, group] of groupByKind(report.findings.filter((f) => f.severity === severity))) {
        console.log(`  ${severity.padEnd(6)} ${kind.padEnd(34)} ${group.length}`);
      }
    }
  }
  console.log(`\nFull report with hints: ${path.relative(process.cwd(), reportPath) || reportPath}`);
  console.log("Open it in VS Code and press Cmd+Shift+V for the preview; line links open the book at that line.");
}

main().catch((error) => {
  console.error(explainError(error));
  process.exit(1);
});
