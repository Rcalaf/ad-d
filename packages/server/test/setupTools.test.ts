import { toJsonSchema } from "@langchain/core/utils/json_schema";
import { presetSettings } from "@dnd/shared";
import { describe, expect, it } from "vitest";
import { SetupSession, setupTools } from "../src/agents/setup/tools";

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
});

describe("set_settings", () => {
  it("applies a preset, and returns the settings in the same words it accepts", async () => {
    const { run, session } = make();
    const text = await run("set_settings", { preset: "easy" });
    expect(session.settings).toEqual(presetSettings("easy"));
    expect(text).toMatch(/^Settings \(preset: easy\):/);
    expect(text).toContain("abilityScoreMethod: V");
    expect(text).toContain("weaponProficiencies: off");
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