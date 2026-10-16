import { describe, expect, it } from "vitest";
import {
  CHARS_PER_TOKEN,
  assertPromptFits,
  checkReportedUsage,
  estimateTokens,
  PromptTooLongError,
  sourceBudgetChars,
  usableTokens,
} from "../src/llm/contextWindow";

const budget = { contextTokens: 8192, answerTokens: 1024 };

describe("estimateTokens", () => {
  it("estimates pessimistically, at 3 characters per token, rounding up", () => {
    expect(CHARS_PER_TOKEN).toBe(3);
    expect(estimateTokens("abcdef")).toBe(2);
    expect(estimateTokens("abcdefg")).toBe(3);
    expect(estimateTokens("")).toBe(0);
  });
});

describe("usableTokens", () => {
  it("is the window minus the answer reserve and a safety margin", () => {
    expect(usableTokens(budget)).toBe(8192 - 1024 - 256);
  });
});

describe("sourceBudgetChars", () => {
  it("gives the sources whatever the instructions and question leave, in characters", () => {
    const instructions = "x".repeat(3000); // about 1,000 tokens
    const question = "y".repeat(300); // about 100 tokens
    const expectedTokens = usableTokens(budget) - estimateTokens(instructions) - estimateTokens(question);
    expect(sourceBudgetChars([instructions, question], budget)).toBe(expectedTokens * CHARS_PER_TOKEN);
  });

  it("is zero, not negative, when the instructions alone fill the window", () => {
    expect(sourceBudgetChars(["x".repeat(30_000)], budget)).toBe(0);
  });
});

describe("assertPromptFits", () => {
  it("returns the estimate when the prompt fits", () => {
    expect(assertPromptFits(["a".repeat(300)], budget)).toEqual({ estimatedTokens: 100, usableTokens: usableTokens(budget) });
  });

  it("refuses a prompt that doesn't fit, explaining the numbers and what to change", () => {
    const tooLong = "a".repeat(usableTokens(budget) * CHARS_PER_TOKEN + 3);
    expect(() => assertPromptFits([tooLong], budget)).toThrow(PromptTooLongError);
    try {
      assertPromptFits([tooLong], budget);
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toMatch(/about 6913 tokens/);
      expect(message).toMatch(/6912 usable/);
      expect(message).toMatch(/LLM_CONTEXT_TOKENS/);
    }
  });
});

describe("checkReportedUsage", () => {
  it("warns when the model read about as many tokens as the window allows, since the prompt may have been cut", () => {
    expect(checkReportedUsage(7100, budget)).toMatch(/may have been cut/);
  });

  it("says nothing when the count is comfortably below the limit, or not reported", () => {
    expect(checkReportedUsage(3000, budget)).toBeUndefined();
    expect(checkReportedUsage(undefined, budget)).toBeUndefined();
  });
});