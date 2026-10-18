import { z } from "zod";
import type { AnswerResult } from "../answering/answerQuestion";
import { sourceHeading } from "../answering/sources";
import type { AgentTool } from "./agentLoop";

/**
 * The rules tool every agent shares: searches the books through the answering workflow and returns the
 * answer with the sources it cites. No agent states a rule from memory; this is where rules come from.
 */
export function rulesTool(answer: (question: string) => Promise<AnswerResult>): AgentTool {
  return {
    name: "search_rules",
    description:
      "Search the AD&D 2nd Edition books (Player's Handbook, Dungeon Master Guide) for a rule. Ask one specific question in English. " +
      "Returns an answer with its sources (book, section, pages). Use it for every rule you explain; never explain rules from memory.",
    schema: z.object({ question: z.string().min(3).describe("One specific rules question, in English") }),
    run: async ({ question }) => {
      const result = await answer(question);
      if (result.sources.length === 0) return "No passages in the books about this. Tell the players the books don't cover it.";
      const cited = result.sources.filter((s) => result.cited.includes(s.number));
      const warning = result.checks.uncited
        ? "\nThis answer cites no sources: the books may not cover the question. Don't present it as a rule."
        : "";
      const sources = cited.length ? `\nSources:\n${cited.map((s) => `${sourceHeading(s)}${s.notes.length ? " (converter note: values may be unreliable)" : ""}`).join("\n")}` : "";
      return `Answer: ${result.answer}${sources}${warning}`;
    },
  };
}