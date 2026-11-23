import { describe, expect, it } from "vitest";
import { formatTurnStats } from "../src/cli/turnStats";

describe("formatTurnStats", () => {
  it("shows the turn's time and the agent's calls and tokens, with thousands separated", () => {
    expect(formatTurnStats({ ms: 6300, agent: { calls: 2, inputTokens: 3412, outputTokens: 58 }, books: [] })).toBe(
      "  ⏱ 6.3 s · agent: 2 calls, 3,412 tokens read, 58 written",
    );
  });

  it("adds the books' answers when search_books ran, summing their time and tokens", () => {
    const books = [
      { ms: 2900, inputTokens: 2435, outputTokens: 112 },
      { ms: 1100, inputTokens: 2000, outputTokens: 88 },
    ];
    expect(formatTurnStats({ ms: 9000, agent: { calls: 3, inputTokens: 5000, outputTokens: 70 }, books })).toBe(
      "  ⏱ 9.0 s · agent: 3 calls, 5,000 tokens read, 70 written · books: 2 answers, 4.0 s, 4,435 read, 200 written",
    );
  });

  it("uses the singular for one call and one answer", () => {
    expect(formatTurnStats({ ms: 1000, agent: { calls: 1, inputTokens: 10, outputTokens: 2 }, books: [{ ms: 500, inputTokens: 5, outputTokens: 1 }] })).toBe(
      "  ⏱ 1.0 s · agent: 1 call, 10 tokens read, 2 written · books: 1 answer, 0.5 s, 5 read, 1 written",
    );
  });
});