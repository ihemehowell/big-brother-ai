import "dotenv/config";
import { dialogueModel } from "./ai-config.js";

async function main() {
  const start = Date.now();
  const response = await dialogueModel.invoke("Say hello in exactly 5 words.");
  console.log("Response:", response.content);
  console.log("Took:", Date.now() - start, "ms");
}

main().catch((err) => {
  console.error("NVIDIA test failed:", err);
  process.exit(1);
});