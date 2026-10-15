/** Turns common model errors into a message that says what to check. */
export function explainModelError(error: unknown, model?: string): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/fetch failed|ECONNREFUSED/i.test(message)) {
    return "Could not reach the model. Check that the Ollama app is running and that LLM_BASE_URL in .env points to it.";
  }
  if (/not found/i.test(message) && model) {
    return `The model "${model}" is not available. For Ollama, download it with: ollama pull ${model}`;
  }
  return message;
}