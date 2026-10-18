import { describe, expect, it } from "vitest";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { loadSettings } from "../src/config";
import { getChatModel } from "../src/llm/provider";

describe("loadSettings", () => {
  it("reads the model settings from the environment", () => {
    const settings = loadSettings({ LLM_PROVIDER: "ollama", LLM_MODEL: "qwen2.5:7b", LLM_BASE_URL: "http://localhost:11434", LLM_TEMPERATURE: "0.5" });
    expect(settings).toMatchObject({ llmProvider: "ollama", llmModel: "qwen2.5:7b", llmBaseUrl: "http://localhost:11434", temperature: 0.5 });
  });

  it("uses defaults for what is not set, and treats empty values as not set", () => {
    const settings = loadSettings({ LLM_MODEL: "qwen2.5:7b", LLM_API_KEY: "", LLM_TEMPERATURE: "" });
    expect(settings).toMatchObject({ llmProvider: "ollama", temperature: 0.7, embeddingModel: "bge-m3" });
    expect(settings.llmApiKey).toBeUndefined();
  });

  it("reads the context window and answer length, with defaults of 8,192 and 1,024 tokens", () => {
    expect(loadSettings({ LLM_MODEL: "x" })).toMatchObject({ contextTokens: 8192, answerTokens: 1024 });
    expect(loadSettings({ LLM_MODEL: "x", LLM_CONTEXT_TOKENS: "16384", LLM_MAX_ANSWER_TOKENS: "2048" })).toMatchObject({ contextTokens: 16384, answerTokens: 2048 });
  });

  it("refuses an answer length that leaves no room for the prompt", () => {
    expect(() => loadSettings({ LLM_MODEL: "x", LLM_CONTEXT_TOKENS: "4096", LLM_MAX_ANSWER_TOKENS: "4000" })).toThrow(/LLM_MAX_ANSWER_TOKENS must be less than half of LLM_CONTEXT_TOKENS/);
  });

  it("reads the Ollama address used for embeddings, the same variable the knowledge package uses", () => {
    expect(loadSettings({ LLM_MODEL: "x", OLLAMA_HOST: "http://localhost:11434" }).ollamaHost).toBe("http://localhost:11434");
    expect(loadSettings({ LLM_MODEL: "x" }).ollamaHost).toBeUndefined();
  });

  it("locates the index folder and the game database in the repository's data folder", () => {
    const settings = loadSettings({ LLM_MODEL: "x" });
    expect(settings.indexDir).toMatch(/[/\\]data[/\\]index$/);
    expect(settings.gamesDbPath).toMatch(/[/\\]data[/\\]games\.db$/);
  });

  it("explains a missing model, an unknown provider and a missing API key in plain words", () => {
    expect(() => loadSettings({})).toThrow(/LLM_MODEL/);
    expect(() => loadSettings({ LLM_MODEL: "x", LLM_PROVIDER: "gemini" })).toThrow(/LLM_PROVIDER must be one of ollama, openai_compatible, anthropic/);
    expect(() => loadSettings({ LLM_MODEL: "x", LLM_PROVIDER: "anthropic" })).toThrow(/LLM_API_KEY/);
  });
});

describe("getChatModel", () => {
  const base = { llmModel: "test-model", temperature: 0.3, embeddingModel: "bge-m3", indexDir: "/tmp/index", gamesDbPath: "/tmp/games.db", contextTokens: 8192, answerTokens: 1024 };

  it("creates the model class that matches the configured provider", () => {
    expect(getChatModel({ ...base, llmProvider: "ollama" })).toBeInstanceOf(ChatOllama);
    expect(getChatModel({ ...base, llmProvider: "openai_compatible", llmBaseUrl: "http://localhost:1234/v1" })).toBeInstanceOf(ChatOpenAI);
    expect(getChatModel({ ...base, llmProvider: "anthropic", llmApiKey: "test-key" })).toBeInstanceOf(ChatAnthropic);
  });

  it("asks Ollama for the configured context window and answer length", () => {
    const model = getChatModel({ ...base, llmProvider: "ollama" }) as ChatOllama;
    expect(model.numCtx).toBe(8192);
    expect(model.numPredict).toBe(1024);
  });

  it("lets a caller override the answer length for one use, like the temperature", () => {
    const model = getChatModel({ ...base, llmProvider: "ollama" }, { answerTokens: 2048 }) as ChatOllama;
    expect(model.numPredict).toBe(2048);
  });

  it("lets a caller override the temperature for one use", () => {
    const model = getChatModel({ ...base, llmProvider: "ollama" }, { temperature: 0 }) as ChatOllama;
    expect(model.temperature).toBe(0);
  });
});