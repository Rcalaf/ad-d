import { AIMessage, HumanMessage, ToolMessage, type BaseMessage } from "@langchain/core/messages";
import { tool as langChainTool, type StructuredToolInterface } from "@langchain/core/tools";
import { toJsonSchema } from "@langchain/core/utils/json_schema";
import { z } from "zod";
import { assertPromptFits, PromptTooLongError, type WindowBudget } from "../llm/contextWindow";

/**
 * A tool an agent can use: a plain function with a Zod schema for its arguments.
 * It returns text for the model. Agents never see how tools are implemented.
 */
export interface AgentTool<Schema extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  schema: Schema;
  run(args: z.infer<Schema>): Promise<string> | string;
}

/** What the loop needs from a model with tools bound: getChatModel(...).bindTools(...) fits, and tests pass a scripted one. */
export interface ToolCallingModel {
  invoke(messages: BaseMessage[]): Promise<AIMessage>;
}

export interface ToolCallRecord {
  name: string;
  args: unknown;
  /** False when the tool was unknown, its arguments were invalid, or it failed. */
  ok: boolean;
}

export interface AgentTurn {
  /** The model's final answer in words. */
  reply: string;
  /** The whole conversation after this turn, to pass to the next one. */
  messages: BaseMessage[];
  toolCalls: ToolCallRecord[];
  /** True when the turn ended because of the round limit rather than a final answer. */
  stoppedAtLimit: boolean;
  /** True when the final answer was still cut off at the length limit, after any continuations. */
  truncated: boolean;
  /** How many times a cut answer was continued automatically. */
  continuations: number;
}

const CONTINUE = "Continue exactly where you stopped, without repeating anything.";

const TRUNCATED_NOTE = "(The answer was cut off at the length limit. Ask for a shorter answer, or one part at a time.)";

/** Whether the model stopped because of the length limit: Ollama, OpenAI-compatible servers and Anthropic name it differently. */
function cutAtLimit(metadata: Record<string, unknown> | undefined): boolean {
  return metadata?.done_reason === "length" || metadata?.finish_reason === "length" || metadata?.stop_reason === "max_tokens";
}

/** The tools in LangChain's format, only to tell the model about them: our loop runs them itself. */
export function toLangChainTools(tools: AgentTool[]): StructuredToolInterface[] {
  return tools.map((t) => langChainTool(async () => "", { name: t.name, description: t.description, schema: t.schema }) as StructuredToolInterface);
}

/**
 * One turn of an agent: the model answers or asks for tools; requested tools run and their results go back,
 * until the model answers in words or the round limit is reached.
 * Every tool request gets exactly one result with its id. Unknown tools, invalid arguments and tool errors
 * are returned to the model as text, so it can correct itself, instead of stopping the conversation.
 */
