import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { checkBook } from "../bookCheck";
import { chunkMarkdown } from "../chunker";
import { inspectChunks } from "../chunkInspect";
import { formatFixList } from "../fixList";
import { countBySeverity, formatReport, groupByKind, type BookResult } from "../reportFormat";
import { dataPaths, explainError } from "./config";

/** Checks every book in data/books, line by line and chunk by chunk, writes a full report, and prints a summary. */
async function main() {
  const { booksDir, reportsDir } = dataPaths();
  const files = (await readdir(booksDir)).filter((f) => f.endsWith(".md")).sort();
  if (files.length === 0) throw new Error(`No books found in ${booksDir}.`);

  const results: BookResult[] = [];
  const markdownByFile = new Map<string, string>();
  for (const file of files) {
    const markdown = await readFile(path.join(booksDir, file), "utf8");
    markdownByFile.set(file, markdown);
    const report = checkBook(markdown);
    const chunks = chunkMarkdown(markdown, path.basename(file, ".md"));
    report.findings.push(...inspectChunks(chunks));
    report.findings.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
    const sizes = chunks.map((c) => c.text.length).sort((a, b) => a - b);
    results.push({ file, report, chunkCount: chunks.length, medianChunkChars: sizes[Math.floor(sizes.length / 2)] ?? 0 });
  }

  await mkdir(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, "check-books.md");
  const booksPath = path.relative(reportsDir, booksDir);
  const now = new Date();
  await writeFile(reportPath, formatReport(results, booksPath, now), "utf8");
  // One fix list per book: the same findings, ordered by page, with a guide per kind of problem.
  const fixLists: string[] = [];
  for (const { file, report } of results) {
    const fixListPath = path.join(reportsDir, `fix-list-${path.basename(file, ".md")}.md`);
    await writeFile(fixListPath, formatFixList(file, markdownByFile.get(file) ?? "", report.findings, booksPath, now), "utf8");
    fixLists.push(path.relative(process.cwd(), fixListPath) || fixListPath);
  }

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
  console.log(`Fix lists by page, one per book: ${fixLists.join(", ")}`);
  console.log("Open it in VS Code and press Cmd+Shift+V for the preview; line links open the book at that line.");
}

main().catch((error) => {
  console.error(explainError(error));
  process.exit(1);
});
