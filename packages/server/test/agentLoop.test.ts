import { AIMessage, HumanMessage, SystemMessage, type BaseMessage, type ToolMessage } from "@langchain/core/messages";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { runAgentTurn, type AgentTool, type ToolCallingModel, type ToolUse } from "../src/agents/agentLoop";
import { PromptTooLongError } from "../src/llm/contextWindow";

/** A scripted model: gives its replies in order, and records the messages it was sent each time. */
class ScriptedModel implements ToolCallingModel {
  sent: BaseMessage[][] = [];
  constructor(private readonly replies: AIMessage[]) {}
  async invoke(messages: BaseMessage[]) {
    this.sent.push([...messages]);
    const reply = this.replies.shift();
    if (!reply) throw new Error("The script has run out of replies.");
    return reply;
  }
}

const toolRequest = (id: string, name: string, args: Record<string, unknown>) => new AIMessage({ content: "", tool_calls: [{ id, name, args, type: "tool_call" }] });
const answer = (text: string) => new AIMessage(text);
const conversation = () => [new SystemMessage("You are a test agent."), new HumanMessage("What is 21 doubled?")];

const double: AgentTool = {
  name: "double",
  description: "Doubles a number.",
  schema: z.object({ n: z.number() }),
  run: ({ n }) => `${n * 2}`,
};

