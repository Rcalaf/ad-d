import { loadSettings } from "../config";
import { getChatModel } from "../llm/provider";
import { explainModelError } from "./errors";

/** Sends one short message to the configured model, to check the connection and see how fast it answers. */
async function main() {
  const settings = loadSettings();
  console.log(`Provider: ${settings.llmProvider} · Model: ${settings.llmModel}${settings.llmBaseUrl ? ` · ${settings.llmBaseUrl}` : ""}`);

  const model = getChatModel(settings, { temperature: 0 });
  const start = performance.now();
  try {
    const response = await model.invoke("Reply with one word: OK");
    const seconds = ((performance.now() - start) / 1000).toFixed(1);
    console.log(`Answer in ${seconds} s: ${String(response.content).trim()}`);
  } catch (error) {
    console.error(explainModelError(error, settings.llmModel));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});