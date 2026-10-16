/**
 * Keeping prompts inside the model's context window.
 *
 * The window holds everything at once: instructions, sources, question and the answer being written.
 * If a prompt is too long, Ollama doesn't fail: it drops part of it, and the beginning, where the
 * instructions are, is what's most at risk. So prompt sizes are estimated before sending, the space
 * for sources is derived from the window, and a prompt that doesn't fit is refused with a clear message.
 */

/**
 * Characters per token used for estimates. English averages about 4; Catalan and Spanish, and tables
 * full of "|" and numbers, take more tokens for the same text. 3 is deliberately pessimistic:
 * overestimating only trims sources a little early, while underestimating lets instructions be cut.
 */
export const CHARS_PER_TOKEN = 3;

/** Tokens kept free for what estimates can't see: the chat template's markers around each message. */
export const SAFETY_TOKENS = 256;

export interface WindowBudget {
  /** The context window, in tokens. */
  contextTokens: number;
  /** Tokens reserved for the answer. */
  answerTokens: number;
}

export class PromptTooLongError extends Error {}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/** Tokens available for the prompt: the window minus the answer reserve and the safety margin. */
export function usableTokens(budget: WindowBudget): number {
  return budget.contextTokens - budget.answerTokens - SAFETY_TOKENS;
}

/**
 * Characters available for sources, once the fixed parts of the prompt (instructions, question) are counted.
 * This is the size limit to give to the passage expansion, so the prompt fits by construction.
 */
export function sourceBudgetChars(fixedTexts: string[], budget: WindowBudget): number {
  const fixed = fixedTexts.reduce((sum, text) => sum + estimateTokens(text), 0);
  return Math.max(0, usableTokens(budget) - fixed) * CHARS_PER_TOKEN;
}

/** Last check before sending: refuses a prompt that doesn't fit, explaining the numbers and what to change. */
export function assertPromptFits(texts: string[], budget: WindowBudget): { estimatedTokens: number; usableTokens: number } {
  const estimatedTokens = texts.reduce((sum, text) => sum + estimateTokens(text), 0);
  const usable = usableTokens(budget);
  if (estimatedTokens > usable) {
    throw new PromptTooLongError(
      `The prompt is about ${estimatedTokens} tokens, but the context window has only ${usable} usable ` +
        `(${budget.contextTokens} tokens, minus ${budget.answerTokens} for the answer and ${SAFETY_TOKENS} as a margin). ` +
        `Shorten the sources, or raise LLM_CONTEXT_TOKENS in .env if the model and memory allow it.`,
    );
  }
  return { estimatedTokens, usableTokens: usable };
}

/**
 * Second check, after the answer: compares the tokens the model reports having read with the usable space.
 * The check before sending keeps the *estimate* within it; if the real count is higher, the estimate was too
 * optimistic and the prompt reached the area where Ollama cuts. A lower count proves nothing, since Ollama
 * can reuse part of a previous prompt and report fewer tokens.
 */
export function checkReportedUsage(inputTokens: number | undefined, budget: WindowBudget): string | undefined {
  if (inputTokens === undefined) return undefined;
  const usable = usableTokens(budget);
  if (inputTokens > usable) {
    return (
      `The model read ${inputTokens} tokens, more than the ${usable} the estimate allowed for: ` +
      `the prompt may have been cut. Lower CHARS_PER_TOKEN, or raise LLM_CONTEXT_TOKENS.`
    );
  }
  return undefined;
}