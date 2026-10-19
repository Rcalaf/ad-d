import {
  ABILITY_SCORE_METHODS,
  customizeSettings,
  describeSettings,
  PRESET_NAMES,
  PRESETS,
  presetSettings,
  type GameSettings,
  type SettingsChanges,
} from "@dnd/shared";
import { z } from "zod";
import type { AgentTool } from "../agentLoop";

/**
 * The setup agent's own tools. Besides these, it uses search_books, shared by every agent, to explain settings.
 *
 * One vocabulary: every value the agent reads in a result is written exactly as set_settings accepts it
 * ("on"/"off", "V", "below"), so it never has to translate. Results state facts, never instructions.
 */

/** What the setup conversation has decided so far, kept in code rather than in the model's memory. */
export class SetupSession {
  settings?: GameSettings;
  /** Set by create_game; the command then asks the person at the keyboard to confirm before saving. */
  requestedName?: string;
}

const METHOD_IDS = Object.keys(ABILITY_SCORE_METHODS) as [keyof typeof ABILITY_SCORE_METHODS, ...(keyof typeof ABILITY_SCORE_METHODS)[]];

/** The settings in the agent's vocabulary, in the order describeSettings uses. */
const FIELDS = [
  ["abilityScoreMethod", "Ability score method"],
  ["weaponProficiencies", "Weapon proficiencies"],
  ["nonweaponProficiencies", "Non-weapon proficiencies"],
  ["weaponSpecialization", "Weapon specialization"],
  ["hoveringOnDeathsDoor", "Hovering on Death's Door"],
  ["encounterDifficulty", "Encounter difficulty"],
  ["adjustsEncountersInPlay", "DM adjusts encounters in play"],
  ["explainsRules", "DM explains rules"],
] as const;

type Field = (typeof FIELDS)[number][0];

const onOff = (on: boolean) => (on ? "on" : "off");

/** A game's settings as the agent reads them: one value per field, in the vocabulary set_settings accepts. */
function toVocabulary(s: GameSettings): Record<Field, string> {
  return {
    abilityScoreMethod: s.rules.abilityScoreMethod,
    weaponProficiencies: onOff(s.rules.weaponProficiencies),
    nonweaponProficiencies: onOff(s.rules.nonweaponProficiencies === "allowed"),
    weaponSpecialization: onOff(s.rules.weaponSpecialization),
    hoveringOnDeathsDoor: onOff(s.rules.hoveringOnDeathsDoor),
    encounterDifficulty: s.dmStyle.encounterDifficulty,
    adjustsEncountersInPlay: s.dmStyle.adjustsEncountersInPlay,
    explainsRules: s.dmStyle.explainsRules,
  };
}

const settingsText = (s: GameSettings) => {
  const values = toVocabulary(s);
  return [`Settings (preset: ${s.preset}):`, ...FIELDS.map(([field]) => `- ${field}: ${values[field]}`)].join("\n");
};

/**
 * One allowed value out of a fixed list, letter case ignored. Built by a function for each field: one schema
 * object shared by several fields would reach the model as a reference ($ref) to the first, which it can't follow.
 */
function choice<T extends string>(values: readonly [T, ...T[]], caseOf: "lower" | "upper" = "lower") {
  const normalize = (v: unknown) => (typeof v !== "string" ? v : caseOf === "upper" ? v.trim().toUpperCase() : v.trim().toLowerCase());
  return z.preprocess(normalize, z.enum(values));
}

const SetSettingsSchema = z.object({
  preset: choice(PRESET_NAMES).optional().describe("Start from this preset; leave out to change the current settings"),
  abilityScoreMethod: choice(METHOD_IDS, "upper").optional(),
  weaponProficiencies: choice(["on", "off"]).optional(),
  nonweaponProficiencies: choice(["on", "off"]).optional(),
  weaponSpecialization: choice(["on", "off"]).optional(),
  hoveringOnDeathsDoor: choice(["on", "off"]).optional(),
  encounterDifficulty: choice(["below", "matched", "above"]).optional(),
  adjustsEncountersInPlay: choice(["always", "avoid-total-wipe", "never"]).optional(),
  explainsRules: choice(["proactively", "when-asked", "rarely"]).optional(),
});

