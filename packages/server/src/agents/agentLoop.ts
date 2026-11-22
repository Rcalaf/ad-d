import { AIMessage, HumanMessage, ToolMessage, type BaseMessage } from "@langchain/core/messages";
import { tool as langChainTool, type StructuredToolInterface } from "@langchain/core/tools";
import { toJsonSchema } from "@langchain/core/utils/json_schema";
import type { z } from "zod";
import { assertPromptFits, type WindowBudget } from "../llm/contextWindow";

/**
 * The agent loop, shared by every agent. One turn: the model either answers in words, or asks for tools;
 * requested tools run here and their results go back to the model, until it answers or the round limit is reached.
 * The model decides which tools to call; this code only runs them.
 */

/** A tool: a plain function, with a Zod schema describing and checking its arguments. It returns text for the model. */
export interface AgentTool<Schema extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  schema: Schema;
  run(args: z.infer<Schema>): Promise<string> | string;
}

/** What the loop needs from a model: getChatModel(...).bindTools(...) fits, and tests pass a scripted one. */
export interface ToolCallingModel {
  invoke(messages: BaseMessage[]): Promise<AIMessage>;
}

/** One tool use, as it happened. */
export interface ToolUse {
  name: string;
  args: unknown;
  ok: boolean;
  /** The text sent back to the model: the tool's result, or what went wrong. */
  result: string;
}

export interface AgentTurn {
  /** The model's answer in words. */
  reply: string;
  /** The whole conversation after the turn, to continue from in the next one. */
  messages: BaseMessage[];
  toolUses: ToolUse[];
  /** True when the turn ended because of the round limit, not with an answer. */
  stoppedAtRoundLimit: boolean;
  /**
   * Set when the final reply was not a complete answer: "cut-off" when it stopped at the answer limit with some
   * text, "empty" when it had no text at all. The reply then carries a note saying so.
   */
  problem?: "empty" | "cut-off";
}

/** The tools in LangChain's format, to describe them to the model. Running them is the loop's job, not LangChain's. */
export function toLangChainTools(tools: AgentTool[]): StructuredToolInterface[] {
  return tools.map((t) => langChainTool(async () => "", { name: t.name, description: t.description, schema: t.schema }) as StructuredToolInterface);
}

export async function runAgentTurn(options: {
  model: ToolCallingModel;
  tools: AgentTool[];
  messages: BaseMessage[];
  /** Model calls allowed in one turn. Default 6. */
  maxRounds?: number;
  /** When given, the conversation and the tool definitions are checked against the context window before each call. */
  budget?: WindowBudget;
  /** Called after each tool use, to show what the agent is doing. */
  onToolUse?: (use: ToolUse) => void;
  /**
   * A short note attached to the player's latest message, seen by the model in every call of this turn only.
   * Small models attend most to the latest message, where the instructions, sent first, are farthest away;
   * the note puts the key cue where the model is looking. The returned conversation keeps the message as typed.
   */
  turnReminder?: string;
}): Promise<AgentTurn> {
  const { model, tools, maxRounds = 6, budget, onToolUse, turnReminder } = options;
  const messages = [...options.messages];
  const toolUses: ToolUse[] = [];
  const toolsByName = new Map(tools.map((t) => [t.name, t]));
  // The tool definitions are sent with every call, so they take room in the context window too.
  const definitions = tools.map((t) => `${t.name} ${t.description} ${JSON.stringify(toJsonSchema(t.schema))}`);

  // The player's latest message, to which the reminder is attached when sending (never in the returned conversation).
  const latestHuman = messages.map((m) => m._getType()).lastIndexOf("human");
  const toSend = (): BaseMessage[] => {
    if (!turnReminder || latestHuman < 0) return messages;
    const withNote = [...messages];
    withNote[latestHuman] = new HumanMessage(`${String(messages[latestHuman].content)}\n\n[Note from the program, not from the player: ${turnReminder}]`);
    return withNote;
  };

  for (let round = 1; round <= maxRounds; round++) {
    const sending = toSend();
    if (budget) assertPromptFits([...definitions, ...sending.map((m) => String(m.content))], budget);
    const response = await model.invoke(sending);
    messages.push(response);

    const requests = response.tool_calls ?? [];
    if (requests.length === 0) {
      const { reply, problem } = checkReply(response);
      // An empty reply is replaced by its note in the conversation too: the agent then sees that its turn produced
      // nothing, instead of a question left unanswered, which made it answer one turn late.
      if (problem === "empty") messages[messages.length - 1] = new AIMessage(reply);
      return { reply, messages, toolUses, stoppedAtRoundLimit: false, problem };
    }

    // Every request gets exactly one result, with the request's id: the model needs both to continue.
    for (const request of requests) {
      const use = await runTool(toolsByName.get(request.name), request.name, request.args);
      toolUses.push(use);
      onToolUse?.(use);
      messages.push(new ToolMessage({ content: use.result, tool_call_id: request.id ?? request.name }));
    }
  }

  return {
    reply: `(The agent stopped after ${maxRounds} rounds of tool use without answering. Please rephrase or ask again.)`,
    messages,
    toolUses,
    stoppedAtRoundLimit: true,
    problem: undefined,
  };
}

/** Runs one tool. Problems become text for the model, so it can correct itself instead of the conversation failing. */
async function runTool(tool: AgentTool | undefined, name: string, args: unknown): Promise<ToolUse> {
  if (!tool) return { name, args, ok: false, result: `There is no tool named "${name}".` };
  const parsed = tool.schema.safeParse(args);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join(".") || "arguments"}: ${i.message}`).join("; ");
    return { name, args, ok: false, result: `Invalid arguments for ${name}: ${problems}` };
  }
  try {
    return { name, args, ok: true, result: await tool.run(parsed.data) };
  } catch (error) {
    return { name, args, ok: false, result: `${name} failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/** A reply's text: either a string, or a list of parts of which the text parts count. */
/** Whether a reply stopped at the answer limit, in the words of each provider. */
function stoppedAtLimit(metadata: Record<string, unknown> | undefined): boolean {
  return metadata?.done_reason === "length" || metadata?.finish_reason === "length" || metadata?.stop_reason === "max_tokens";
}

/**
 * The final reply's text, with a note when it isn't a complete answer. With a thinking model, the thinking counts
 * against the answer limit, so a long reasoning can leave no room for the answer: the note says how much it used.
 */
function checkReply(response: AIMessage): { reply: string; problem?: "empty" | "cut-off" } {
  const text = textOf(response.content);
  const atLimit = stoppedAtLimit(response.response_metadata);
  if (!text) {
    const thinking = String(response.additional_kwargs?.reasoning_content ?? "").length;
    const reason = atLimit ? `the model reached its answer limit${thinking ? `, after ${thinking} characters of thinking` : ""}` : "";
    return { reply: reason ? `(No answer: ${reason}. Please ask again.)` : "(No answer from the model. Please ask again.)", problem: "empty" };
  }
  if (atLimit) return { reply: `${text}\n\n(The answer was cut off at the length limit.)`, problem: "cut-off" };
  return { reply: text, problem: undefined };
}

function textOf(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return content.map((p) => (typeof p === "string" ? p : p?.type === "text" ? p.text : "")).join("").trim();
  return "";
}