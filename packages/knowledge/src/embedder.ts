import { Ollama } from "ollama";

/**
 * Turns texts into vectors. The index depends on this interface, not on Ollama,
 * so tests can use a fake embedder and the model provider can change later.
 */
export interface Embedder {
  /** Identifies the model. Vectors from different models are not comparable. */
  readonly model: string;
  embed(texts: string[]): Promise<number[][]>;
}

export interface OllamaEmbedderOptions {
  model: string;
  /** Ollama address; defaults to http://127.0.0.1:11434. */
  host?: string;
  /** Texts sent per request, so a whole book is not sent in one call. */
  batchSize?: number;
}

export class OllamaEmbedder implements Embedder {
  readonly model: string;
  private readonly client: Ollama;
  private readonly batchSize: number;

  constructor({ model, host, batchSize = 16 }: OllamaEmbedderOptions) {
    this.model = model;
    this.client = new Ollama({ host });
    this.batchSize = batchSize;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let start = 0; start < texts.length; start += this.batchSize) {
      const batch = texts.slice(start, start + this.batchSize);
      const response = await this.client.embed({ model: this.model, input: batch });
      vectors.push(...response.embeddings);
    }
    return vectors;
  }
}