export async function runAgentTurn(options: {
  model: ToolCallingModel;
  tools: AgentTool[];
  messages: BaseMessage[];
  /** Model calls allowed in one turn. Default 6. */
  maxRounds?: number;
  /** When given, the conversation and tool definitions are checked against the context window before each call. */
  budget?: WindowBudget;
  onToolCall?: (name: string, args: unknown) => void;
  /** Called with each tool's result, and whether it succeeded, for progress displays and debugging. */
  onToolResult?: (name: string, ok: boolean, content: string) => void;
  /**
   * How many times an answer cut at the length limit is continued automatically. Default 2: each continuation
   * re-sends the conversation plus everything written so far, so more would rarely fit the context window.
   */
  maxContinuations?: number;
  onContinuation?: (count: number) => void;
}): Promise<AgentTurn> {
  const { model, tools, maxRounds = 6, budget, onToolCall, onToolResult, maxContinuations = 2, onContinuation } = options;
  const messages = [...options.messages];
  const toolCalls: ToolCallRecord[] = [];
  const byName = new Map(tools.map((t) => [t.name, t]));
  // Results of the calls already made in this turn, by tool and arguments: a small model may repeat a call
  // that didn't give what it hoped for, so a repeat is answered with a reminder instead of running again.
  const done = new Map<string, string>();
  // Tool definitions are sent with every request, so they count in the window too.
  const toolDefinitions = tools.map((t) => `${t.name} ${t.description} ${JSON.stringify(toJsonSchema(t.schema))}`);

  for (let round = 0; round < maxRounds; round++) {
    if (budget) assertPromptFits([...toolDefinitions, ...messages.map((m) => String(m.content))], budget);
    const response = await model.invoke(messages);
    messages.push(response);
    const requests = response.tool_calls ?? [];
    if (requests.length === 0) {
      // A cut answer is continued: the conversation, the answer so far, and a request to go on. The parts are
      // joined, and the history keeps only the whole answer, not the continuation requests.
      const before = messages.slice(0, -1);
      let text = rawText(response.content);
      let truncated = cutAtLimit(response.response_metadata);
      let continuations = 0;
      while (truncated && continuations < maxContinuations) {
        const request = [...before, new AIMessage(text), new HumanMessage(CONTINUE)];
        if (budget && !fits([...toolDefinitions, ...request.map((m) => String(m.content))], budget)) break;
        const more = await model.invoke(request);
        if ((more.tool_calls ?? []).length > 0) break;
        continuations++;
        onContinuation?.(continuations);
        text += rawText(more.content);
        truncated = cutAtLimit(more.response_metadata);
      }
      if (continuations > 0) messages.splice(messages.length - 1, 1, new AIMessage(text));
      const reply = text.trim();
      return { reply: truncated ? `${reply}\n\n${TRUNCATED_NOTE}` : reply, messages, toolCalls, stoppedAtLimit: false, truncated, continuations };
    }
    for (const request of requests) {
      onToolCall?.(request.name, request.args);
      const key = `${request.name}|${stableJson(request.args)}`;
      const earlier = done.get(key);
      const { content, ok } =
        earlier !== undefined
          ? {
              content: `You already called ${request.name} with these arguments in this turn. Its result was:\n${earlier}\nDon't call it again with the same arguments: answer the players, or try something different.`,
              ok: false,
            }
          : await runTool(byName.get(request.name), request.name, request.args);
      if (earlier === undefined) done.set(key, content);
      onToolResult?.(request.name, ok, content);
      toolCalls.push({ name: request.name, args: request.args, ok });
      messages.push(new ToolMessage({ content, tool_call_id: request.id ?? request.name }));
    }
  }
  return {
    reply: `(The agent stopped after ${maxRounds} rounds of tool use without answering. Try rephrasing, or ask again.)`,
    messages,
    toolCalls,
    stoppedAtLimit: true,
    truncated: false,
    continuations: 0,
  };
}

async function runTool(tool: AgentTool | undefined, name: string, args: unknown): Promise<{ content: string; ok: boolean }> {
  if (!tool) return { content: `There is no tool named "${name}".`, ok: false };
  const parsed = tool.schema.safeParse(args);
  if (!parsed.success) {
    return { content: `Invalid arguments for ${name}: ${parsed.error.issues.map((i) => `${i.path.join(".") || "arguments"}: ${i.message}`).join("; ")}`, ok: false };
  }
  try {
    return { content: await tool.run(parsed.data), ok: true };
  } catch (error) {
    return { content: `${name} failed: ${error instanceof Error ? error.message : String(error)}`, ok: false };
  }
}

/** A reply's text as written, spaces included, so parts of a continued answer join correctly. */
function rawText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((p) => (typeof p === "string" ? p : p?.type === "text" ? p.text : "")).join("");
  return "";
}

/** Whether a prompt fits the window: the check before sending, as a yes or no. */
function fits(texts: string[], budget: WindowBudget): boolean {
  try {
    assertPromptFits(texts, budget);
    return true;
  } catch (error) {
    if (error instanceof PromptTooLongError) return false;
    throw error;
  }
}

/** JSON with object keys sorted, so the same arguments in a different order give the same text. */
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}