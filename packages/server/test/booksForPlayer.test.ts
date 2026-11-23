import { describe, expect, it } from "vitest";
import { booksForPlayer } from "../src/cli/booksForPlayer";

describe("booksForPlayer", () => {
  it("shows the books' answer and its cited sources, indented, without the labels written for the agent", () => {
    const toolResult = "Answer: A character falls unconscious at 0 hit points and dies at -10 [1].\nSources:\n[1] Dungeon Master Guide · Chapter 9: Combat · p. 104";
    expect(booksForPlayer(toolResult)).toBe(
      "From the books:\nA character falls unconscious at 0 hit points and dies at -10 [1].\n  [1] Dungeon Master Guide · Chapter 9: Combat · p. 104",
    );
  });

  it("keeps a converter note on a source", () => {
    const toolResult = "Answer: See Table 7 [1].\nSources:\n[1] Player's Handbook · Table 7 · p. 20 (converter note: its values may be unreliable)";
    expect(booksForPlayer(toolResult)).toContain("  [1] Player's Handbook · Table 7 · p. 20 (converter note: its values may be unreliable)");
  });

  it("shows the books' other results without the sentence addressed to the agent", () => {
    expect(booksForPlayer("The books don't cover this: no passages were found. Tell the players the books don't cover it.")).toBe(
      "From the books:\nThe books don't cover this: no passages were found.",
    );
    expect(booksForPlayer("The passages found in the books don't answer this clearly. Tell the players you couldn't find it in the books.")).toBe(
      "From the books:\nThe passages found in the books don't answer this clearly.",
    );
  });
});