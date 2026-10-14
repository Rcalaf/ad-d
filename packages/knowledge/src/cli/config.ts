import path from "node:path";

/** Folders for book files and the index, resolved from the repository root. */
export function dataPaths() {
  // This file lives in packages/knowledge/src/cli, four levels below the repository root.
  const root = path.resolve(import.meta.dirname, "../../../..");
  return {
    booksDir: path.join(root, "data", "books"),
    indexDir: path.join(root, "data", "index"),
    reportsDir: path.join(root, "data", "reports"),
  };
}

/** Embedding settings from .env. */
export function embeddingSettings() {
  return {
    model: process.env.EMBEDDING_MODEL?.trim() || "bge-m3",
    host: process.env.OLLAMA_HOST?.trim() || undefined,
  };
}

/** Turns a connection failure into a message that says what to check. */
export function explainError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/ENOENT/.test(message) && /data[\\/](books|index|reports)/.test(message)) {
    return `Folder not found: ${message.split("'")[1] ?? message}. Create data/books and add the book files (see CLAUDE.md).`;
  }
  if (/fetch failed|ECONNREFUSED/i.test(message)) {
    return "Could not reach Ollama. Check that the Ollama app is running and that the embedding model is pulled (ollama list).";
  }
  return message;
}