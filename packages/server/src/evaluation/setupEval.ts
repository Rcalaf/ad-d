import { HumanMessage } from "@langchain/core/messages";
import { DmStyleSchema, PRESET_NAMES, RulesSchema, type GameSettings } from "@dnd/shared";
import { z } from "zod";
import { runAgentTurn } from "../agents/agentLoop";
import type { SetupAgentParts } from "../agents/setup/agent";

/**
 * A repeatable test of the setup agent: fixed player messages, played against the real model several times,
 * with automatic checks of what went right or wrong. It replaces judging versions from single conversations,
 * which vary from run to run. Creation is only requested, never performed: nothing is written to the games database.
 */

const ScenarioSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "id must use lowercase letters, digits and dashes"),
  /** The players' messages, in order. */
  turns: z.array(z.string().min(1)).min(1, "a scenario needs at least one turn"),
  /** What should result: the final draft's key settings, and the name in the creation request. */
  expect: z.object({
    preset: z.enum([...PRESET_NAMES, "custom"]).optional(),
    rules: RulesSchema.partial().optional(),
    dmStyle: DmStyleSchema.partial().optional(),
    gameName: z.string().optional(),
  }),
});

export type SetupScenario = z.infer<typeof ScenarioSchema>;

export function parseScenarios(json: string): SetupScenario[] {
  const raw: unknown = JSON.parse(json);
  if (!Array.isArray(raw)) throw new Error("The scenario file must contain a list of scenarios.");
  return raw.map((item, i) => {
    const result = ScenarioSchema.safeParse(item);
    if (!result.success) {
      const id = (item as { id?: string })?.id ?? `scenario ${i + 1}`;
      throw new Error(`${id}: ${result.error.issues.map((issue) => issue.message).join("; ")}`);
    }
    return result.data;
  });
}

export interface TranscriptToolCall {
  name: string;
  args: unknown;
  ok?: boolean;
  /** The first line of the tool's result. */
  result?: string;
}

export interface TurnRecord {
  user: string;
  reply: string;
  toolCalls: TranscriptToolCall[];
  stoppedAtLimit: boolean;
  error?: string;
}

export interface SetupChecks {
  usedTools: boolean;
  draftAsExpected: boolean;
  creationRequested: boolean;
  noJsonInReplies: boolean;
  noFalseCreationClaim: boolean;
  /** A heuristic: phrases that start character creation, such as "roll your ability scores". */
  stayedInScope: boolean;
  noFailedCalls: boolean;
  noRoundLimit: boolean;
}

export const CHECK_NAMES: (keyof SetupChecks)[] = [
  "usedTools",
  "draftAsExpected",
  "creationRequested",
  "noJsonInReplies",
  "noFalseCreationClaim",
  "stayedInScope",
  "noFailedCalls",
  "noRoundLimit",
];

export interface ScenarioRun {
  scenario: string;
  run: number;
  turns: TurnRecord[];
  finalDraft?: GameSettings;
  creation?: { name: string };
  checks: SetupChecks;
}

