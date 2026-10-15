import { OllamaEmbedder } from "../embedder";
import { RulesIndex, type SearchMode } from "../store";
import { dataPaths, embeddingSettings, explainError } from "./config";

/**
 * Searches the rules index from the command line, to check by hand what the agents would retrieve.
 * Options --vector or --keyword run one search alone, to compare with the default hybrid search.
 */
async function main() {
  const args = process.argv.slice(2);
  const mode: SearchMode = args.includes("--vector") ? "vector" : args.includes("--keyword") ? "keyword" : "hybrid";
  const question = args.filter((a) => !a.startsWith("--")).join(" ").trim();
  if (!question) throw new Error('Usage: pnpm --filter @dnd/knowledge search-rules "your question" [--vector | --keyword]');

  const index = await RulesIndex.open(dataPaths().indexDir, new OllamaEmbedder(embeddingSettings()));
  const results = await index.search(question, { limit: 5, mode });
  if (results.length === 0) console.log(`No results (${mode} search).`);

  for (const [rank, r] of results.entries()) {
    const pages = r.pages.length ? `, p. ${r.pages.join("-")}` : "";
    const vector = r.vectorRank ? `vector #${r.vectorRank} (${r.similarity?.toFixed(3)})` : "vector -";
    const keyword = r.keywordRank ? `keyword #${r.keywordRank}` : "keyword -";
    console.log(`\n${rank + 1}. [${vector} | ${keyword}] ${r.book}: ${r.headingPath.slice(1).join(" > ")}${pages}`);
    console.log(`   ${r.text.slice(0, 200).replace(/\s+/g, " ")}${r.text.length > 200 ? "..." : ""}`);
    for (const note of r.notes) console.log(`   ⚠ Converter note: ${note}`);
  }
}

main().catch((error) => {
  console.error(explainError(error));
  process.exit(1);
});
