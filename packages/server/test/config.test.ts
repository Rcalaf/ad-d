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

  it("locates the index folder at the repository root", () => {
    expect(loadSettings({ LLM_MODEL: "x" }).indexDir).toMatch(/[/\\]data[/\\]index$/);
  });

  it("explains a missing model, an unknown provider and a missing API key in plain words", () => {
    expect(() => loadSettings({})).toThrow(/LLM_MODEL/);
    expect(() => loadSettings({ LLM_MODEL: "x", LLM_PROVIDER: "gemini" })).toThrow(/LLM_PROVIDER must be one of ollama, openai_compatible, anthropic/);
    expect(() => loadSettings({ LLM_MODEL: "x", LLM_PROVIDER: "anthropic" })).toThrow(/LLM_API_KEY/);
  });
});

describe("getChatModel", () => {
  const base = { llmModel: "test-model", temperature: 0.3, embeddingModel: "bge-m3", indexDir: "/tmp/index" };

  it("creates the model class that matches the configured provider", () => {
    expect(getChatModel({ ...base, llmProvider: "ollama" })).toBeInstanceOf(ChatOllama);
    expect(getChatModel({ ...base, llmProvider: "openai_compatible", llmBaseUrl: "http://localhost:1234/v1" })).toBeInstanceOf(ChatOpenAI);
    expect(getChatModel({ ...base, llmProvider: "anthropic", llmApiKey: "test-key" })).toBeInstanceOf(ChatAnthropic);
  });

  it("lets a caller override the temperature for one use", () => {
    const model = getChatModel({ ...base, llmProvider: "ollama" }, { temperature: 0 }) as ChatOllama;
    expect(model.temperature).toBe(0);
  });
});