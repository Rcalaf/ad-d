import { toJsonSchema } from "@langchain/core/utils/json_schema";
import { ABILITY_SCORE_METHODS, presetSettings } from "@dnd/shared";
import { describe, expect, it } from "vitest";
import { presetsTable, SetupSession, setupTools } from "../src/agents/setup/tools";

function make() {
  const session = new SetupSession();
  const tools = setupTools(session);
  const tool = (name: string) => tools.find((t) => t.name === name)!;
  const run = async (name: string, args: unknown) => tool(name).run(tool(name).schema.parse(args));
  return { session, tools, tool, run };
}

describe("setup tools", () => {
  it("are show_presets, set_settings and create_game", () => {
    expect(make().tools.map((t) => t.name)).toEqual(["show_presets", "set_settings", "create_game"]);
  });
});

describe("show_presets", () => {
  it("lists the three presets, each with every setting's value", async () => {
    const text = await make().run("show_presets", {});
    expect(text).toMatch(/^easy: abilityScoreMethod V, weaponProficiencies off, nonweaponProficiencies on, weaponSpecialization off, hoveringOnDeathsDoor on, encounterDifficulty below, adjustsEncountersInPlay always, explainsRules proactively$/m);
    expect(text).toMatch(/^medium: /m);
    expect(text).toMatch(/^difficult: abilityScoreMethod I,/m);
  });

  it("says what each setting is, and where the book options come from", async () => {
    const text = await make().run("show_presets", {});
    expect(text).toMatch(/hoveringOnDeathsDoor: Hovering on Death's Door \(Dungeon Master Guide, Chapter 9/);
    expect(text).toMatch(/encounterDifficulty: Encounter difficulty \(our design, not from the books\)/);
  });

  it("describes each ability score method, from the shared settings, so the agent has nothing to fill in", async () => {
    const text = await make().run("show_presets", {});
    for (const [id, method] of Object.entries(ABILITY_SCORE_METHODS)) expect(text).toContain(`${id}: ${method.description}`);
  });
});

describe("set_settings", () => {
  it("applies a preset, and returns the settings in the same words it accepts", async () => {
    const { run, session } = make();
    const text = await run("set_settings", { preset: "easy" });
    expect(session.settings).toEqual(presetSettings("easy"));
    expect(text).toMatch(/^Settings \(preset: easy\):/);
    expect(text).toContain("abilityScoreMethod: V (4d6, drop the lowest die, six times, arrange as desired)");
    expect(text).toContain("weaponProficiencies: off");
  });

  it("gives each value its plain-words meaning, as the confirmation shows it, when the meaning says more than the value", async () => {
    const text = await make().run("set_settings", { preset: "easy" });
    expect(text).toContain("- adjustsEncountersInPlay: always (Always, when the party is in trouble)");
    expect(text).toContain("- encounterDifficulty: below (Below the party's strength)");
    expect(text).toContain("- nonweaponProficiencies: on (Allowed: each player chooses)");
    expect(text).toContain("- explainsRules: proactively (Proactively, suggesting options)");
    expect(text).toMatch(/^- weaponProficiencies: off$/m);
    expect(text).toMatch(/^- hoveringOnDeathsDoor: on$/m);
  });

  it("changes the current settings, which then become custom", async () => {
    const { run, session } = make();
    await run("set_settings", { preset: "easy" });
    const text = await run("set_settings", { abilityScoreMethod: "III", encounterDifficulty: "matched" });
    expect(session.settings).toMatchObject({ preset: "custom", rules: { abilityScoreMethod: "III" }, dmStyle: { encounterDifficulty: "matched" } });
    expect(text).toMatch(/^Settings \(preset: custom\):/);
  });

  it("starts from the medium preset when nothing has been chosen yet, and says so", async () => {
    const { run, session } = make();
    const text = await run("set_settings", { hoveringOnDeathsDoor: "off" });
    expect(text).toMatch(/started from the medium preset/i);
    expect(session.settings?.rules).toMatchObject({ ...presetSettings("medium").rules, hoveringOnDeathsDoor: false });
  });

  it("changes dependent settings together, and says so", async () => {
    const { run, session } = make();
    await run("set_settings", { preset: "medium" });
    expect(await run("set_settings", { weaponProficiencies: "off" })).toMatch(/weapon specialization was turned off too/i);
    expect(session.settings?.rules).toMatchObject({ weaponProficiencies: false, weaponSpecialization: false });
    expect(await run("set_settings", { weaponSpecialization: "on" })).toMatch(/weapon proficiencies were turned on too/i);
    expect(session.settings?.rules).toMatchObject({ weaponProficiencies: true, weaponSpecialization: true });
  });

  it("refuses an explicit contradiction as a failure, leaving the settings unchanged", async () => {
    const { run, session } = make();
    await run("set_settings", { preset: "easy" });
    await expect(run("set_settings", { weaponProficiencies: "off", weaponSpecialization: "on" })).rejects.toThrow(/specialization/i);
    expect(session.settings).toEqual(presetSettings("easy"));
  });

  it("accepts only the values it shows, in any letter case", () => {
    const schema = make().tool("set_settings").schema;
    expect(schema.safeParse({ weaponProficiencies: "On" }).success).toBe(true);
    for (const wrong of [{ weaponProficiencies: "true" }, { weaponProficiencies: true }, { abilityScoreMethod: "VII" }, { encounterDifficulty: "hard" }]) {
      expect(schema.safeParse(wrong).success, JSON.stringify(wrong)).toBe(false);
    }
  });
});

describe("create_game", () => {
  it("records the request with the name, saving nothing, and needs settings first", async () => {
    const { run, session } = make();
    await expect(run("create_game", { name: "Friday group" })).rejects.toThrow(/no settings yet/i);
    await run("set_settings", { preset: "medium" });
    const text = await run("create_game", { name: "  Friday group " });
    expect(session.requestedName).toBe("Friday group");
    expect(text).toMatch(/requested/i);
    expect(text).toMatch(/is not created yet/i);
  });
});

describe("what the model is shown", () => {
  it("describes every field completely, with a type and no $ref", () => {
    for (const t of make().tools) {
      const shown = toJsonSchema(t.schema) as { properties?: Record<string, { type?: string }> };
      expect(JSON.stringify(shown), t.name).not.toContain("$ref");
      for (const [field, schema] of Object.entries(shown.properties ?? {})) expect(schema.type, `${t.name}.${field}`).toBeDefined();
    }
  });

  it("uses one vocabulary: every value show_presets shows is a value set_settings offers", async () => {
    const { run, tool } = make();
    const offered = (toJsonSchema(tool("set_settings").schema) as { properties: Record<string, { enum?: string[] }> }).properties;
    const text = await run("show_presets", {});
    const presetLines = text.split("\n").filter((l) => /^(easy|medium|difficult): /.test(l));
    expect(presetLines).toHaveLength(3);
    for (const line of presetLines) {
      for (const pair of line.replace(/^\w+: /, "").split(", ")) {
        const [field, value] = pair.split(" ");
        expect(offered[field]?.enum, `${field} ${value}`).toContain(value);
      }
    }
  });
});

describe("presetsTable", () => {
  const rows = presetsTable().split("\n");
  const cells = (row: string) => row.trim().split(/\s{2,}/);

  it("has a column per preset and a row per setting, labelled in plain words", () => {
    expect(cells(rows[0])).toEqual(["Setting", "easy", "medium", "difficult"]);
    expect(rows).toHaveLength(1 + 8);
    expect(cells(rows.find((r) => r.startsWith("Ability score method"))!)).toEqual(["Ability score method", "V", "V", "I"]);
    expect(cells(rows.find((r) => r.startsWith("Hovering on Death's Door"))!)).toEqual(["Hovering on Death's Door", "on", "on", "off"]);
  });

  it("aligns its columns, so it reads as a table in a terminal", () => {
    const starts = (column: number) => new Set(rows.map((r) => [...r.matchAll(/\S+(?: \S+)*/g)][column].index));
    for (const column of [1, 2, 3]) expect(starts(column).size, `column ${column}`).toBe(1);
  });

  it("writes every value as set_settings accepts it", () => {
    const tool = make().tool("set_settings");
    const offered = (toJsonSchema(tool.schema) as { properties: Record<string, { enum?: string[] }> }).properties;
    const allowed = new Set(Object.values(offered).flatMap((p) => p.enum ?? []));
    for (const row of rows.slice(1)) for (const value of cells(row).slice(1)) expect(allowed, `${row.slice(0, 30)} ${value}`).toContain(value);
  });
});