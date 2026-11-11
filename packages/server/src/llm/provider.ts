import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import type { Settings } from "../config";

export interface ModelOptions {
  /** Overrides the configured temperature for this use, for example 0 for factual answers. */
  temperature?: number;
  /**
   * For models that think before answering (Qwen3): false switches thinking off for this use, for work that
   * gains nothing from it, such as summarizing given passages. Not set: the model's own default. Ollama only.
   */
  thinking?: boolean;
}

/**
 * The only place in the project that knows about model providers.
 * Everything else receives a BaseChatModel and doesn't care where it runs.
 */
export function getChatModel(settings: Settings, options: ModelOptions = {}): BaseChatModel {
  const temperature = options.temperature ?? settings.temperature;
  switch (settings.llmProvider) {
    case "ollama":
      // numCtx and numPredict reach Ollama as num_ctx and num_predict. Without numCtx, Ollama uses its
      // own default window and silently drops part of a longer prompt.
      return new ChatOllama({
        model: settings.llmModel,
        baseUrl: settings.llmBaseUrl,
        temperature,
        numCtx: settings.contextTokens,
        numPredict: settings.answerTokens,
        // Sent only when a caller sets it, so every other use stays as before.
        ...(options.thinking !== undefined && { think: options.thinking }),
      });
    case "openai_compatible":
      return new ChatOpenAI({
        model: settings.llmModel,
        // Local servers such as LM Studio don't check the key, but the client requires one.
        apiKey: settings.llmApiKey ?? "not-needed",
        temperature,
        // The window is set on the server for these providers; only the answer length is set here.
        maxTokens: settings.answerTokens,
        configuration: { baseURL: settings.llmBaseUrl },
      });
    case "anthropic":
      return new ChatAnthropic({ model: settings.llmModel, apiKey: settings.llmApiKey, temperature, maxTokens: settings.answerTokens });
  }
}