describe("runAgentTurn", () => {
  it("ends the turn with the model's answer when it asks for no tool", async () => {
    const turn = await runAgentTurn({ model: new ScriptedModel([answer("Hello.")]), tools: [double], messages: conversation() });
    expect(turn).toMatchObject({ reply: "Hello.", toolUses: [], stoppedAtRoundLimit: false });
  });

  it("runs a requested tool, sends its result back with the request's id, and returns the final answer", async () => {
    const model = new ScriptedModel([toolRequest("call-1", "double", { n: 21 }), answer("It's 42.")]);
    const turn = await runAgentTurn({ model, tools: [double], messages: conversation() });
    expect(turn.reply).toBe("It's 42.");
    const result = model.sent[1].at(-1) as ToolMessage;
    expect(result.tool_call_id).toBe("call-1");
    expect(result.content).toBe("42");
  });

  it("answers every tool request in a reply, each with its own id", async () => {
    const twoRequests = new AIMessage({
      content: "",
      tool_calls: [
        { id: "a", name: "double", args: { n: 1 }, type: "tool_call" },
        { id: "b", name: "double", args: { n: 2 }, type: "tool_call" },
      ],
    });
    const model = new ScriptedModel([twoRequests, answer("2 and 4.")]);
    await runAgentTurn({ model, tools: [double], messages: conversation() });
    const results = model.sent[1].filter((m) => m._getType() === "tool") as ToolMessage[];
    expect(results.map((r) => [r.tool_call_id, r.content])).toEqual([["a", "2"], ["b", "4"]]);
  });

  it("returns tool problems to the model as text and carries on: unknown tool, invalid arguments, a failing tool", async () => {
    const failing: AgentTool = { name: "fail", description: "Always fails.", schema: z.object({}), run: () => { throw new Error("disk full"); } };
    const model = new ScriptedModel([toolRequest("1", "missing", {}), toolRequest("2", "double", { n: "two" }), toolRequest("3", "fail", {}), answer("Sorry.")]);
    const turn = await runAgentTurn({ model, tools: [double, failing], messages: conversation() });
    const sentBack = model.sent.slice(1).map((messages) => String(messages.at(-1)!.content));
    expect(sentBack[0]).toMatch(/there is no tool named "missing"/i);
    expect(sentBack[1]).toMatch(/invalid arguments for double: n/i);
    expect(sentBack[2]).toMatch(/fail failed: disk full/i);
    expect(turn.reply).toBe("Sorry.");
    expect(turn.toolUses.map((u) => u.ok)).toEqual([false, false, false]);
  });

  it("stops at the round limit, saying so, instead of looping forever", async () => {
    const model = new ScriptedModel(Array.from({ length: 10 }, (_, i) => toolRequest(`${i}`, "double", { n: i })));
    const turn = await runAgentTurn({ model, tools: [double], messages: conversation(), maxRounds: 3 });
    expect(model.sent).toHaveLength(3);
    expect(turn.stoppedAtRoundLimit).toBe(true);
    expect(turn.reply).toMatch(/stopped after 3 rounds/i);
  });

  it("returns the whole conversation, without changing the one it was given", async () => {
    const start = conversation();
    const turn = await runAgentTurn({ model: new ScriptedModel([toolRequest("1", "double", { n: 1 }), answer("2.")]), tools: [double], messages: start });
    expect(start).toHaveLength(2);
    expect(turn.messages.map((m) => m._getType())).toEqual(["system", "human", "ai", "tool", "ai"]);
  });

  it("reports every tool use as it happens: name, arguments, success and result", async () => {
    const uses: ToolUse[] = [];
    const model = new ScriptedModel([toolRequest("1", "double", { n: 5 }), toolRequest("2", "missing", {}), answer("10.")]);
    await runAgentTurn({ model, tools: [double], messages: conversation(), onToolUse: (use) => uses.push(use) });
    expect(uses).toEqual([
      { name: "double", args: { n: 5 }, ok: true, result: "10" },
      { name: "missing", args: {}, ok: false, result: 'There is no tool named "missing".' },
    ]);
  });

  it("attaches the turn reminder to the player's latest message, in every model call of the turn", async () => {
    const model = new ScriptedModel([toolRequest("1", "double", { n: 21 }), answer("42.")]);
    await runAgentTurn({ model, tools: [double], messages: conversation(), turnReminder: "Use double for doubling." });
    for (const sent of model.sent) {
      const latest = sent.filter((m) => m._getType() === "human").at(-1)!;
      expect(String(latest.content)).toBe("What is 21 doubled?\n\n[Note from the program, not from the player: Use double for doubling.]");
    }
  });

  it("keeps the player's message as typed in the returned conversation, so reminders never pile up", async () => {
    const turn = await runAgentTurn({ model: new ScriptedModel([answer("42.")]), tools: [double], messages: conversation(), turnReminder: "Use double." });
    expect(turn.messages.filter((m) => m._getType() === "human").map((m) => m.content)).toEqual(["What is 21 doubled?"]);
  });

  it("refuses to send a conversation that doesn't fit the context window, before calling the model", async () => {
    const model = new ScriptedModel([answer("never sent")]);
    const tooLong = [new SystemMessage("x".repeat(30_000)), new HumanMessage("hi")];
    await expect(runAgentTurn({ model, tools: [double], messages: tooLong, budget: { contextTokens: 8192, answerTokens: 1024 } })).rejects.toThrow(PromptTooLongError);
    expect(model.sent).toEqual([]);
  });

  describe("empty and cut-off replies", () => {
    const reply = (content: string, metadata: Record<string, unknown>, thinking?: string) =>
      new AIMessage({ content, response_metadata: metadata, additional_kwargs: thinking ? { reasoning_content: thinking } : {} });
    const run = (message: AIMessage) => runAgentTurn({ model: new ScriptedModel([message]), tools: [double], messages: conversation() });

    it("leaves a normal reply unchanged", async () => {
      const turn = await run(reply("42.", { done_reason: "stop" }));
      expect(turn).toMatchObject({ reply: "42.", problem: undefined });
    });

    it("adds a note to a reply cut off at the length limit, whichever provider reports it", async () => {
      for (const metadata of [{ done_reason: "length" }, { finish_reason: "length" }, { stop_reason: "max_tokens" }]) {
        const turn = await run(reply("The answer is", metadata));
        expect(turn.problem, JSON.stringify(metadata)).toBe("cut-off");
        expect(turn.reply).toBe("The answer is\n\n(The answer was cut off at the length limit.)");
      }
    });

    it("explains an empty reply at the limit, with how much thinking used it up", async () => {
      const turn = await run(reply("", { done_reason: "length" }, "x".repeat(3200)));
      expect(turn.problem).toBe("empty");
      expect(turn.reply).toBe("(No answer: the model reached its answer limit, after 3200 characters of thinking. Please ask again.)");
    });

    it("explains an empty reply that didn't reach the limit", async () => {
      const turn = await run(reply("  ", { done_reason: "stop" }));
      expect(turn).toMatchObject({ problem: "empty", reply: "(No answer from the model. Please ask again.)" });
    });

    it("records the note in the conversation in place of the empty reply, so the agent sees its turn produced nothing", async () => {
      const turn = await run(reply("", { done_reason: "length" }));
      const last = turn.messages.at(-1)!;
      expect(last._getType()).toBe("ai");
      expect(String(last.content)).toMatch(/^\(No answer: the model reached its answer limit/);
    });
  });
});