export function setupTools(session: SetupSession): AgentTool[] {
  const showPresets: AgentTool = {
    name: "show_presets",
    description: "Show the three presets (easy, medium, difficult) with the value of every setting, and what each setting is.",
    schema: z.object({}),
    run: () => {
      const references = new Map(describeSettings(PRESETS.medium).map((l) => [l.setting, l.reference]));
      const presets = PRESET_NAMES.map((name) => {
        const values = toVocabulary(PRESETS[name]);
        return `${name}: ${FIELDS.map(([field]) => `${field} ${values[field]}`).join(", ")}`;
      });
      const settings = FIELDS.map(([field, label]) => {
        const reference = references.get(label);
        return `- ${field}: ${label} (${reference ?? "our design, not from the books"})`;
      });
      const methods = Object.entries(ABILITY_SCORE_METHODS).map(([id, m]) => `${id}: ${m.description}`).join("; ");
      return ["The three presets:", ...presets, "", "The settings:", ...settings, `Ability score methods: ${methods}.`].join("\n");
    },
  };

  const setSettings: AgentTool<typeof SetSettingsSchema> = {
    name: "set_settings",
    description: "Set the game's settings: start from a preset, and/or change any settings. Returns the resulting settings.",
    schema: SetSettingsSchema,
    run: ({ preset, ...requested }) => {
      const notes: string[] = [];
      let base = preset ? presetSettings(preset) : session.settings;
      if (!base) {
        base = presetSettings("medium");
        notes.push("Nothing had been chosen yet: started from the medium preset.");
      }

      const rules: SettingsChanges["rules"] = {};
      if (requested.abilityScoreMethod) rules.abilityScoreMethod = requested.abilityScoreMethod;
      if (requested.weaponProficiencies) rules.weaponProficiencies = requested.weaponProficiencies === "on";
      if (requested.nonweaponProficiencies) rules.nonweaponProficiencies = requested.nonweaponProficiencies === "on" ? "allowed" : "off";
      if (requested.weaponSpecialization) rules.weaponSpecialization = requested.weaponSpecialization === "on";
      if (requested.hoveringOnDeathsDoor) rules.hoveringOnDeathsDoor = requested.hoveringOnDeathsDoor === "on";

      // Specialization is part of the weapon proficiency rules: when only one of the two is mentioned,
      // the other follows it, and the result says so. A request naming both, in contradiction, is refused.
      if (rules.weaponProficiencies === false && rules.weaponSpecialization === undefined && base.rules.weaponSpecialization) {
        rules.weaponSpecialization = false;
        notes.push("Weapon specialization was turned off too: it is part of the weapon proficiency rules.");
      }
      if (rules.weaponSpecialization === true && rules.weaponProficiencies === undefined && !base.rules.weaponProficiencies) {
        rules.weaponProficiencies = true;
        notes.push("Weapon proficiencies were turned on too: specialization is part of them.");
      }

      const dmStyle: SettingsChanges["dmStyle"] = {};
      if (requested.encounterDifficulty) dmStyle.encounterDifficulty = requested.encounterDifficulty;
      if (requested.adjustsEncountersInPlay) dmStyle.adjustsEncountersInPlay = requested.adjustsEncountersInPlay;
      if (requested.explainsRules) dmStyle.explainsRules = requested.explainsRules;

      try {
        session.settings = customizeSettings(base, { rules, dmStyle });
      } catch (error) {
        // A refusal is a failure: the loop marks it failed, and the command shows it.
        throw new Error(`Not applied: ${error instanceof Error ? error.message : String(error)} The settings are unchanged.`);
      }
      return [...notes, settingsText(session.settings)].join("\n");
    },
  };

  const createGame: AgentTool = {
    name: "create_game",
    description: "Request the creation of the game with the current settings and the name the players chose.",
    schema: z.object({ name: z.string().trim().min(1).max(80).describe("The game's name, as the players chose it") }),
    run: ({ name }) => {
      if (!session.settings) throw new Error("There are no settings yet: set them with set_settings first.");
      session.requestedName = name;
      return `Creation of "${name}" requested. The program now asks the person at the keyboard to confirm.`;
    },
  };

  return [showPresets, setSettings, createGame];
}