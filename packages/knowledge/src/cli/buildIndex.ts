import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chunkMarkdown, type Chunk } from "../chunker";
import { OllamaEmbedder } from "../embedder";
import { buildIndex } from "../store";
import { dataPaths, embeddingSettings, explainError } from "./config";

/**
 * Builds the rules index from every Markdown book in data/books.
 * Files ending in "-condensed.md" are skipped: condensed versions drop details and are not indexed.
 */
async function main() {
  const { booksDir, indexDir } = dataPaths();
  const settings = embeddingSettings();

  const files = (await readdir(booksDir)).filter((f) => f.endsWith(".md") && !f.endsWith("-condensed.md")).sort();
  if (files.length === 0) throw new Error(`No books found in ${booksDir}.`);

  const chunks: Chunk[] = [];
  for (const file of files) {
    const book = path.basename(file, ".md");
    const bookChunks = chunkMarkdown(await readFile(path.join(booksDir, file), "utf8"), book);
    console.log(`${file}: ${bookChunks.length} chunks, ${bookChunks.filter((c) => c.hasTable).length} with tables`);
    chunks.push(...bookChunks);
  }

  console.log(`Embedding ${chunks.length} chunks with ${settings.model}...`);
  const start = performance.now();
  const meta = await buildIndex(indexDir, chunks, new OllamaEmbedder(settings));
  const seconds = ((performance.now() - start) / 1000).toFixed(1);
  console.log(`Index built in ${seconds} s: ${meta.chunkCount} chunks, ${meta.dimensions} dimensions, in ${indexDir}`);
}

main().catch((error) => {
  console.error(explainError(error));
  process.exit(1);
});