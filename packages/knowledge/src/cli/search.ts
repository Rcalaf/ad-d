import { OllamaEmbedder } from "../embedder";
import { RulesIndex, type SearchMode } from "../store";
import { dataPaths, embeddingSettings, explainError } from "./config";

const USAGE = 'Usage: pnpm --filter @dnd/knowledge search-rules "your question" [--vector | --keyword] [--full | --context]';

/**
 * Searches the rules index from the command line, to check by hand what the agents would retrieve.
 *   --vector / --keyword  run one search alone, to compare with the default hybrid search
 *   --full                print each result's complete text instead of its first 200 characters
 *   --context             print the passages exactly as the model will receive them: results with
 *                         their neighbouring pieces, merged by section, within the size budget
 */
async function main() {
  const args = process.argv.slice(2);
  const mode: SearchMode = args.includes("--vector") ? "vector" : args.includes("--keyword") ? "keyword" : "hybrid";
  const question = args.filter((a) => !a.startsWith("--")).join(" ").trim();
  if (!question) throw new Error(USAGE);

  const index = await RulesIndex.open(dataPaths().indexDir, new OllamaEmbedder(embeddingSettings()));
  const results = await index.search(question, { limit: 5, mode });
  if (results.length === 0) {
    console.log(`No results (${mode} search).`);
    return;
  }

  if (args.includes("--context")) {
    const passages = await index.expand(results);
    const total = passages.reduce((sum, p) => sum + p.text.length, 0);
    console.log(`${passages.length} passages, ${total} characters, from ${results.length} results:`);
    for (const [n, p] of passages.entries()) {
      const pages = p.pages.length ? `, p. ${p.pages.join("-")}` : "";
      console.log(`\n=== [${n + 1}] ${p.book}: ${p.headingPath.slice(1).join(" > ")}${pages} · pieces ${p.pieces.map((x) => x + 1).join(", ")} of ${p.pieceCount} · results ${p.resultRanks.join(", ")}`);
      for (const note of p.notes) console.log(`⚠ Converter note: ${note}`);
      console.log(p.text);
    }
    return;
  }

  const full = args.includes("--full");
  for (const [rank, r] of results.entries()) {
    const pages = r.pages.length ? `, p. ${r.pages.join("-")}` : "";
    const vector = r.vectorRank ? `vector #${r.vectorRank} (${r.similarity?.toFixed(3)})` : "vector -";
    const keyword = r.keywordRank ? `keyword #${r.keywordRank}` : "keyword -";
    console.log(`\n${rank + 1}. [${vector} | ${keyword}] ${r.book}: ${r.headingPath.slice(1).join(" > ")}${pages} · piece ${r.piece + 1} of ${r.pieceCount}`);
    console.log(full ? r.text : `   ${r.text.slice(0, 200).replace(/\s+/g, " ")}${r.text.length > 200 ? "..." : ""}`);
    for (const note of r.notes) console.log(`   ⚠ Converter note: ${note}`);
  }
}

main().catch((error) => {
  console.error(explainError(error));
  process.exit(1);
});