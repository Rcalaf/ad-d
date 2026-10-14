import type { BookReport, Finding, Severity } from "./bookCheck";

export interface ChunkStats {
  count: number;
  medianChars: number;
  /** Sections over the size limit that are text, not tables: usually missing blank lines. */
  oversizedText: { location: string; chars: number }[];
  short: number;
}

export interface BookResult {
  file: string;
  report: BookReport;
  chunks: ChunkStats;
}

const SEVERITY_TITLES: Record<Severity, string> = {
  fix: "Fix: certainly wrong",
  review: "Review: probably wrong, check against the book",
  info: "Info: fine, worth knowing",
};

/** Counts findings per severity, for summaries. */
export function countBySeverity(findings: Finding[]): Record<Severity, number> {
  return {
    fix: findings.filter((f) => f.severity === "fix").length,
    review: findings.filter((f) => f.severity === "review").length,
    info: findings.filter((f) => f.severity === "info").length,
  };
}

/**
 * Formats the results as a Markdown report. Line references are links that open the book at that line
 * in VS Code's Markdown preview; `booksPath` is the path from the report's folder to the books folder.
 */
export function formatReport(results: BookResult[], booksPath: string, date: Date): string {
  const out: string[] = [`# Book check report`, ``, `Generated ${date.toISOString().slice(0, 16).replace("T", " ")}.`, ``];

  out.push(`| Book | Fix | Review | Info | Tables | Pages | Chunks |`, `| --- | --- | --- | --- | --- | --- | --- |`);
  for (const { file, report, chunks } of results) {
    const c = countBySeverity(report.findings);
    const pages = report.pages.count ? `${report.pages.first}-${report.pages.last}` : "no markers";
    out.push(`| ${file} | ${c.fix} | ${c.review} | ${c.info} | ${report.tableCount} | ${pages} | ${chunks.count} |`);
  }
  out.push(``, `Work through **Fix** first, then **Review**. Rerun the check after each round of corrections.`, ``);

  for (const { file, report, chunks } of results) {
    out.push(`## ${file}`, ``);
    const numbers = report.tableNumbers;
    out.push(
      `- Headings by level: ${Object.entries(report.headingsByLevel).map(([level, n]) => `${"#".repeat(Number(level))} ${n}`).join(", ")}`,
      `- Numbered tables: ${numbers.length}${numbers.length ? `, Table ${numbers[0]} to Table ${numbers.at(-1)}` : ""}`,
      `- Chunks: ${chunks.count}, median ${chunks.medianChars} characters, ${chunks.short} under 150 characters`,
      ``,
    );

    for (const severity of ["fix", "review", "info"] as Severity[]) {
      const findings = report.findings.filter((f) => f.severity === severity);
      const extra = severity === "review" ? chunks.oversizedText : [];
      if (findings.length === 0 && extra.length === 0) continue;
      out.push(`### ${SEVERITY_TITLES[severity]} (${findings.length + extra.length})`, ``);
      for (const f of findings) {
        const where = f.line ? `[line ${f.line}](${booksPath}/${file}#L${f.line})` : "whole book";
        out.push(`- **${where}**: ${f.message}`);
        if (f.excerpt) out.push(`  - Text: \`${f.excerpt.length > 100 ? `${f.excerpt.slice(0, 100)}...` : f.excerpt}\``);
        out.push(`  - Hint: ${f.hint}`);
      }
      for (const o of extra) {
        out.push(
          `- **${o.location}**: section text is ${o.chars} characters without a paragraph break.`,
          `  - Hint: add blank lines between paragraphs or entries in this section, so search can return them separately.`,
        );
      }
      out.push(``);
    }
  }
  return out.join("\n");
}