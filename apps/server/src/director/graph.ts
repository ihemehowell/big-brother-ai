import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { generateLine } from "./dialogue.js";
import type { MockContestant, SceneLogEntry, CurrentScene, DialogueLogEntry } from "./types.js";
import { analyzeSceneForRelationshipChanges } from "./relationshipUpdate.js";
import { db } from "../db/index.js";
import { episodes, scenes, dialogueLines, diaryEntries, episodeMemories, seasonMemories, relationships, contestants as contestantsTable } from "../db/schema.js";
import { and, eq, sql } from "drizzle-orm";
import { broadcast } from "../ws/server.js";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

async function saveAndBroadcastScene(sceneData: {
  id: string;
  episodeId: string;
  location: string;
  participantIds: string[];
  ticksElapsed: number;
  maxTicks: number;
  isDiaryRoom: boolean;
  startedAt: Date;
}): Promise<any> {
  try {
    const [result] = await db.insert(scenes).values(sceneData).returning();
    await broadcast({
      type: "scene_cut",
      payload: {
        sceneId: result.id,
        location: result.location,
        participantIds: result.participantIds,
      }
    });
    return result;
  } catch (error) {
    console.error("Error saving/broadcasting scene:", error);
    throw error;
  }
}

async function saveAndBroadcastDialogue(dialogueData: {
  sceneId: string;
  contestantId: string;
  content: string;
  createdAt: Date;
}): Promise<any> {
  try {
    const [result] = await db.insert(dialogueLines).values(dialogueData).returning();
    await broadcast({
      type: "dialogue",
      payload: {
        contestantId: dialogueData.contestantId,
        sceneId: dialogueData.sceneId,
        content: dialogueData.content,
      }
    });
    return result;
  } catch (error) {
    console.error("Error saving/broadcasting dialogue:", error);
    throw error;
  }
}

async function saveAndBroadcastDiaryEntry(diaryData: {
  sceneId: string;
  episodeId: string;
  contestantId: string;
  content: string;
  createdAt: Date;
  sourceSceneSummary?: string;
}): Promise<any> {
  try {
    const [result] = await db.insert(diaryEntries).values(diaryData).returning();
    await broadcast({
      type: "diary_room",
      payload: {
        contestantId: diaryData.contestantId,
        sceneId: diaryData.sceneId,
        content: diaryData.content,
        sourceSceneSummary: diaryData.sourceSceneSummary,
      }
    });
    return result;
  } catch (error) {
    console.error("Error saving/broadcasting diary entry:", error);
    throw error;
  }
}

async function updateRelationship(relationshipData: {
  contestantId: string;
  towardContestantId: string;
  rivalryDelta: number;
  reasoning: string[];
  updatedAt: Date;
}): Promise<any> {
  try {
    // Check if relationship already exists
    const existing = await db.select().from(relationships)
      .where(and(
        eq(relationships.contestantId, relationshipData.contestantId),
        eq(relationships.towardContestantId, relationshipData.towardContestantId)
      ));

    let result;
    if (existing.length > 0) {
      // Update existing relationship
      const [updated] = await db.update(relationships)
        .set({
          rivalry: sql`${relationships.rivalry} + ${relationshipData.rivalryDelta}`,
          updatedAt: relationshipData.updatedAt
        })
        .where(and(
          eq(relationships.contestantId, relationshipData.contestantId),
          eq(relationships.towardContestantId, relationshipData.towardContestantId)
        ))
        .returning();
      result = updated;
    } else {
      // Create new relationship
      const [created] = await db.insert(relationships).values({
        id: crypto.randomUUID(),
        contestantId: relationshipData.contestantId,
        towardContestantId: relationshipData.towardContestantId,
        rivalry: relationshipData.rivalryDelta,
        updatedAt: relationshipData.updatedAt
      }).returning();
      result = created;
    }

    // Broadcast relationship update
    await broadcast({
      type: "relationship_update",
      payload: {
        contestantId: relationshipData.contestantId,
        towardContestantId: relationshipData.towardContestantId,
        rivalryDelta: relationshipData.rivalryDelta,
        reasoning: relationshipData.reasoning
      }
    });

    return result;
  } catch (error) {
    console.error("Error updating/broadcasting relationship:", error);
    throw error;
  }
}

