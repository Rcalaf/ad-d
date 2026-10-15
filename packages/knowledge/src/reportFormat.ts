import type { BookReport, Finding, FindingKind, Severity } from "./bookCheck";

export interface BookResult {
  file: string;
  /** Line-level findings from checkBook, merged with chunk-level findings from inspectChunks. */
  report: BookReport;
  chunkCount: number;
  medianChunkChars: number;
}

const SEVERITY_TITLES: Record<Severity, string> = {
  fix: "Fix: certainly wrong",
  review: "Review: probably wrong, check against the book",
  info: "Info: fine, worth knowing",
};

/** Examples shown per kind of finding; the rest are counted, to keep long reports readable. */
const EXAMPLES_PER_KIND = 20;

export function countBySeverity(findings: Finding[]): Record<Severity, number> {
  return {
    fix: findings.filter((f) => f.severity === "fix").length,
    review: findings.filter((f) => f.severity === "review").length,
    info: findings.filter((f) => f.severity === "info").length,
  };
}

/** Groups findings by kind, keeping the order in which each kind first appears. */
export function groupByKind(findings: Finding[]): Map<FindingKind, Finding[]> {
  const groups = new Map<FindingKind, Finding[]>();
  for (const f of findings) groups.set(f.kind, [...(groups.get(f.kind) ?? []), f]);
  return groups;
}

/**
 * Formats the results as a Markdown report: a summary, then per book, findings grouped by severity
 * and by kind. Line references are links that open the book at that line in VS Code's preview;
 * `booksPath` is the path from the report's folder to the books folder.
 */
export function formatReport(results: BookResult[], booksPath: string, date: Date): string {
  const out: string[] = [`# Book check report`, ``, `Generated ${date.toISOString().slice(0, 16).replace("T", " ")}.`, ``];

  out.push(`| Book | Fix | Review | Info | Tables | Pages | Chunks |`, `| --- | --- | --- | --- | --- | --- | --- |`);
  for (const { file, report, chunkCount } of results) {
    const c = countBySeverity(report.findings);
    const pages = report.pages.count ? `${report.pages.first}-${report.pages.last}` : "no markers";
    out.push(`| ${file} | ${c.fix} | ${c.review} | ${c.info} | ${report.tableCount} | ${pages} | ${chunkCount} |`);
  }
  out.push(``, `Work through **Fix** first, then **Review**. Rerun the check after each round of corrections.`, ``);

  for (const { file, report, chunkCount, medianChunkChars } of results) {
    out.push(`## ${file}`, ``);
    const numbers = report.tableNumbers;
    out.push(
      `- Headings by level: ${Object.entries(report.headingsByLevel).map(([level, n]) => `${"#".repeat(Number(level))} ${n}`).join(", ")}`,
      `- Numbered tables: ${numbers.length}${numbers.length ? `, Table ${numbers[0]} to Table ${numbers.at(-1)}` : ""}`,
      `- Chunks: ${chunkCount}, median ${medianChunkChars} characters`,
      ``,
    );

    for (const severity of ["fix", "review", "info"] as Severity[]) {
      const findings = report.findings.filter((f) => f.severity === severity);
      if (findings.length === 0) continue;
      out.push(`### ${SEVERITY_TITLES[severity]} (${findings.length})`, ``);
      for (const [kind, group] of groupByKind(findings)) {
        out.push(`#### ${kind} (${group.length})`, ``);
        for (const f of group.slice(0, EXAMPLES_PER_KIND)) {
          const where = f.line ? `[line ${f.line}](${booksPath}/${file}#L${f.line})` : "whole book";
          out.push(`- **${where}**: ${f.message}`);
          if (f.excerpt) out.push(`  - Text: \`${f.excerpt.length > 100 ? `${f.excerpt.slice(0, 100)}...` : f.excerpt}\``);
          out.push(`  - Hint: ${f.hint}`);
        }
        if (group.length > EXAMPLES_PER_KIND) out.push(`- ... and ${group.length - EXAMPLES_PER_KIND} more of this kind.`);
        out.push(``);
      }
    }
  }
  return out.join("\n");
}
