/**
 * The books' answer as the player sees it in new-game, printed by the command itself on every turn where
 * search_books ran: the agent rewording a rule could change its meaning (it once turned "unconscious at 0 hit
 * points" into "conscious and moving until -10"), so the player reads the books' answer, not a paraphrase.
 *
 * It takes search_books' own result, so the player sees what the agent saw, without what was written for the agent:
 * the "Answer:" and "Sources:" labels, and the closing "Tell the players…" sentence.
 */
export function booksForPlayer(toolResult: string): string {
  if (toolResult.startsWith("Answer: ")) {
    const [answer, sources = ""] = toolResult.slice("Answer: ".length).split("\nSources:\n");
    const sourceLines = sources.split("\n").filter(Boolean).map((line) => `  ${line}`);
    return ["From the books:", answer.trim(), ...sourceLines].join("\n");
  }
  return `From the books:\n${toolResult.replace(/\s*Tell the players[^.]*\.\s*$/, "").trim()}`;
}