const LOCATIONS = ["kitchen", "living_room", "backyard", "bedroom"];

const DirectorState = Annotation.Root({
  cast: Annotation<MockContestant[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  tick: Annotation<number>({
    reducer: (_left, right) => right,
    default: () => 0,
  }),
  maxTicks: Annotation<number>({
    reducer: (_left, right) => right,
    default: () => 10,
  }),
  currentScene: Annotation<CurrentScene | null>({
    reducer: (_left, right) => right,
    default: () => null,
  }),
  currentEpisodeId: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => "default-episode",
  }),
  sceneCounter: Annotation<number>({
    reducer: (_left, right) => right,
    default: () => 0,
  }),
  log: Annotation<SceneLogEntry[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
 dialogueLog: Annotation<DialogueLogEntry[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
});

type State = typeof DirectorState.State;

function scoreTension(c: MockContestant, tick: number) {
  const silenceScore = (tick - c.lastSpokeAtTick) * 5;
  const maxRivalry = Math.max(0, ...Object.values(c.rivalryScores));
  const normalizedRivalry = Math.min(maxRivalry, 20);
  const jitter = Math.random() * 5;
  return silenceScore + normalizedRivalry + jitter;
}

async function startScene(state: State): Promise<Partial<State>> {
  const { cast, tick, sceneCounter } = state;

  const scored = cast.map((c) => ({ contestant: c, tension: scoreTension(c, tick) }));
  scored.sort((a, b) => b.tension - a.tension);

  const actorCount = Math.min(3, Math.max(1, Math.ceil(Math.random() * 3)));
  const picked = scored.slice(0, actorCount).map((s) => s.contestant);
  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const sceneId = `scene-${sceneCounter + 1}`;
  const sceneMaxTicks = Math.min(4, Math.max(2, Math.ceil(Math.random() * 4)));
  const now = new Date();

  console.log(
    `
[tick ${tick}] 🎬 SCENE START "${sceneId}" @ ${location}: ${picked.map((p) => p.name).join(", ")} (planned length: ${sceneMaxTicks} ticks)`
  );

  const updatedCast = cast.map((c) =>
    picked.some((p) => p.id === c.id) ? { ...c, lastSpokeAtTick: tick } : c
  );

  // Save scene to database and broadcast
  await saveAndBroadcastScene({
    id: sceneId,
    episodeId: state.currentEpisodeId || "default-episode",
    location,
    participantIds: picked.map((p) => p.id),
    ticksElapsed: 1,
    maxTicks: sceneMaxTicks,
    isDiaryRoom: false,
    startedAt: now,
  });

  return {
    cast: updatedCast,
    sceneCounter: sceneCounter + 1,
    currentScene: {
      id: sceneId,
      location,
      participantIds: picked.map((p) => p.id),
      ticksElapsed: 1,
      maxTicks: sceneMaxTicks,
      dialogueHistory: [],
      isDiaryRoom: false,
    },
    log: [
      {
        tick,
        sceneId,
        participantIds: picked.map((p) => p.id),
        reason: "scene start: highest combined silence + rivalry tension",
        twistInjected: false,
        sceneEvent: "scene_start",
      },
    ],
  };
}
function continueScene(state: State): Partial<State> {
  const { cast, tick, currentScene } = state;
  if (!currentScene) {
    throw new Error("continueScene called with no currentScene");
  }

  console.log(
    `[tick ${tick}] ↪ continuing "${currentScene.id}" @ ${currentScene.location} (${currentScene.ticksElapsed + 1}/${currentScene.maxTicks})`
  );

  const updatedCast = cast.map((c) =>
    currentScene.participantIds.includes(c.id) ? { ...c, lastSpokeAtTick: tick } : c
  );

  return {
    cast: updatedCast,
    currentScene: {
      ...currentScene,
      ticksElapsed: currentScene.ticksElapsed + 1,
    },
    log: [
      {
        tick,
        sceneId: currentScene.id,
        participantIds: currentScene.participantIds,
        reason: "scene continues",
        twistInjected: false,
        sceneEvent: "continue",
      },
    ],
  };
}

function endScene(state: State): Partial<State> {
  const { tick, currentScene } = state;
  if (!currentScene) {
    throw new Error("endScene called with no currentScene");
  }

  console.log(`[tick ${tick}] ✂ SCENE END "${currentScene.id}" @ ${currentScene.location}`);

  return {
    currentScene: null,
    log: [
      {
        tick,
        sceneId: currentScene.id,
        participantIds: currentScene.participantIds,
        reason: "scene end: max length reached or director cut early",
        twistInjected: false,
        sceneEvent: "scene_end",
      },
    ],
  };
}

function maybeInjectTwist(state: State): Partial<State> {
  if (Math.random() < 0.15) {
    console.log(`[tick ${state.tick}]   🎲 twist: a secret note appears in the house`);
  }
  return {};
}

function advanceTick(state: State): Partial<State> {
  return { tick: state.tick + 1 };
}

/**
 * Single decision point covering all three cases:
 * - no active scene -> start one
 * - active scene that should end (max length or early cut) -> end it
 * - active scene that continues -> continue it
 */
function noop(_state: State): Partial<State> {
  return {};
}

function routeSceneDecision(state: State): "startScene" | "continueScene" | "endScene" {
  const { currentScene } = state;
  if (!currentScene) return "startScene";

  const reachedMax = currentScene.ticksElapsed >= currentScene.maxTicks;
  const earlyCut = Math.random() < 0.15;

  if (reachedMax || earlyCut) return "endScene";
  return "continueScene";
}

function routeAfterTick(state: State): "loop" | typeof END {
  return state.tick < state.maxTicks ? "loop" : END;
}

async function generateDialogue(state: State): Promise<Partial<State>> {
  const { currentScene, cast, tick } = state;
  if (!currentScene) return {};

  const participants = currentScene.participantIds
    .map((id) => cast.find((c) => c.id === id))
    .filter((c): c is MockContestant => c !== undefined);

  const newLines: DialogueLogEntry[] = [];
  const updatedHistory = [...currentScene.dialogueHistory];

  for (const contestant of participants) {
    console.log(`[tick ${tick}]   ⏳ generating line for ${contestant.name}...`);
    const line = await generateLine(contestant, { ...currentScene, dialogueHistory: updatedHistory }, cast);
    console.log(`[tick ${tick}]   💬 ${contestant.name}: "${line}"`);

    updatedHistory.push({ contestantId: contestant.id, name: contestant.name, line });
    newLines.push({
      tick,
      sceneId: currentScene.id,
      contestantId: contestant.id,
      name: contestant.name,
      line,
    });
  }

  return {
    currentScene: { ...currentScene, dialogueHistory: updatedHistory },
    dialogueLog: newLines,
  };
}

const DIARY_ROOM_CHANCE = 0.4; // 40% chance after any scene ends

function triggerDiaryRoom(state: State): Partial<State> {
  // This node runs right after endScene. We look at the log entry endScene
  // just wrote to find out who was in the scene that ended.
  const lastEntry = state.log[state.log.length - 1];
  if (!lastEntry || lastEntry.sceneEvent !== "scene_end") return {};

  if (Math.random() >= DIARY_ROOM_CHANCE) return {};

  const candidateId = lastEntry.participantIds[Math.floor(Math.random() * lastEntry.participantIds.length)];
  const candidate = state.cast.find((c) => c.id === candidateId);
  if (!candidate) return {};

  // Build a quick summary of what happened in that scene from the dialogue log
  const sceneDialogue = state.dialogueLog.filter((d) => d.sceneId === lastEntry.sceneId);
  const summary =
    sceneDialogue.length > 0
      ? sceneDialogue.map((d) => `${d.name} said: "${d.line}"`).join(" ")
      : "a tense moment in the house";

  const diarySceneId = `diary-${state.sceneCounter + 1}`;
  console.log(`\n[tick ${state.tick}] 🗣 DIARY ROOM PULL: ${candidate.name} (reflecting on ${lastEntry.sceneId})`);

  return {
    sceneCounter: state.sceneCounter + 1,
    currentScene: {
      id: diarySceneId,
      location: "diary_room",
      participantIds: [candidate.id],
      ticksElapsed: 1,
      maxTicks: 2,
      dialogueHistory: [],
      isDiaryRoom: true,
      sourceSceneSummary: summary,
    },
  };
}

async function applyRelationshipUpdates(state: State): Promise<Partial<State>> {
  const lastEntry = state.log[state.log.length - 1];
  if (!lastEntry || lastEntry.sceneEvent !== "scene_end") return {};
  if (lastEntry.participantIds.length < 2) return {};

  const sceneDialogue = state.dialogueLog
    .filter((d) => d.sceneId === lastEntry.sceneId)
    .map((d) => ({ contestantId: d.contestantId, name: d.name, line: d.line }));

  if (sceneDialogue.length === 0) return {};

  const pseudoScene = {
    id: lastEntry.sceneId,
    location: "",
    participantIds: lastEntry.participantIds,
    ticksElapsed: 0,
    maxTicks: 0,
    isDiaryRoom: false,
    dialogueHistory: sceneDialogue,
  };

  const rawDeltas = await analyzeSceneForRelationshipChanges(pseudoScene, state.cast);
  if (rawDeltas.length === 0) return {};

  // Drop any self-targeting deltas defensively, even though the scene-size
  // guard above should prevent the model from ever needing to produce one.
  const validDeltas = rawDeltas.filter((d) => d.contestantId !== d.towardContestantId);

  // Consolidate multiple deltas for the same (from, to) pair into one net change,
  // since a single scene's overall impact on a relationship should be one
  // coherent shift, not several compounding increments.
  const consolidated = new Map<string, { contestantId: string; towardContestantId: string; rivalryDelta: number; reasons: string[] }>();

  for (const d of validDeltas) {
    const key = `${d.contestantId}->${d.towardContestantId}`;
    const existing = consolidated.get(key);
    if (existing) {
      existing.rivalryDelta += d.rivalryDelta;
      existing.reasons.push(d.reasoning);
    } else {
      consolidated.set(key, {
        contestantId: d.contestantId,
        towardContestantId: d.towardContestantId,
        rivalryDelta: d.rivalryDelta,
        reasons: [d.reasoning],
      });
    }
  }

  if (consolidated.size === 0) return {};

  console.log(`[tick ${state.tick}]   📊 relationship updates from "${lastEntry.sceneId}":`);

  const updatedCast = state.cast.map((c) => {
    const myDeltas = Array.from(consolidated.values()).filter((d) => d.contestantId === c.id);
    if (myDeltas.length === 0) return c;

    const newScores = { ...c.rivalryScores };
    for (const d of myDeltas) {
      const current = newScores[d.towardContestantId] ?? 0;
      newScores[d.towardContestantId] = clamp(current + d.rivalryDelta, -100, 100);
      console.log(
        `[tick ${state.tick}]     ${c.name} -> ${d.towardContestantId}: rivalry ${current} -> ${newScores[d.towardContestantId]} (${d.reasons.join("; ")})`
      );
    }

    return { ...c, rivalryScores: newScores };
  });

  return { cast: updatedCast };
}

export function buildDirectorGraph() {
  const graph = new StateGraph(DirectorState)
    .addNode("decideScene", noop)
    .addNode("startScene", startScene)
    .addNode("continueScene", continueScene)
    .addNode("endScene", endScene)
    .addNode("triggerDiaryRoom", triggerDiaryRoom)
    .addNode("applyRelationshipUpdates", applyRelationshipUpdates)
    .addNode("generateDialogue", generateDialogue)
    .addNode("maybeInjectTwist", maybeInjectTwist)
    .addNode("advanceTick", advanceTick)
    .addEdge(START, "decideScene")
    .addConditionalEdges("decideScene", routeSceneDecision, {
      startScene: "startScene",
      continueScene: "continueScene",
      endScene: "endScene",
    })
    .addEdge("startScene", "generateDialogue")
    .addEdge("continueScene", "generateDialogue")
    .addEdge("endScene", "applyRelationshipUpdates")
    .addEdge("applyRelationshipUpdates", "triggerDiaryRoom")
    .addConditionalEdges(
      "triggerDiaryRoom",
      (state: State) => (state.currentScene?.isDiaryRoom ? "generateDialogue" : "maybeInjectTwist"),
      { generateDialogue: "generateDialogue", maybeInjectTwist: "maybeInjectTwist" }
    )
    .addEdge("generateDialogue", "maybeInjectTwist")
    .addEdge("maybeInjectTwist", "advanceTick")
    .addConditionalEdges("advanceTick", routeAfterTick, {
      loop: "decideScene",
      [END]: END,
    });

  return graph.compile();
}