import { z } from "zod";
// import { dialogueModel } from "../lib/ai-config.js";
import type { MockContestant, CurrentScene } from "./types.js";
import { analysisModel } from "../lib/ai-config.js";


const RelationshipDelta = z.object({
  contestantId: z.string().describe("the ID of the contestant whose feelings are changing"),
  towardContestantId: z.string().describe("the ID of the contestant this feeling is directed at"),
  trustDelta: z.number().describe("change in trust, -20 to +20. 0 if unchanged."),
  attractionDelta: z.number().describe("change in attraction, -20 to +20. 0 if unchanged."),
  rivalryDelta: z.number().describe("change in rivalry, -20 to +20. 0 if unchanged."),
  reasoning: z.string().describe("one short phrase explaining why, for logging purposes"),
});



const SceneRelationshipUpdate = z.object({
  deltas: z.array(RelationshipDelta).describe("one entry per contestant pair whose relationship shifted as a result of this scene"),
});

export type RelationshipDeltaType = z.infer<typeof RelationshipDelta>;

/**
 * Reads a completed scene's dialogue and proposes relationship score deltas.
 * Uses structured output (Zod schema) rather than free text, so we get
 * directly usable numbers instead of having to parse prose.
 */
export async function analyzeSceneForRelationshipChanges(
  scene: CurrentScene,
  cast: MockContestant[]
): Promise<RelationshipDeltaType[]> {
  if (scene.dialogueHistory.length === 0) return [];

  const participants = scene.participantIds
    .map((id) => cast.find((c) => c.id === id))
    .filter((c): c is MockContestant => c !== undefined);

  const participantList = participants.map((p) => `${p.id} (${p.name})`).join(", ");
  const dialogueText = scene.dialogueHistory.map((h) => `${h.name}: ${h.line}`).join("\n");

const prompt = `Analyze this reality TV scene's dialogue and determine how it changed the relationships between participants.

Participants (id and name): ${participantList}

Dialogue:
${dialogueText}

For each pair of contestants whose relationship shifted, propose a delta using contestant IDs exactly as given above (not names).

Guidance on magnitude - be decisive, not timid:
- A passing comment or minor disagreement: 1-3 points
- A clear accusation, callout, or visible tension: 5-10 points
- A serious betrayal, confrontation, or revealed secret: 10-20 points

Remember relationships are NOT symmetric - if Marcus accuses Asha, consider BOTH how Asha now feels about Marcus AND how Marcus now feels about Asha (his own rivalry/suspicion may also have grown from voicing the accusation). Include both directions when the scene affected both people, which is common in confrontations.

Only include pairs where something actually changed - if nothing notable happened between a pair, leave them out entirely. An empty list is valid when a scene was low-key.`;

  // const structuredModel = dialogueModel.withStructuredOutput(SceneRelationshipUpdate);
  const structuredModel = analysisModel.withStructuredOutput(SceneRelationshipUpdate);

  try {
    const result = await structuredModel.invoke(prompt);
    return result.deltas;
  } catch (err) {
    console.error("Relationship analysis failed, skipping update for this scene:", err);
    return [];
  }
}