/** Tool arguments written as text: a fenced JSON block, or an object of quoted keys. */
const JSON_IN_TEXT = /```json|\{\s*"[A-Za-z_]+"\s*:/;
/** The agent announcing a creation itself, which only the program does after the person confirms. */
const CREATION_CLAIM = /\b(?:game|it)\b[^.\n]{0,40}?\b(?:is|has been|was)\s+(?:now\s+)?(?:successfully\s+)?created\b|\bI(?:'ve| have)?\s+(?:just\s+)?created\b/i;
/**
 * Phrases that start character creation, which is a later step. "your" or "the" is required, so the book reference
 * "Rolling Ability Scores", which the agent rightly cites, doesn't count.
 */
const CHARACTER_CREATION = /\broll(?:ing)? (?:up )?(?:your|the) ability scores\b|\b(?:start|begin)\w* (?:creating|to create) (?:your )?characters?\b|\bfirst character\b|\bwho (?:would like|wants) to (?:go first|create)\b/i;

export function checkConversation(
  scenario: SetupScenario,
  turns: TurnRecord[],
  finalDraft: GameSettings | undefined,
  creation: { name: string } | undefined,
): SetupChecks {
  const { expect } = scenario;
  const matches = (actual: Record<string, unknown>, wanted: Record<string, unknown> | undefined) =>
    Object.entries(wanted ?? {}).every(([key, value]) => actual[key] === value);
  const draftAsExpected =
    finalDraft !== undefined &&
    (expect.preset === undefined || finalDraft.preset === expect.preset) &&
    matches(finalDraft.rules, expect.rules) &&
    matches(finalDraft.dmStyle, expect.dmStyle);
  return {
    usedTools: turns.some((t) => t.toolCalls.length > 0),
    draftAsExpected,
    // Letter case ignored: the model often capitalizes a name ("Friday Group" for "Friday group").
    creationRequested: expect.gameName === undefined ? creation !== undefined : creation?.name.toLowerCase() === expect.gameName.toLowerCase(),
    noJsonInReplies: !turns.some((t) => JSON_IN_TEXT.test(t.reply)),
    noFalseCreationClaim: !turns.some((t) => CREATION_CLAIM.test(t.reply)),
    stayedInScope: !turns.some((t) => CHARACTER_CREATION.test(t.reply)),
    noFailedCalls: turns.every((t) => t.toolCalls.every((c) => c.ok !== false)),
    noRoundLimit: !turns.some((t) => t.stoppedAtLimit),
  };
}

/** Plays one scenario: each player message in turn, recording replies and tool calls. A failing turn is recorded and the run goes on. */
export async function runSetupScenario(
  scenario: SetupScenario,
  agent: SetupAgentParts,
  run = 1,
  onTurn?: (turn: number, total: number) => void,
): Promise<ScenarioRun> {
  let messages = agent.initialMessages();
  const turns: TurnRecord[] = [];
  for (const [i, user] of scenario.turns.entries()) {
    onTurn?.(i + 1, scenario.turns.length);
    const record: TurnRecord = { user, reply: "", toolCalls: [], stoppedAtLimit: false };
    try {
      const turn = await runAgentTurn({
        model: agent.model,
        tools: agent.tools,
        messages: [...messages, new HumanMessage(user)],
        budget: agent.budget,
        onToolCall: (name, args) => record.toolCalls.push({ name, args }),
        onToolResult: (_name, ok, content) => Object.assign(record.toolCalls.at(-1)!, { ok, result: content.split("\n")[0] }),
      });
      messages = turn.messages;
      record.reply = turn.reply;
      record.stoppedAtLimit = turn.stoppedAtLimit;
    } catch (error) {
      record.error = error instanceof Error ? error.message : String(error);
    }
    turns.push(record);
  }
  const finalDraft = agent.session.draft;
  const creation = agent.session.creation;
  return { scenario: scenario.id, run, turns, finalDraft, creation, checks: checkConversation(scenario, turns, finalDraft, creation) };
}

export type SetupSummary = Record<string, { runs: number; passed: Record<keyof SetupChecks, number> }>;

/** For each scenario, how many runs passed each check. */
export function summarizeSetupRuns(runs: ScenarioRun[]): SetupSummary {
  const summary: SetupSummary = {};
  for (const run of runs) {
    const entry = (summary[run.scenario] ??= { runs: 0, passed: Object.fromEntries(CHECK_NAMES.map((c) => [c, 0])) as Record<keyof SetupChecks, number> });
    entry.runs++;
    for (const check of CHECK_NAMES) if (run.checks[check]) entry.passed[check]++;
  }
  return summary;
}

const CHECK_LABELS: Record<keyof SetupChecks, string> = {
  usedTools: "Used tools",
  draftAsExpected: "Draft as expected",
  creationRequested: "Creation requested, right name",
  noJsonInReplies: "No JSON in replies",
  noFalseCreationClaim: "No false creation claim",
  stayedInScope: "Stayed in scope (heuristic)",
  noFailedCalls: "No failed tool calls",
  noRoundLimit: "No round limit reached",
};

/** The report: pass rates per scenario and check, then every conversation's transcript with its tool calls. */
export function formatSetupReport(runs: ScenarioRun[], model: string, date = new Date()): string {
  const summary = summarizeSetupRuns(runs);
  const scenarios = Object.keys(summary);
  const out = [
    `# Setup agent evaluation`,
    ``,
    `${date.toISOString().slice(0, 16).replace("T", " ")} · model ${model} · ${runs.length} conversations`,
    ``,
    `| Check | ${scenarios.join(" | ")} |`,
    `| --- | ${scenarios.map(() => "---").join(" | ")} |`,
    ...CHECK_NAMES.map((check) => `| ${CHECK_LABELS[check]} | ${scenarios.map((s) => `${summary[s].passed[check]}/${summary[s].runs}`).join(" | ")} |`),
    ``,
  ];
  for (const run of runs) {
    const failed = CHECK_NAMES.filter((c) => !run.checks[c]).map((c) => CHECK_LABELS[c]);
    out.push(`## ${run.scenario}, run ${run.run}`, ``, failed.length ? `Failed: ${failed.join("; ")}` : `All checks passed.`, ``);
    for (const turn of run.turns) {
      out.push(`**Player:** ${turn.user}`, ``);
      for (const c of turn.toolCalls) out.push(`- ${c.name} ${JSON.stringify(c.args)} → ${c.ok === false ? "failed" : "ok"}${c.result ? `: ${c.result.slice(0, 160)}` : ""}`);
      if (turn.toolCalls.length) out.push(``);
      out.push(turn.error ? `**Error:** ${turn.error}` : `**Agent:** ${turn.reply.length > 800 ? `${turn.reply.slice(0, 800)}...` : turn.reply}`, ``);
    }
    if (run.finalDraft) out.push(`Final draft: ${run.finalDraft.preset} · ${JSON.stringify(run.finalDraft.rules)} · ${JSON.stringify(run.finalDraft.dmStyle)}`, ``);
    out.push(`Creation requested: ${run.creation ? `"${run.creation.name}"` : "no"}`, ``);
  }
  return out.join("\n");
}