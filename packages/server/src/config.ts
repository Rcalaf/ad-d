import path from "node:path";
import { z } from "zod";

const PROVIDERS = ["ollama", "openai_compatible", "anthropic"] as const;

const SettingsSchema = z
  .object({
    llmProvider: z.enum(PROVIDERS, {
      errorMap: () => ({ message: `LLM_PROVIDER must be one of ${PROVIDERS.join(", ")}` }),
    }),
    llmModel: z.string({ required_error: "LLM_MODEL is required, for example qwen2.5:7b" }).min(1),
    llmBaseUrl: z.string().url("LLM_BASE_URL must be a full address, for example http://localhost:11434").optional(),
    llmApiKey: z.string().optional(),
    temperature: z.coerce.number().min(0).max(2, "LLM_TEMPERATURE must be between 0 and 2"),
    embeddingModel: z.string().min(1),
    indexDir: z.string(),
  })
  .refine((s) => s.llmProvider !== "anthropic" || Boolean(s.llmApiKey), {
    message: "LLM_API_KEY is required when LLM_PROVIDER is anthropic",
  });

export type Settings = z.infer<typeof SettingsSchema>;
export type Provider = Settings["llmProvider"];

/**
 * Reads the settings from environment variables (loaded from .env by the scripts).
 * Empty values count as not set, so a blank line in .env falls back to the default.
 * Errors are collected into one message that names the variable to fix.
 */
export function loadSettings(env: NodeJS.ProcessEnv = process.env): Settings {
  const value = (key: string) => {
    const raw = env[key]?.trim();
    return raw ? raw : undefined;
  };
  const result = SettingsSchema.safeParse({
    llmProvider: value("LLM_PROVIDER") ?? "ollama",
    llmModel: value("LLM_MODEL"),
    llmBaseUrl: value("LLM_BASE_URL"),
    llmApiKey: value("LLM_API_KEY"),
    temperature: value("LLM_TEMPERATURE") ?? 0.7,
    embeddingModel: value("EMBEDDING_MODEL") ?? "bge-m3",
    // This file lives in packages/server/src, three levels below the repository root.
    indexDir: path.resolve(import.meta.dirname, "../../../data/index"),
  });
  if (!result.success) {
    throw new Error(`Invalid settings in .env: ${result.error.issues.map((i) => i.message).join("; ")}`);
  }
  return result.data;
}