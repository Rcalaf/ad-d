import {
  ABILITY_SCORE_METHODS,
  customizeSettings,
  describeSettings,
  DmStyleSchema,
  PRESET_NAMES,
  PRESETS,
  presetSettings,
  RulesSchema,
  type GameSettings,
  type SettingsChanges,
} from "@dnd/shared";
import { z } from "zod";
import type { AnswerResult } from "../../answering/answerQuestion";
import type { AgentTool } from "../agentLoop";
import { rulesTool } from "../rulesTool";

/**
 * What the setup conversation has decided so far, kept in code rather than in the model's memory.
 * The draft changes only through propose_settings, and is validated each time.
 */
export class SetupSession {
  draft?: GameSettings;
  /** Set when the agent asks to create the game; the command then asks the person to confirm. */
  creation?: { name: string };
}

const describe = (settings: GameSettings) =>
  [`Preset: ${settings.preset}`, ...describeSettings(settings).map((l) => `${l.setting}: ${l.value}${l.reference ? ` (${l.reference})` : ""}`)].join("\n");

const titleCase = (s: string) => s[0].toUpperCase() + s.slice(1);

/**
 * An on/off setting, taken as exactly "on" or "off": the words the agent reads in every description of the
 * settings, so it writes them back the same way. Letter case is ignored ("On" is "on"); anything else is refused
 * with a message naming the two values.
 * A function, not a shared constant: one schema reused in several fields is sent to the model as a reference
 * ("$ref") to the first field, which a small model can't follow. Each field gets its own complete definition.
 */
const onOffText = () => z.preprocess((v) => (typeof v === "string" ? v.trim().toLowerCase() : v), z.enum(["on", "off"]));
/** On/off as true/false, for the rules that are booleans. */
const onOff = () => onOffText().transform((v) => v === "on");

/** Flat arguments, one per setting: small models handle flat arguments more reliably than nested objects. */
const ProposeSchema = z.object({
  preset: z.enum(PRESET_NAMES).optional().describe("Start from this preset; omit to change the current draft"),
  abilityScoreMethod: RulesSchema.shape.abilityScoreMethod.optional().describe(
    `Method I to VI: ${Object.entries(ABILITY_SCORE_METHODS).map(([id, m]) => `${id}: ${m.description}`).join("; ")}`,
  ),
  weaponProficiencies: onOff().optional().describe('"on" or "off"'),
  // The settings schema keeps "allowed"/"off" (allowed means each player chooses); the model uses the same pair as everywhere else.
  nonweaponProficiencies: onOffText()
    .transform((v) => (v === "on" ? "allowed" : "off") as GameSettings["rules"]["nonweaponProficiencies"])
    .optional()
    .describe('"on" (allowed: each player chooses) or "off"'),
  weaponSpecialization: onOff().optional().describe('"on" or "off"'),
  hoveringOnDeathsDoor: onOff().optional().describe('"on" or "off"'),
  encounterDifficulty: DmStyleSchema.shape.encounterDifficulty.optional(),
  adjustsEncountersInPlay: DmStyleSchema.shape.adjustsEncountersInPlay.optional(),
  explainsRules: DmStyleSchema.shape.explainsRules.optional(),
});

export function setupTools(session: SetupSession, deps: { answer: (question: string) => Promise<AnswerResult> }): AgentTool[] {
  const describePresets: AgentTool = {
    name: "describe_presets",
    description: "Explain what each setting means (with its book reference, or marked as our design), and give the values of the three presets: easy, medium, difficult.",
    schema: z.object({}),
    run: () => {
      // Each explanation once, then each preset's values: complete, but short enough not to crowd the context window.
      const meanings = describeSettings(PRESETS.medium).map(
        (l) => `- ${l.setting}: ${l.explanation} ${l.reference ? `(${l.reference})` : "(Our design: no book reference.)"}`,
      );
      const presets = PRESET_NAMES.map((name) => `${titleCase(name)}: ${describeSettings(PRESETS[name]).map((l) => `${l.setting}: ${l.value}`).join("; ")}.`);
      return [
        "What each setting means:",
        ...meanings,
        "",
        "The presets:",
        ...presets,
        "",
        "Use these explanations and references; don't add references that aren't here. For deeper rules questions, use search_rules.",
      ].join("\n");
    },
  };

  const proposeSettings: AgentTool<typeof ProposeSchema> = {
    name: "propose_settings",
    description: "Set the draft settings: start from a preset, and/or change individual settings. Returns the resulting settings to show the players.",
    schema: ProposeSchema,
    run: ({ preset, ...fields }) => {
      // With nothing chosen yet, start from the medium preset, the middle one, rather than refusing:
      // a model may send every setting without naming a preset, and the result is then exactly what it asked for.
      const notes: string[] = [];
      let base = preset ? presetSettings(preset) : session.draft;
      if (!base) {
        base = presetSettings("medium");
        notes.push("No preset had been chosen yet: started from the medium preset.");
      }
      const { encounterDifficulty, adjustsEncountersInPlay, explainsRules, ...requested } = fields;
      const rules = { ...requested };
      // Specialization is part of the weapon proficiency rules: when only one of the two is mentioned,
      // change the other with it instead of refusing, and say so. A request naming both, contradicting each other, is refused.
      if (rules.weaponProficiencies === false && rules.weaponSpecialization === undefined && base.rules.weaponSpecialization) {
        rules.weaponSpecialization = false;
        notes.push("Weapon specialization was turned off too: it is part of the weapon proficiency rules.");
      }
      if (rules.weaponSpecialization === true && rules.weaponProficiencies === undefined && !base.rules.weaponProficiencies) {
        rules.weaponProficiencies = true;
        notes.push("Weapon proficiencies were turned on too: specialization is part of them.");
      }
      const changes: SettingsChanges = {
        rules: definedOnly(rules),
        dmStyle: definedOnly({ encounterDifficulty, adjustsEncountersInPlay, explainsRules }),
      };
      try {
        session.draft = customizeSettings(base, changes);
      } catch (error) {
        // A refusal is a failure: thrown, so the loop flags it as failed and the display always shows it.
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Not applied: ${reason} The draft is unchanged. Explain this to the players; don't try the same change again.`);
      }
      return [
        ...notes,
        `Draft settings:\n${describe(session.draft)}`,
        "Applied. Show these settings to the players now, and don't call propose_settings again before they answer.",
      ].join("\n");
    },
  };

  const requestCreation: AgentTool = {
    name: "request_game_creation",
    description: "Ask to create the game with the current draft settings and the name the players chose. The person at the keyboard must then confirm.",
    schema: z.object({ name: z.string().trim().min(1).max(80).describe("The game's name, as the players chose it") }),
    run: ({ name }) => {
      if (!session.draft) throw new Error("There are no settings yet: apply a preset with propose_settings first.");
      session.creation = { name };
      return "Creation requested: the program now asks the person at the keyboard to confirm.";
    },
  };

  return [rulesTool(deps.answer), describePresets, proposeSettings, requestCreation];
}

function definedOnly<T extends Record<string, unknown>>(values: T): Partial<T> {
  return Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined)) as Partial<T>;
}