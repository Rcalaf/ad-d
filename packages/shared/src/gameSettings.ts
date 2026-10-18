import { z } from "zod";

/**
 * Game settings: chosen by each group at the start of a game ("session zero"), read by every agent.
 * Two groups: rules, the options the books offer; and DM style, our own design for how the
 * Dungeon Master behaves. A preset bundles both, so beginners can pick one without knowing the rules.
 */

/** Where an option comes from, so it can be cited and checked. */
const PHB_CH1 = "Player's Handbook, Chapter 1: Rolling Ability Scores, p. 18-19";
const PHB_CH5 = "Player's Handbook, Chapter 5: Proficiencies (Optional), p. 70";
const PHB_SPECIALIZATION = "Player's Handbook, Chapter 5: Weapon Specialization, p. 73";
const DMG_HOVERING = "Dungeon Master Guide, Chapter 9: Hovering on Death's Door (Optional Rule), p. 104";
const DMG_FIXING = "Dungeon Master Guide, Chapter 11: Fixing Things in Play, p. 141";

/**
 * The six ability score methods. I, II and V follow the wording of the Dungeon Master Guide's headings;
 * III, IV and VI follow the rules search's answer citing the Player's Handbook, p. 18-19 (to confirm).
 */
export const ABILITY_SCORE_METHODS = {
  I: { description: "3d6 for each ability, in order" },
  II: { description: "3d6 twice for each ability, keep the score you want, in order" },
  III: { description: "3d6 six times, assign the scores as desired" },
  IV: { description: "3d6 twelve times, keep the six best, assign as desired" },
  V: { description: "4d6, drop the lowest die, six times, arrange as desired" },
  VI: { description: "each ability starts at 8; roll seven dice and add each die's points to one ability; no ability above 18" },
} as const;

export type AbilityScoreMethod = keyof typeof ABILITY_SCORE_METHODS;
const METHOD_IDS = Object.keys(ABILITY_SCORE_METHODS) as [AbilityScoreMethod, ...AbilityScoreMethod[]];

export const RulesSchema = z.object({
  abilityScoreMethod: z.enum(METHOD_IDS),
  /** Tournament-level rules, optional in regular play; if used, they apply to every character, NPCs included. */
  weaponProficiencies: z.boolean(),
  /** Completely optional; when allowed, each player decides whether to use them, without unfair advantage. */
  nonweaponProficiencies: z.enum(["off", "allowed"]),
  /** Single-class fighters only; part of the weapon proficiency rules. */
  weaponSpecialization: z.boolean(),
  /** Optional rule: characters stay alive until -10 hit points instead of dying at 0. */
  hoveringOnDeathsDoor: z.boolean(),
});

export const DmStyleSchema = z.object({
  /** How strong encounters are compared with the party. */
  encounterDifficulty: z.enum(["below", "matched", "above"]),
  /** Whether the DM eases an encounter that turns out too hard, as the Guide's "Fixing Things in Play" describes. */
  adjustsEncountersInPlay: z.enum(["always", "avoid-total-wipe", "never"]),
  explainsRules: z.enum(["proactively", "when-asked", "rarely"]),
});

export const PRESET_NAMES = ["easy", "medium", "difficult"] as const;
export type PresetName = (typeof PRESET_NAMES)[number];

export const GameSettingsSchema = z
  .object({
    /** The preset the settings match, or "custom" once the group has changed them. */
    preset: z.enum([...PRESET_NAMES, "custom"]),
    rules: RulesSchema,
    dmStyle: DmStyleSchema,
  })
  .refine((s) => !s.rules.weaponSpecialization || s.rules.weaponProficiencies, {
    message: "Weapon specialization is part of the weapon proficiency rules: turn on weapon proficiencies to use it.",
  });

export type GameSettings = z.infer<typeof GameSettingsSchema>;

export const PRESETS: Readonly<Record<PresetName, GameSettings>> = {
  easy: {
    preset: "easy",
    rules: { abilityScoreMethod: "V", weaponProficiencies: false, nonweaponProficiencies: "allowed", weaponSpecialization: false, hoveringOnDeathsDoor: true },
    dmStyle: { encounterDifficulty: "below", adjustsEncountersInPlay: "always", explainsRules: "proactively" },
  },
  medium: {
    preset: "medium",
    rules: { abilityScoreMethod: "V", weaponProficiencies: true, nonweaponProficiencies: "allowed", weaponSpecialization: true, hoveringOnDeathsDoor: true },
    dmStyle: { encounterDifficulty: "matched", adjustsEncountersInPlay: "avoid-total-wipe", explainsRules: "when-asked" },
  },
  difficult: {
    preset: "difficult",
    rules: { abilityScoreMethod: "I", weaponProficiencies: true, nonweaponProficiencies: "allowed", weaponSpecialization: true, hoveringOnDeathsDoor: false },
    dmStyle: { encounterDifficulty: "above", adjustsEncountersInPlay: "never", explainsRules: "rarely" },
  },
};

/** A preset's settings, as a fresh copy: changing them never changes the preset. */
export function presetSettings(name: PresetName): GameSettings {
  return structuredClone(PRESETS[name]);
}

export interface SettingsChanges {
  rules?: Partial<GameSettings["rules"]>;
  dmStyle?: Partial<GameSettings["dmStyle"]>;
}

/**
 * Applies a group's changes to their settings and validates the result. The preset name follows the
 * values: it stays when nothing really changed, becomes another preset if the values now match it,
 * and otherwise becomes "custom".
 */
