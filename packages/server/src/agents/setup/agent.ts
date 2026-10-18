import { AIMessage, SystemMessage, type BaseMessage } from "@langchain/core/messages";
import { answerQuestion, type RulesSearch } from "../../answering/answerQuestion";
import type { Settings } from "../../config";
import type { WindowBudget } from "../../llm/contextWindow";
import { getChatModel } from "../../llm/provider";
import { toLangChainTools, type AgentTool, type ToolCallingModel } from "../agentLoop";
import { SETUP_INSTRUCTIONS } from "./prompt";
import { SetupSession, setupTools } from "./tools";

/** Rules answers stick to the sources; the conversation itself can be a little freer. */
const SETUP_ANSWER_TEMPERATURE = 0.1;
const SETUP_AGENT_TEMPERATURE = 0.3;
/**
 * The setup agent's answer length: twice the default, leaving about 5,900 tokens of the 8,192-token window for
 * the instructions, tools and conversation. Longer answers are continued automatically (up to twice).
 */
const SETUP_AGENT_ANSWER_TOKENS = 2048;
export const SETUP_OPENING = "Let's set up your game. How experienced is your group with AD&D 2nd Edition: new players, some experience, or veterans?";

/** Everything a setup conversation needs. The new-game command and the evaluation both use this, so they run the same agent. */
export interface SetupAgentParts {
  session: SetupSession;
  tools: AgentTool[];
  model: ToolCallingModel;
  /** The agent's window check, with its own answer length, so the two can't disagree. */
  budget?: WindowBudget;
  /** The conversation's start: the instructions, and the opening question. */
  initialMessages: () => BaseMessage[];
}

/** Builds the setup agent: its session, tools (with the rules search), and the model with the tools bound. */
export function createSetupAgent(settings: Settings, index: RulesSearch): SetupAgentParts {
  const answerModel = getChatModel(settings, { temperature: SETUP_ANSWER_TEMPERATURE });
  const answerBudget = { contextTokens: settings.contextTokens, answerTokens: settings.answerTokens };
  const session = new SetupSession();
  const tools = setupTools(session, { answer: (question) => answerQuestion(question, { index, model: answerModel, budget: answerBudget }) });

  const chat = getChatModel(settings, { temperature: SETUP_AGENT_TEMPERATURE, answerTokens: SETUP_AGENT_ANSWER_TOKENS });
  if (!chat.bindTools) throw new Error(`The model provider for ${settings.llmModel} doesn't support tools.`);
  const model = chat.bindTools(toLangChainTools(tools)) as unknown as ToolCallingModel;

  return {
    session,
    tools,
    model,
    budget: { contextTokens: settings.contextTokens, answerTokens: SETUP_AGENT_ANSWER_TOKENS },
    initialMessages: () => [new SystemMessage(SETUP_INSTRUCTIONS), new AIMessage(SETUP_OPENING)],
  };
}