import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import type { Settings } from "../config";

export interface ModelOptions {
  /** Overrides the configured temperature for this use, for example 0 for factual answers. */
  temperature?: number;
}

/**
 * The only place in the project that knows about model providers.
 * Everything else receives a BaseChatModel and doesn't care where it runs.
 */
export function getChatModel(settings: Settings, options: ModelOptions = {}): BaseChatModel {
  const temperature = options.temperature ?? settings.temperature;
  switch (settings.llmProvider) {
    case "ollama":
      return new ChatOllama({ model: settings.llmModel, baseUrl: settings.llmBaseUrl, temperature });
    case "openai_compatible":
      return new ChatOpenAI({
        model: settings.llmModel,
        // Local servers such as LM Studio don't check the key, but the client requires one.
        apiKey: settings.llmApiKey ?? "not-needed",
        temperature,
        configuration: { baseURL: settings.llmBaseUrl },
      });
    case "anthropic":
      return new ChatAnthropic({ model: settings.llmModel, apiKey: settings.llmApiKey, temperature });
  }
}