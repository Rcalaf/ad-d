/**
 * The line shown under each reply in new-game: the turn's time, the agent's model calls and tokens, and the
 * books' answers when search_books ran. Tokens are as the models report them. "Read" counts the whole
 * conversation on every call, since the model has no memory between calls; "written" is what it produced.
 */

export interface BooksAnswerStats {
  ms: number;
  inputTokens: number;
  outputTokens: number;
}

export interface TurnStats {
  ms: number;
  agent: { calls: number; inputTokens: number; outputTokens: number };
  books: BooksAnswerStats[];
}

const count = (n: number) => n.toLocaleString("en-US");
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function formatTurnStats({ ms, agent, books }: TurnStats): string {
  const parts = [`  ⏱ ${seconds(ms)}`, `agent: ${plural(agent.calls, "call")}, ${count(agent.inputTokens)} tokens read, ${count(agent.outputTokens)} written`];
  if (books.length > 0) {
    const sum = (key: keyof BooksAnswerStats) => books.reduce((total, b) => total + b[key], 0);
    parts.push(`books: ${plural(books.length, "answer")}, ${seconds(sum("ms"))}, ${count(sum("inputTokens"))} read, ${count(sum("outputTokens"))} written`);
  }
  return parts.join(" · ");
}