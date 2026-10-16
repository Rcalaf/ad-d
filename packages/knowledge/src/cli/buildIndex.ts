import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chunkMarkdown, type Chunk } from "../chunker";
import { OllamaEmbedder } from "../embedder";
import { buildIndex, type BuildProgress } from "../store";
import { dataPaths, embeddingSettings, explainError } from "./config";
import { Spinner } from "./spinner";

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const spinner = new Spinner();

/** Restores the terminal if the build is interrupted with Ctrl+C. */
process.on("SIGINT", () => {
  spinner.stop();
  console.log("\nInterrupted. The previous index is unchanged.");
  process.exit(130);
});

const STAGE_LABELS: Record<Exclude<BuildProgress["stage"], "cache" | "embedding">, string> = {
  writing: "Writing the index",
  "keyword-index": "Building the keyword index",
  cleanup: "Removing old versions",
};

/**
 * Shows build progress: a spinner line with the current stage and live timings, and log lines above it,
 * each stage as it starts and embedding about every 10% or 15 seconds.
 */
function progressReporter() {
  let stage = "Reading the cache";
  let stageStart = performance.now();
  let embedding = { done: 0, total: 0, lastBatchAt: performance.now() };
  let lastLogged = { done: 0, at: 0 };

  spinner.start(() => {
    const elapsed = seconds(performance.now() - stageStart);
    if (stage !== "Embedding") return `${stage} · ${elapsed}`;
    const percent = embedding.total ? Math.round((embedding.done / embedding.total) * 100) : 0;
    const sinceBatch = seconds(performance.now() - embedding.lastBatchAt);
    return `Embedding ${embedding.done} of ${embedding.total} (${percent}%) · ${elapsed} · last batch ${sinceBatch} ago`;
  });

  return (event: BuildProgress) => {
    switch (event.stage) {
      case "cache":
        // Update the state first, so the spinner redrawn after the log line shows the new stage.
        stage = "Embedding";
        stageStart = performance.now();
        embedding = { done: 0, total: event.toEmbed, lastBatchAt: performance.now() };
        spinner.log(`Cache: ${event.reused} chunks unchanged, ${event.toEmbed} to embed.`);
        break;
      case "embedding": {
        embedding = { done: event.done, total: event.total, lastBatchAt: performance.now() };
        if (event.total === 0) break;
        const step = Math.max(1, Math.round(event.total / 10));
        const finished = event.done === event.total;
        if (!finished && event.done - lastLogged.done < step && event.elapsedMs - lastLogged.at < 15_000) break;
        lastLogged = { done: event.done, at: event.elapsedMs };
        const rate = event.done / (event.elapsedMs / 1000);
        const left = finished ? "" : `, about ${seconds(((event.total - event.done) / rate) * 1000)} left`;
        spinner.log(`  Embedded ${event.done} of ${event.total} (${Math.round((event.done / event.total) * 100)}%) in ${seconds(event.elapsedMs)}, ${rate.toFixed(1)} chunks/s${left}`);
        break;
      }
      default:
        stage = STAGE_LABELS[event.stage];
        stageStart = performance.now();
        spinner.log(`${stage}...`);
    }
  };
}

/**
 * Builds the rules index from every Markdown book in data/books.
 * Files ending in "-condensed.md" are skipped: condensed versions drop details and are not indexed.
 * Unchanged chunks reuse their vectors from the cache, so only new or changed chunks are embedded.
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

  console.log(`Building the index for ${chunks.length} chunks with ${settings.model}...`);
  const start = performance.now();
  const result = await buildIndex(indexDir, chunks, new OllamaEmbedder(settings), { onProgress: progressReporter() });
  spinner.stop();
  const t = result.timings;
  console.log(`Index built in ${seconds(performance.now() - start)}: ${result.chunkCount} chunks (${result.reused} reused, ${result.embedded} embedded), ${result.dimensions} dimensions, in ${indexDir}`);
  console.log(`Stages: cache ${seconds(t.cache)}, embedding ${seconds(t.embedding)}, writing ${seconds(t.writing)}, keyword index ${seconds(t.keywordIndex)}, cleanup ${seconds(t.cleanup)}`);
}

main().catch((error) => {
  spinner.stop();
  console.error(explainError(error));
  process.exit(1);
});