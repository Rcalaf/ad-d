import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { checkBook } from "../bookCheck";
import { chunkMarkdown } from "../chunker";
import { countBySeverity, formatReport, type BookResult } from "../reportFormat";
import { dataPaths, explainError } from "./config";

const MAX_CHARS = 2000;
const SHORT_CHARS = 150;

/** Checks every book in data/books, writes a full report to data/reports, and prints a summary. */
async function main() {
  const { booksDir, reportsDir } = dataPaths();
  const files = (await readdir(booksDir)).filter((f) => f.endsWith(".md")).sort();
  if (files.length === 0) throw new Error(`No books found in ${booksDir}.`);

  const results: BookResult[] = [];
  for (const file of files) {
    const markdown = await readFile(path.join(booksDir, file), "utf8");
    const chunks = chunkMarkdown(markdown, path.basename(file, ".md"), { maxChars: MAX_CHARS });
    const sizes = chunks.map((c) => c.text.length).sort((a, b) => a - b);
    results.push({
      file,
      report: checkBook(markdown),
      chunks: {
        count: chunks.length,
        medianChars: sizes[Math.floor(sizes.length / 2)] ?? 0,
        oversizedText: chunks
          .filter((c) => c.text.length > MAX_CHARS && !c.hasTable)
          .map((c) => ({ location: c.headingPath.slice(1).join(" > ") || c.headingPath.join(" > "), chars: c.text.length })),
        short: chunks.filter((c) => c.text.length < SHORT_CHARS).length,
      },
    });
  }

  await mkdir(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, "check-books.md");
  await writeFile(reportPath, formatReport(results, path.relative(reportsDir, booksDir), new Date()), "utf8");

  for (const { file, report } of results) {
    const c = countBySeverity(report.findings);
    console.log(`${file.padEnd(12)} fix ${String(c.fix).padStart(3)}   review ${String(c.review).padStart(3)}   info ${String(c.info).padStart(3)}`);
  }
  console.log(`\nFull report with hints: ${path.relative(process.cwd(), reportPath) || reportPath}`);
  console.log("Open it in VS Code and press Cmd+Shift+V for the preview; line links open the book at that line.");
}

main().catch((error) => {
  console.error(explainError(error));
  process.exit(1);
});