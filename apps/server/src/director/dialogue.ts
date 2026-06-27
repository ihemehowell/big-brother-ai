import { dialogueModel } from "../lib/ai-config.js";
import type { MockContestant, CurrentScene } from "./types.js";

export async function generateLine(
  contestant: MockContestant,
  scene: CurrentScene,
  cast: MockContestant[]
): Promise<string> {
  if (scene.isDiaryRoom) {
    return generateDiaryRoomLine(contestant, scene);
  }

  const otherParticipants = scene.participantIds
    .filter((id) => id !== contestant.id)
    .map((id) => cast.find((c) => c.id === id)?.name ?? id);

  const historyText =
    scene.dialogueHistory.length > 0
      ? scene.dialogueHistory.map((h) => `${h.name}: ${h.line}`).join("\n")
      : "(no dialogue yet - you are speaking first)";

  const prompt = `You are ${contestant.name}, a contestant on a reality TV show. Your public persona: ${contestant.publicPersona}.

You are currently in the ${scene.location.replace("_", " ")} with: ${otherParticipants.join(", ") || "no one else"}.

Dialogue so far in this scene:
${historyText}

Respond with ONE short line of in-character dialogue (1 sentence, casual, like real reality TV speech). Do not include your name or any narration - just the spoken line itself, nothing else.`;

  const response = await dialogueModel.invoke(prompt);
  const line = typeof response.content === "string" ? response.content.trim() : String(response.content);

  return line.replace(/^["']|["']$/g, "");
}

async function generateDiaryRoomLine(contestant: MockContestant, scene: CurrentScene): Promise<string> {
  const priorReflection =
    scene.dialogueHistory.length > 0
      ? scene.dialogueHistory.map((h) => h.line).join(" ")
      : null;

  const prompt = `You are ${contestant.name}, a contestant on a reality TV show, currently alone in the diary room being interviewed by producers (not visible to other contestants).

Your public persona: ${contestant.publicPersona}.
Your PRIVATE agenda (other contestants don't know this): ${contestant.privateAgenda}.

You are reflecting on what just happened: ${scene.sourceSceneSummary ?? "recent events in the house"}.

${priorReflection ? `You already said this earlier in this diary session: "${priorReflection}"\nContinue your thought, don't repeat yourself.` : ""}

Respond with ONE short confessional line (1-2 sentences, reflective, a bit more honest than you'd be in front of the house - this is where your real feelings and private agenda can leak through). No narration, just the spoken line.`;

  const response = await dialogueModel.invoke(prompt);
  const line = typeof response.content === "string" ? response.content.trim() : String(response.content);

  return line.replace(/^["']|["']$/g, "");
}