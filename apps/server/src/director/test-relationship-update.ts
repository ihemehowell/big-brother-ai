import "dotenv/config";
import { analyzeSceneForRelationshipChanges } from "./relationshipUpdate.js";
import { createMockCast } from "./mockCast.js";
import type { CurrentScene } from "./types.js";

async function main() {
  const cast = createMockCast();

  const scene: CurrentScene = {
    id: "test-scene",
    location: "bedroom",
    participantIds: ["c2", "c3"],
    ticksElapsed: 2,
    maxTicks: 2,
    isDiaryRoom: false,
    dialogueHistory: [
      { contestantId: "c3", name: "Marcus", line: "I'm starting to think you're not as loyal as I thought, Asha." },
      { contestantId: "c2", name: "Asha", line: "I don't know what you're talking about, Marcus." },
      { contestantId: "c3", name: "Marcus", line: "Oh, come on, don't play dumb, I've seen the way you've been talking to Jake behind my back." },
      { contestantId: "c2", name: "Asha", line: "I don't think you're in a position to question anyone's loyalty right now." },
    ],
  };

  const deltas = await analyzeSceneForRelationshipChanges(scene, cast);
  console.log("Proposed deltas:");
  console.log(JSON.stringify(deltas, null, 2));
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});