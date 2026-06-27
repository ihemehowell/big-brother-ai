import "dotenv/config";
import { buildDirectorGraph } from "./graph.js";
import { createMockCast } from "./mockCast.js";

async function main() {
  const graph = buildDirectorGraph();
  const cast = createMockCast();
  const maxTicks = 8;

  console.log("Starting director loop stub...\n");

  const result = await graph.invoke(
    {
      cast,
      tick: 0,
      maxTicks,
      log: [],
    },
    {
      // Each outer tick walks ~4 graph nodes (decideScene -> branch -> twist -> advanceTick),
      // so give ourselves comfortable headroom above the default limit of 25.
      recursionLimit: maxTicks * 6 + 10,
    }
  );

 console.log("\n--- Final dialogue log ---");
for (const entry of result.dialogueLog) {
  console.log(`[${entry.sceneId}] ${entry.name}: "${entry.line}"`);
}
}

main().catch((err) => {
  console.error("Director loop failed:", err);
  process.exit(1);
});