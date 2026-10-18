import { presetSettings } from "@dnd/shared";
import { describe, expect, it } from "vitest";
import type { AnswerResult } from "../src/answering/answerQuestion";
import type { AgentTool } from "../src/agents/agentLoop";
import { SETUP_INSTRUCTIONS } from "../src/agents/setup/prompt";
import { SetupSession, setupTools } from "../src/agents/setup/tools";

const answer = (overrides: Partial<AnswerResult> = {}): AnswerResult => ({
  question: "q",
  answer: "Method V is 4d6, drop the lowest, arrange as desired [1].",
  sources: [
    { number: 1, book: "phb", title: "Player's Handbook", location: "Chapter 1 > Rolling Ability Scores", pages: [18, 19], notes: [] },
    { number: 2, book: "dmg", title: "Dungeon Master Guide", location: "Chapter 1", pages: [11], notes: [] },
  ],
  cited: [1],
  checks: { unknownCitations: [], uncited: false },
  notEnglish: false,
  tokens: { promptChars: 1, estimated: 1 },
  timings: { retrievalMs: 1, modelMs: 1 },
  ...overrides,
});

function tools(result: Partial<AnswerResult> = {}) {
  const session = new SetupSession();
  const asked: string[] = [];
  const list = setupTools(session, { answer: async (q) => (asked.push(q), answer(result)) });
  const byName = (name: string) => list.find((t) => t.name === name) as AgentTool;
  const run = async (name: string, args: unknown) => byName(name).run(byName(name).schema.parse(args));
  return { session, asked, run, list };
}

