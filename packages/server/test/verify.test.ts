import { AIMessage, HumanMessage, SystemMessage, type BaseMessage } from "@langchain/core/messages";
import { describe, expect, it } from "vitest";
import type { AnswerModel } from "../src/answering/answerQuestion";
import { parseVerdicts, splitSentences, verifyAnswer } from "../src/answering/verify";

/** A scripted model: gives its replies in order, and records the messages it was sent each time. */
class ScriptedModel implements AnswerModel {
  sent: BaseMessage[][] = [];
  constructor(private readonly replies: string[]) {}
  async invoke(messages: BaseMessage[]) {
    this.sent.push(messages);
    const content = this.replies.shift();
    if (content === undefined) throw new Error("The script has run out of replies.");
    return { content, usage_metadata: { input_tokens: 100, output_tokens: 10, total_tokens: 110 } };
  }
}

const base = (): BaseMessage[] => [new SystemMessage("You answer from the sources."), new HumanMessage("Sources:\n\n[1] …\n\nQuestion: Which method gives the best scores?")];
const ANSWER = "Method II gives better scores than Method I [1]. Method II gives the best scores [1].";

describe("splitSentences", () => {
  it("splits an answer into sentences and list items, each with the sources it cites", () => {
    expect(splitSentences("Method I is 3d6 in order [1]. Method V is 4d6 [2, 3].\n\n- **Method VI**: start at 8 [2].\n- No citation here.")).toEqual([
      { text: "Method I is 3d6 in order [1].", cited: [1] },
      { text: "Method V is 4d6 [2, 3].", cited: [2, 3] },
      { text: "- **Method VI**: start at 8 [2].", cited: [2] },
      { text: "- No citation here.", cited: [] },
    ]);
  });
});

describe("parseVerdicts", () => {
  it("reads one verdict per numbered sentence, with the reason for unsupported ones", () => {
    expect(parseVerdicts("1: supported\n2: not supported: the source says better than Method I, not best", 2)).toEqual([
      { supported: true },
      { supported: false, reason: "the source says better than Method I, not best" },
    ]);
  });

  it("tolerates small variations in the format", () => {
    expect(parseVerdicts("1. Supported.\n2 - NOT SUPPORTED - not in the sources", 2)).toEqual([
      { supported: true },
      { supported: false, reason: "not in the sources" },
    ]);
  });

  it("gives up when a sentence has no verdict, rather than guessing", () => {
    expect(parseVerdicts("1: supported", 2)).toBeUndefined();
  });
});

describe("verifyAnswer", () => {
  it("keeps an answer whose sentences are all supported, with one check", async () => {
    const model = new ScriptedModel(["1: supported\n2: supported"]);
    const result = await verifyAnswer(ANSWER, base(), model);
    expect(result).toMatchObject({ answer: ANSWER, removed: [], flagged: [], revised: false, checkFailed: false, calls: 1 });
  });

  it("checks as a continuation of the answer's conversation, so its beginning is the same", async () => {
    const model = new ScriptedModel(["1: supported\n2: supported"]);
    await verifyAnswer(ANSWER, base(), model);
    const sent = model.sent[0];
    expect(sent.slice(0, 2).map((m) => String(m.content))).toEqual(base().map((m) => String(m.content)));
    expect(sent[2]).toBeInstanceOf(AIMessage);
    expect(String(sent[2].content)).toBe(ANSWER);
    expect(String(sent[3].content)).toMatch(/1\. Method II gives better scores than Method I \[1\]\.\n2\. Method II gives the best scores \[1\]\./);
  });

  it("asks for one revision when a sentence is unsupported, and checks the revision", async () => {
    const revision = "Method II gives better scores than Method I [1]. The sources don't say which method is best.";
    const model = new ScriptedModel(["1: supported\n2: not supported: the source says better, not best", revision, "1: supported\n2: supported"]);
    const result = await verifyAnswer(ANSWER, base(), model);
    expect(result).toMatchObject({ answer: revision, removed: [], revised: true, calls: 3 });
    expect(result.flagged).toEqual([{ sentence: "Method II gives the best scores [1].", reason: "the source says better, not best" }]);
    expect(String(model.sent[1].at(-1)!.content)).toMatch(/Method II gives the best scores \[1\]\. \(the source says better, not best\)/);
  });

  it("removes sentences still unsupported after the revision, and reports them with the reason", async () => {
    const model = new ScriptedModel(["1: supported\n2: not supported: says better", ANSWER, "1: supported\n2: not supported: still says best"]);
    const result = await verifyAnswer(ANSWER, base(), model);
    expect(result.answer).toBe("Method II gives better scores than Method I [1].");
    expect(result.removed).toEqual([{ sentence: "Method II gives the best scores [1].", reason: "still says best" }]);
  });

  it("keeps the answer unchanged when a check can't be read: a broken check never deletes content", async () => {
    const model = new ScriptedModel(["I think it's fine."]);
    const result = await verifyAnswer(ANSWER, base(), model);
    expect(result).toMatchObject({ answer: ANSWER, removed: [], checkFailed: true });
  });

  it("sums the time and tokens of its calls", async () => {
    const model = new ScriptedModel(["1: supported\n2: not supported: x", "Revised [1].", "1: supported"]);
    const result = await verifyAnswer(ANSWER, base(), model);
    expect(result).toMatchObject({ calls: 3, inputTokens: 300, outputTokens: 30 });
    expect(result.ms).toBeGreaterThanOrEqual(0);
  });
});