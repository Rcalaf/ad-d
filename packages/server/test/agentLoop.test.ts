import { AIMessage, HumanMessage, SystemMessage, type BaseMessage, type ToolMessage } from "@langchain/core/messages";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { runAgentTurn, type AgentTool, type ToolCallingModel } from "../src/agents/agentLoop";
import { PromptTooLongError } from "../src/llm/contextWindow";

/** A scripted model: returns the given replies in order, and records the messages it received each time. */
class ScriptedModel implements ToolCallingModel {
  received: BaseMessage[][] = [];
  constructor(private readonly replies: AIMessage[]) {}
  async invoke(messages: BaseMessage[]) {
    this.received.push([...messages]);
    const reply = this.replies.shift();
    if (!reply) throw new Error("The script has no more replies.");
    return reply;
  }
}

const callTool = (name: string, args: Record<string, unknown>, id = `call_${name}`) => new AIMessage({ content: "", tool_calls: [{ id, name, args, type: "tool_call" }] });
const say = (text: string) => new AIMessage(text);

const double: AgentTool = {
  name: "double",
  description: "Doubles a number.",
  schema: z.object({ n: z.number() }),
  run: ({ n }) => `The result is ${n * 2}.`,
};
const start = () => [new SystemMessage("You are a test agent."), new HumanMessage("Double 21.")];