describe("setup tools", () => {
  it("offer exactly the four tools of the design", () => {
    expect(tools().list.map((t) => t.name)).toEqual(["search_rules", "describe_presets", "propose_settings", "request_game_creation"]);
  });

  it("search_rules returns the answer with only the sources it cites, by book, location and pages", async () => {
    const { run, asked } = tools();
    const text = await run("search_rules", { question: "How does Method V work?" });
    expect(asked).toEqual(["How does Method V work?"]);
    expect(text).toContain("Method V is 4d6");
    expect(text).toContain("[1] Player's Handbook · Chapter 1 > Rolling Ability Scores · p. 18-19");
    expect(text).not.toContain("Dungeon Master Guide");
  });

  it("search_rules says plainly when the answer cites nothing, so the agent doesn't present it as a rule", async () => {
    const text = await tools({ cited: [], checks: { unknownCitations: [], uncited: true } }).run("search_rules", { question: "Is there a critical hit rule?" });
    expect(text).toMatch(/cites no sources/i);
  });

  it("describe_presets explains each setting once, then gives each preset's values, compactly", async () => {
    const text = await tools().run("describe_presets", {});
    expect(text).toMatch(/what each setting means/i);
    expect(text).toMatch(/until −10 hit points/);
    expect(text).toMatch(/our design/i);
    expect(text).toContain("Player's Handbook, Chapter 5");
    for (const name of ["Easy:", "Medium:", "Difficult:"]) expect(text).toContain(name);
    expect(text).toMatch(/don't add references/i);
    // Sent to the model every time it's called: kept short enough not to crowd the context window.
    expect(text.length).toBeLessThan(5000);
  });

  it("propose_settings applies a preset to the draft and describes the result", async () => {
    const { run, session } = tools();
    const text = await run("propose_settings", { preset: "easy" });
    expect(session.draft).toEqual(presetSettings("easy"));
    expect(text).toContain("Preset: easy");
    expect(text).toContain("Ability score method: Method V");
  });

  it("propose_settings changes the current draft, which then becomes custom", async () => {
    const { run, session } = tools();
    await run("propose_settings", { preset: "easy" });
    await run("propose_settings", { abilityScoreMethod: "I" });
    expect(session.draft?.preset).toBe("custom");
    expect(session.draft?.rules.abilityScoreMethod).toBe("I");
  });

  it("propose_settings turns specialization off with weapon proficiencies, and says so", async () => {
    const { run, session } = tools();
    await run("propose_settings", { preset: "medium" });
    const text = await run("propose_settings", { weaponProficiencies: "off" });
    expect(session.draft?.rules).toMatchObject({ weaponProficiencies: false, weaponSpecialization: false });
    expect(text).toMatch(/weapon specialization was turned off too/i);
  });

  it("propose_settings turns weapon proficiencies on with specialization, and says so", async () => {
    const { run, session } = tools();
    await run("propose_settings", { preset: "easy" });
    const text = await run("propose_settings", { weaponSpecialization: "on" });
    expect(session.draft?.rules).toMatchObject({ weaponProficiencies: true, weaponSpecialization: true });
    expect(text).toMatch(/weapon proficiencies were turned on too/i);
  });

  it("propose_settings takes non-weapon proficiencies as \"on\" (allowed) or \"off\", like the other on/off settings", async () => {
    const { run, session } = tools();
    await run("propose_settings", { preset: "medium", nonweaponProficiencies: "off" });
    expect(session.draft?.rules.nonweaponProficiencies).toBe("off");
    await run("propose_settings", { nonweaponProficiencies: "on" });
    expect(session.draft?.rules.nonweaponProficiencies).toBe("allowed");
  });

  it("propose_settings takes on/off settings as exactly \"on\" or \"off\", the words the agent reads, and refuses anything else", async () => {
    const { run, session, list } = tools();
    await run("propose_settings", { preset: "medium" });
    await run("propose_settings", { weaponProficiencies: "off", hoveringOnDeathsDoor: "On" });
    expect(session.draft?.rules).toMatchObject({ weaponProficiencies: false, weaponSpecialization: false, hoveringOnDeathsDoor: true });
    const propose = list.find((t) => t.name === "propose_settings")!;
    for (const value of ["true", "yes", true, "maybe"]) {
      const result = propose.schema.safeParse({ weaponProficiencies: value });
      expect(result.success, String(value)).toBe(false);
      expect(result.error?.issues[0].message).toMatch(/'on' \| 'off'/);
    }
  });

  it("propose_settings tells the agent to show the result and stop, after a successful change", async () => {
    const { run } = tools();
    expect(await run("propose_settings", { preset: "easy" })).toMatch(/show these settings to the players now.*don't call propose_settings again/is);
  });

  it("propose_settings still refuses an explicit contradiction, as a failure, and keeps the draft as it was", async () => {
    const { run, session } = tools();
    await run("propose_settings", { preset: "easy" });
    const refusal = run("propose_settings", { weaponProficiencies: "off", weaponSpecialization: "on" });
    await expect(refusal).rejects.toThrow(/not applied.*specialization.*explain this to the players/is);
    expect(session.draft).toEqual(presetSettings("easy"));
  });

  it("propose_settings starts from the medium preset when none has been chosen yet, and says so", async () => {
    const { run, session } = tools();
    const text = await run("propose_settings", { abilityScoreMethod: "I" });
    expect(text).toMatch(/started from the medium preset/i);
    expect(session.draft).toMatchObject({ preset: "custom", rules: { ...presetSettings("medium").rules, abilityScoreMethod: "I" } });
  });

  it("request_game_creation records the request without saving anything, and needs a draft", async () => {
    const { run, session } = tools();
    await expect(run("request_game_creation", { name: "Friday group" })).rejects.toThrow(/no settings yet/i);
    expect(session.creation).toBeUndefined();
    await run("propose_settings", { preset: "medium" });
    const text = await run("request_game_creation", { name: "  Friday group " });
    expect(session.creation).toEqual({ name: "Friday group" });
    expect(text).toMatch(/asks the person at the keyboard to confirm/i);
  });
});

describe("SETUP_INSTRUCTIONS", () => {
  it("stay short: a few clear rules, not a growing list of patches", () => {
    expect(SETUP_INSTRUCTIONS.split(/\s+/).length).toBeLessThanOrEqual(220);
  });

  it("limit the agent to the settings, and name the tools it acts through", () => {
    expect(SETUP_INSTRUCTIONS).toMatch(/that is your only job: it ends when the game is created/i);
    for (const tool of ["describe_presets", "search_rules", "propose_settings", "request_game_creation"]) expect(SETUP_INSTRUCTIONS).toContain(tool);
  });
});