export function customizeSettings(settings: GameSettings, changes: SettingsChanges): GameSettings {
  const changed = {
    rules: { ...settings.rules, ...changes.rules },
    dmStyle: { ...settings.dmStyle, ...changes.dmStyle },
  };
  const same = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b);
  const match = PRESET_NAMES.find((name) => same(PRESETS[name].rules, changed.rules) && same(PRESETS[name].dmStyle, changed.dmStyle));
  const result = GameSettingsSchema.safeParse({ preset: match ?? "custom", ...changed });
  if (!result.success) throw new Error(result.error.issues.map((issue) => issue.message).join(" "));
  return result.data;
}

export interface SettingDescription {
  setting: string;
  value: string;
  /** What the setting means, in plain words. */
  explanation: string;
  /** "book": a rule or guidance from the books; "design": our own choice, with no book reference. */
  source: "book" | "design";
  /** The book and section the option comes from; absent for settings that are our own design. */
  reference?: string;
}

export type SettingName =
  | "Ability score method"
  | "Weapon proficiencies"
  | "Non-weapon proficiencies"
  | "Weapon specialization"
  | "Hovering on Death's Door"
  | "Encounter difficulty"
  | "DM adjusts encounters in play"
  | "DM explains rules";

/**
 * What each setting means. Book explanations use only what has been checked against the books: Roger's
 * reading of PHB p. 70, and rules search answers checked against their sources and the books' headings.
 * Details not yet checked (such as specialization's bonuses) are left out on purpose. Agents relay these
 * explanations instead of improvising; deeper questions go to the rules search.
 */
export const SETTING_EXPLANATIONS: Record<SettingName, { explanation: string; source: "book" | "design"; reference?: string }> = {
  "Ability score method": {
    explanation:
      "How the six ability scores are generated, from Method I (3d6 for each ability, in order) to Method VI. Classes have ability requirements: with methods that keep the order, the dice decide which classes a character qualifies for; with methods that let players arrange the scores, players choose a class first and place their scores to qualify.",
    source: "book",
    reference: PHB_CH1,
  },
  "Weapon proficiencies": {
    explanation:
      "Rules for which weapons each character is trained in. The Player's Handbook calls them tournament-level rules, optional in regular play; when on, they apply to every character, NPCs included.",
    source: "book",
    reference: PHB_CH5,
  },
  "Non-weapon proficiencies": {
    explanation:
      "Skills not related to weapons, such as building a fire or navigating. Completely optional: when allowed, each player decides whether to use them, without unfair advantage over those who don't.",
    source: "book",
    reference: PHB_CH5,
  },
  "Weapon specialization": {
    explanation: "Lets a single-class fighter specialize in a weapon. It is part of the weapon proficiency rules, so it needs weapon proficiencies on.",
    source: "book",
    reference: PHB_SPECIALIZATION,
  },
  "Hovering on Death's Door": {
    explanation: "An optional rule from the Dungeon Master Guide: when on, a character stays alive until −10 hit points; when off, a character dies at 0 hit points, the books' default.",
    source: "book",
    reference: DMG_HOVERING,
  },
  "Encounter difficulty": {
    explanation: "Our design, not a rule from the books: how strong the encounters prepared for the campaign are, compared with the party.",
    source: "design",
  },
  "DM adjusts encounters in play": {
    explanation:
      "The Dungeon Master Guide suggests ways to ease an encounter that turns out too hard during play, such as having monsters flee or make mistakes. This setting says when the DM does so; the setting itself is our design.",
    source: "book",
    reference: DMG_FIXING,
  },
  "DM explains rules": {
    explanation: "Our design, not a rule from the books: how much the DM explains rules during play without being asked.",
    source: "design",
  },
};

const STYLE_TEXT = {
  encounterDifficulty: { below: "Below the party's strength", matched: "Matched to the party", above: "Above the party's strength" },
  adjustsEncountersInPlay: { always: "Always, when the party is in trouble", "avoid-total-wipe": "Only to avoid a total party wipe", never: "Never" },
  explainsRules: { proactively: "Proactively, suggesting options", "when-asked": "When asked", rarely: "Rarely" },
} as const;

/** Every setting in plain words, with its explanation and, for book rules, its reference: for players and for agents to relay. */
export function describeSettings(settings: GameSettings): SettingDescription[] {
  const { rules, dmStyle } = settings;
  const onOff = (on: boolean) => (on ? "On" : "Off");
  const values: Record<SettingName, string> = {
    "Ability score method": `Method ${rules.abilityScoreMethod}: ${ABILITY_SCORE_METHODS[rules.abilityScoreMethod].description}`,
    "Weapon proficiencies": onOff(rules.weaponProficiencies),
    "Non-weapon proficiencies": rules.nonweaponProficiencies === "allowed" ? "Allowed: each player chooses" : "Off",
    "Weapon specialization": onOff(rules.weaponSpecialization),
    "Hovering on Death's Door": onOff(rules.hoveringOnDeathsDoor),
    "Encounter difficulty": STYLE_TEXT.encounterDifficulty[dmStyle.encounterDifficulty],
    "DM adjusts encounters in play": STYLE_TEXT.adjustsEncountersInPlay[dmStyle.adjustsEncountersInPlay],
    "DM explains rules": STYLE_TEXT.explainsRules[dmStyle.explainsRules],
  };
  return (Object.keys(values) as SettingName[]).map((setting) => ({ setting, value: values[setting], ...SETTING_EXPLANATIONS[setting] }));
}