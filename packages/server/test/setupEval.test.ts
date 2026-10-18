import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import { describe, expect, it } from "vitest";
import type { ToolCallingModel } from "../src/agents/agentLoop";
import { SetupSession, setupTools } from "../src/agents/setup/tools";
import { checkConversation, formatSetupReport, runSetupScenario, summarizeSetupRuns, type SetupScenario } from "../src/evaluation/setupEval";

class ScriptedModel implements ToolCallingModel {
  constructor(private readonly replies: AIMessage[]) {}
  async invoke(_messages: BaseMessage[]) {
    const reply = this.replies.shift();
    if (!reply) throw new Error("The script has no more replies.");
    return reply;
  }
}
const call = (name: string, args: Record<string, unknown>) => new AIMessage({ content: "", tool_calls: [{ id: `c-${name}-${Math.random()}`, name, args, type: "tool_call" }] });
const say = (text: string) => new AIMessage(text);

const SCENARIO: SetupScenario = {
  id: "veterans-hovering",
  turns: ["We are veterans.", "Turn on Hovering on Death's Door.", "Call it Iron party."],
  expect: { rules: { abilityScoreMethod: "I", hoveringOnDeathsDoor: true }, gameName: "Iron party" },
};

function agentWith(replies: AIMessage[]) {
  const session = new SetupSession();
  const tools = setupTools(session, { answer: async () => { throw new Error("unused"); } });
  return { session, tools, model: new ScriptedModel(replies), initialMessages: () => [] as BaseMessage[] };
}

const goodConversation = () => [
  call("propose_settings", { preset: "difficult" }), say("Difficult is your draft: Method I (Player's Handbook, Chapter 1: Rolling Ability Scores)."),
  call("propose_settings", { hoveringOnDeathsDoor: "on" }), say("Done."),
  call("request_game_creation", { name: "Iron Party" }), say("Please confirm at the keyboard."),
];


describe("runSetupScenario", () => {
  it("plays the turns in order, recording each reply and tool call, and the final draft and creation request", async () => {
    const run = await runSetupScenario(SCENARIO, agentWith(goodConversation()));
    expect(run.turns.map((t) => t.user)).toEqual(SCENARIO.turns);
    expect(run.turns[0].toolCalls).toEqual([expect.objectContaining({ name: "propose_settings", ok: true })]);
    expect(run.finalDraft?.rules.hoveringOnDeathsDoor).toBe(true);
    expect(run.creation).toEqual({ name: "Iron Party" });
  });


});

describe("checkConversation", () => {
  it("passes every check for a conversation that does everything right, even with a capitalized name and a cited \"Rolling Ability Scores\"", async () => {
    const run = await runSetupScenario(SCENARIO, agentWith(goodConversation()));
    expect(run.checks).toEqual({ usedTools: true, draftAsExpected: true, creationRequested: true, noJsonInReplies: true, noFalseCreationClaim: true, stayedInScope: true, noFailedCalls: true, noRoundLimit: true });
  });

  it("catches what the fourth real test showed: JSON in replies, a false creation claim, drifting into character creation", () => {
    const checks = checkConversation(
      SCENARIO,
      [
        { user: "a", reply: 'Here are the settings:\n```json\n{"name": "Test 3"}\n```', toolCalls: [], stoppedAtLimit: false },
        { user: "b", reply: 'The game "Test 3" is now created with these settings.', toolCalls: [], stoppedAtLimit: false },
        { user: "c", reply: "Let's roll your ability scores using Method III. Who wants to create the first character?", toolCalls: [], stoppedAtLimit: false },
      ],
      undefined,
      undefined,
    );
    expect(checks).toMatchObject({ usedTools: false, draftAsExpected: false, creationRequested: false, noJsonInReplies: false, noFalseCreationClaim: false, stayedInScope: false });
  });


});

describe("summarizeSetupRuns and formatSetupReport", () => {
  it("gives each check's pass rate per scenario, and a report with every transcript", async () => {
    const good = await runSetupScenario(SCENARIO, agentWith(goodConversation()));
    const bad = await runSetupScenario(SCENARIO, agentWith([say("```json\n{}\n```"), say("x"), say("y")]));
    const summary = summarizeSetupRuns([good, bad]);
    expect(summary["veterans-hovering"]).toMatchObject({ runs: 2, passed: { usedTools: 1, noJsonInReplies: 1, creationRequested: 1 } });
    const report = formatSetupReport([good, bad], "qwen2.5:7b");
    expect(report).toContain("veterans-hovering");
    expect(report).toContain("1/2");
    expect(report).toContain("We are veterans.");
    expect(report).toContain("propose_settings");
  });
});