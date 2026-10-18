import { toJsonSchema } from "@langchain/core/utils/json_schema";
import { describe, expect, it } from "vitest";
import { SetupSession, setupTools } from "../src/agents/setup/tools";

/**
 * What the model is shown: the tool definitions as sent to Ollama. Tests that a tool accepts the right values
 * aren't enough; the model must also be told them, completely, in every field.
 */
const tools = setupTools(new SetupSession(), { answer: async () => { throw new Error("unused"); } });
const definition = (name: string) => toJsonSchema(tools.find((t) => t.name === name)!.schema) as { properties: Record<string, Record<string, unknown>> };

describe("setup tool definitions, as the model sees them", () => {
  it("never use references ($ref) to other fields: each field is described completely", () => {
    for (const tool of tools) expect(JSON.stringify(toJsonSchema(tool.schema)), tool.name).not.toContain("$ref");
  });

  it("give every field of propose_settings a type", () => {
    for (const [field, schema] of Object.entries(definition("propose_settings").properties)) {
      expect(schema.type, field).toBeDefined();
    }
  });

  it("offer exactly \"on\" and \"off\" for every on/off setting, non-weapon proficiencies included", () => {
    const props = definition("propose_settings").properties;
    for (const field of ["weaponProficiencies", "nonweaponProficiencies", "weaponSpecialization", "hoveringOnDeathsDoor"]) {
      expect(props[field].enum, field).toEqual(["on", "off"]);
    }
  });
});