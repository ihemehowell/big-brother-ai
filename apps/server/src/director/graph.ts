import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { generateLine } from "./dialogue.js";
import type { MockContestant, SceneLogEntry, CurrentScene, DialogueLogEntry } from "./types.js";

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

function startScene(state: State): Partial<State> {
  const { cast, tick, sceneCounter } = state;

  const scored = cast.map((c) => ({ contestant: c, tension: scoreTension(c, tick) }));
  scored.sort((a, b) => b.tension - a.tension);

  const actorCount = Math.min(3, Math.max(1, Math.ceil(Math.random() * 3)));
  const picked = scored.slice(0, actorCount).map((s) => s.contestant);
  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const sceneId = `scene-${sceneCounter + 1}`;
  const sceneMaxTicks = Math.min(4, Math.max(2, Math.ceil(Math.random() * 4)));

  console.log(
    `\n[tick ${tick}] 🎬 SCENE START "${sceneId}" @ ${location}: ${picked.map((p) => p.name).join(", ")} (planned length: ${sceneMaxTicks} ticks)`
  );

  const updatedCast = cast.map((c) =>
    picked.some((p) => p.id === c.id) ? { ...c, lastSpokeAtTick: tick } : c
  );

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

export function buildDirectorGraph() {
  const graph = new StateGraph(DirectorState)
    .addNode("decideScene", noop)
    .addNode("startScene", startScene)
    .addNode("continueScene", continueScene)
    .addNode("endScene", endScene)
    .addNode("triggerDiaryRoom", triggerDiaryRoom)
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
    .addEdge("endScene", "triggerDiaryRoom")
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