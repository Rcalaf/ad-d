import { describe, expect, it } from "vitest";
import {
  ABILITY_SCORE_METHODS,
  customizeSettings,
  describeSettings,
  GameSettingsSchema,
  PRESETS,
  presetSettings,
} from "../src/gameSettings";

describe("PRESETS", () => {
  it("are valid settings", () => {
    for (const preset of Object.values(PRESETS)) expect(GameSettingsSchema.safeParse(preset).success).toBe(true);
  });

  it("match the agreed table", () => {
    expect(PRESETS.easy.rules).toEqual({ abilityScoreMethod: "V", weaponProficiencies: false, nonweaponProficiencies: "allowed", weaponSpecialization: false, hoveringOnDeathsDoor: true });
    expect(PRESETS.medium.rules).toEqual({ abilityScoreMethod: "V", weaponProficiencies: true, nonweaponProficiencies: "allowed", weaponSpecialization: true, hoveringOnDeathsDoor: true });
    expect(PRESETS.difficult.rules).toEqual({ abilityScoreMethod: "I", weaponProficiencies: true, nonweaponProficiencies: "allowed", weaponSpecialization: true, hoveringOnDeathsDoor: false });
    expect(PRESETS.easy.dmStyle).toEqual({ encounterDifficulty: "below", adjustsEncountersInPlay: "always", explainsRules: "proactively" });
    expect(PRESETS.medium.dmStyle).toEqual({ encounterDifficulty: "matched", adjustsEncountersInPlay: "avoid-total-wipe", explainsRules: "when-asked" });
    expect(PRESETS.difficult.dmStyle).toEqual({ encounterDifficulty: "above", adjustsEncountersInPlay: "never", explainsRules: "rarely" });
  });
});

describe("presetSettings", () => {
  it("returns a copy, so changing it never changes the preset", () => {
    const settings = presetSettings("easy");
    settings.rules.abilityScoreMethod = "I";
    expect(PRESETS.easy.rules.abilityScoreMethod).toBe("V");
  });
});

describe("GameSettingsSchema", () => {
  it("refuses weapon specialization without weapon proficiencies, explaining why", () => {
    const settings = presetSettings("easy");
    settings.rules.weaponSpecialization = true;
    const result = GameSettingsSchema.safeParse(settings);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/specialization is part of the weapon proficiency rules/i);
  });
});

describe("customizeSettings", () => {
  it("applies changes to a preset and marks the result as custom", () => {
    const settings = customizeSettings(presetSettings("easy"), { rules: { abilityScoreMethod: "III" } });
    expect(settings.preset).toBe("custom");
    expect(settings.rules.abilityScoreMethod).toBe("III");
    expect(settings.rules.hoveringOnDeathsDoor).toBe(true);
    expect(settings.dmStyle).toEqual(PRESETS.easy.dmStyle);
  });

  it("keeps the preset's name when the changes don't actually change anything", () => {
    expect(customizeSettings(presetSettings("medium"), { rules: { abilityScoreMethod: "V" } }).preset).toBe("medium");
  });

  it("recognizes when changes turn the settings into another preset", () => {
    const settings = customizeSettings(presetSettings("medium"), {
      rules: { abilityScoreMethod: "I", hoveringOnDeathsDoor: false },
      dmStyle: { encounterDifficulty: "above", adjustsEncountersInPlay: "never", explainsRules: "rarely" },
    });
    expect(settings.preset).toBe("difficult");
  });

  it("refuses changes that make the settings invalid", () => {
    expect(() => customizeSettings(presetSettings("easy"), { rules: { weaponSpecialization: true } })).toThrow(/specialization/i);
  });
});

describe("describeSettings", () => {
  it("describes every setting in plain words, with the book reference where the option comes from the books", () => {
    const lines = describeSettings(presetSettings("easy"));
    expect(lines).toHaveLength(8);
    const method = lines.find((l) => l.setting === "Ability score method")!;
    expect(method.value).toBe("Method V: 4d6, drop the lowest die, six times, arrange as desired");
    expect(method.reference).toMatch(/Player's Handbook, Chapter 1/);
    const hovering = lines.find((l) => l.setting === "Hovering on Death's Door")!;
    expect(hovering.reference).toMatch(/Dungeon Master Guide, Chapter 9/);
    const style = lines.find((l) => l.setting === "DM explains rules")!;
    expect(style.reference).toBeUndefined();
  });
});

describe("ABILITY_SCORE_METHODS", () => {
  it("describes the six methods of the Player's Handbook", () => {
    expect(Object.keys(ABILITY_SCORE_METHODS)).toEqual(["I", "II", "III", "IV", "V", "VI"]);
    for (const method of Object.values(ABILITY_SCORE_METHODS)) expect(method.description.length).toBeGreaterThan(10);
  });
});