describe("runAgentTurn", () => {
  it("runs a requested tool, sends its result with the same id, and returns the model's final answer", async () => {
    const model = new ScriptedModel([callTool("double", { n: 21 }, "call_1"), say("It's 42.")]);
    const turn = await runAgentTurn({ model, tools: [double], messages: start() });
    expect(turn.reply).toBe("It's 42.");
    const toolResult = model.received[1].at(-1)!;
    expect(toolResult._getType()).toBe("tool");
    expect(toolResult).toMatchObject({ tool_call_id: "call_1", content: "The result is 42." });
    expect(turn.toolCalls).toEqual([{ name: "double", args: { n: 21 }, ok: true }]);
  });

  it("answers every tool request of a turn, each with its own id", async () => {
    const both = new AIMessage({ content: "", tool_calls: [{ id: "a", name: "double", args: { n: 1 }, type: "tool_call" }, { id: "b", name: "double", args: { n: 2 }, type: "tool_call" }] });
    const model = new ScriptedModel([both, say("2 and 4.")]);
    await runAgentTurn({ model, tools: [double], messages: start() });
    const results = model.received[1].filter((m) => m._getType() === "tool").map((m) => [(m as ToolMessage).tool_call_id, m.content]);
    expect(results).toEqual([["a", "The result is 2."], ["b", "The result is 4."]]);
  });

  it("returns tool problems to the model as text instead of stopping: unknown tool, invalid arguments, errors", async () => {
    const failing: AgentTool = { name: "fail", description: "Fails.", schema: z.object({}), run: () => { throw new Error("disk full"); } };
    const model = new ScriptedModel([callTool("missing", {}), callTool("double", { n: "two" }), callTool("fail", {}), say("Sorry.")]);
    const turn = await runAgentTurn({ model, tools: [double, failing], messages: start() });
    const results = model.received.slice(1).map((messages) => String(messages.at(-1)!.content));
    expect(results[0]).toMatch(/no tool named "missing"/i);
    expect(results[1]).toMatch(/invalid arguments for double/i);
    expect(results[2]).toMatch(/fail failed: disk full/i);
    expect(turn.toolCalls.map((c) => c.ok)).toEqual([false, false, false]);
  });

  it("stops after the round limit, saying so, instead of looping forever", async () => {
    const model = new ScriptedModel(Array.from({ length: 10 }, () => callTool("double", { n: 1 })));
    const turn = await runAgentTurn({ model, tools: [double], messages: start(), maxRounds: 3 });
    expect(turn.stoppedAtLimit).toBe(true);
    expect(model.received).toHaveLength(3);
    expect(turn.reply).toMatch(/stopped/i);
  });

  it("returns the whole conversation, without changing the one it was given", async () => {
    const messages = start();
    const turn = await runAgentTurn({ model: new ScriptedModel([callTool("double", { n: 1 }), say("2.")]), tools: [double], messages });
    expect(messages).toHaveLength(2);
    expect(turn.messages.map((m) => m._getType())).toEqual(["system", "human", "ai", "tool", "ai"]);
  });

  it("doesn't run the same call twice in a turn: it reminds the model of the earlier result instead", async () => {
    let runs = 0;
    const counted: AgentTool = { ...double, run: ({ n }) => (runs++, `The result is ${n * 2}.`) };
    const model = new ScriptedModel([callTool("double", { n: 3 }, "a"), callTool("double", { n: 3 }, "b"), say("6.")]);
    const turn = await runAgentTurn({ model, tools: [counted], messages: start() });
    expect(runs).toBe(1);
    const reminder = String(model.received[2].at(-1)!.content);
    expect(reminder).toMatch(/already called double with these arguments/i);
    expect(reminder).toContain("The result is 6.");
    expect(turn.toolCalls.map((c) => c.ok)).toEqual([true, false]);
  });

  it("recognizes a repeated call even when the arguments come in a different order", async () => {
    let runs = 0;
    const pair: AgentTool = { name: "pair", description: "d", schema: z.object({ a: z.number(), b: z.number() }), run: () => (runs++, "done") };
    const model = new ScriptedModel([callTool("pair", { a: 1, b: 2 }, "x"), callTool("pair", { b: 2, a: 1 }, "y"), say("ok")]);
    await runAgentTurn({ model, tools: [pair], messages: start() });
    expect(runs).toBe(1);
  });

  it("reports each tool result as it arrives, with whether it succeeded", async () => {
    const seen: string[] = [];
    const model = new ScriptedModel([callTool("double", { n: 2 }), callTool("missing", {}), say("4.")]);
    await runAgentTurn({ model, tools: [double], messages: start(), onToolResult: (name, ok, content) => seen.push(`${name} ${ok} ${content}`) });
    expect(seen).toEqual(["double true The result is 4.", 'missing false There is no tool named "missing".']);
  });

  it("adds a visible note when the answer is cut and no continuation is allowed, whatever the provider calls it", async () => {
    for (const metadata of [{ done_reason: "length" }, { finish_reason: "length" }, { stop_reason: "max_tokens" }]) {
      const cut = new AIMessage({ content: "A long answer that", response_metadata: metadata });
      const turn = await runAgentTurn({ model: new ScriptedModel([cut]), tools: [double], messages: start(), maxContinuations: 0 });
      expect(turn.truncated).toBe(true);
      expect(turn.reply).toMatch(/^A long answer that\n\n\(The answer was cut off at the length limit/);
    }
    const whole = await runAgentTurn({ model: new ScriptedModel([new AIMessage({ content: "Done.", response_metadata: { done_reason: "stop" } })]), tools: [double], messages: start() });
    expect(whole).toMatchObject({ truncated: false, reply: "Done.", continuations: 0 });
  });

  it("continues a cut answer automatically and joins the parts, keeping only the whole answer in the conversation", async () => {
    const cut = (text: string) => new AIMessage({ content: text, response_metadata: { done_reason: "length" } });
    const model = new ScriptedModel([cut("First part, "), new AIMessage({ content: "second part.", response_metadata: { done_reason: "stop" } })]);
    const turn = await runAgentTurn({ model, tools: [double], messages: start() });
    expect(turn).toMatchObject({ reply: "First part, second part.", truncated: false, continuations: 1 });
    const request = model.received[1];
    expect(String(request.at(-2)!.content)).toBe("First part, ");
    expect(String(request.at(-1)!.content)).toMatch(/continue exactly where you stopped/i);
    expect(turn.messages.map((m) => m._getType())).toEqual(["system", "human", "ai"]);
    expect(String(turn.messages.at(-1)!.content)).toBe("First part, second part.");
  });

  it("stops continuing after the limit, and then shows the note", async () => {
    const cut = (text: string) => new AIMessage({ content: text, response_metadata: { done_reason: "length" } });
    const model = new ScriptedModel([cut("a "), cut("b "), cut("c ")]);
    const turn = await runAgentTurn({ model, tools: [double], messages: start(), maxContinuations: 2 });
    expect(model.received).toHaveLength(3);
    expect(turn).toMatchObject({ truncated: true, continuations: 2 });
    expect(turn.reply).toMatch(/^a b c\n\n\(The answer was cut off/);
  });

  it("doesn't continue when the conversation with the answer so far wouldn't fit the context window", async () => {
    // About 10,000 tokens by the estimate: far more than the 6,912 usable, so no continuation can fit.
    const long = new AIMessage({ content: "x".repeat(30_000), response_metadata: { done_reason: "length" } });
    const model = new ScriptedModel([long]);
    const turn = await runAgentTurn({ model, tools: [double], messages: start(), budget: { contextTokens: 8192, answerTokens: 1024 } });
    expect(model.received).toHaveLength(1);
    expect(turn).toMatchObject({ truncated: true, continuations: 0 });
  });

  it("announces each tool call as it happens", async () => {
    const seen: string[] = [];
    await runAgentTurn({ model: new ScriptedModel([callTool("double", { n: 5 }), say("10.")]), tools: [double], messages: start(), onToolCall: (name, args) => seen.push(`${name} ${JSON.stringify(args)}`) });
    expect(seen).toEqual(['double {"n":5}']);
  });

  it("refuses to send a conversation that doesn't fit the context window, counting the tool definitions", async () => {
    const model = new ScriptedModel([say("never")]);
    const long = [new SystemMessage("x".repeat(30_000)), new HumanMessage("hi")];
    await expect(runAgentTurn({ model, tools: [double], messages: long, budget: { contextTokens: 8192, answerTokens: 1024 } })).rejects.toThrow(PromptTooLongError);
    expect(model.received).toEqual([]);
  });
});