export interface MockContestant {
  id: string;
  name: string;
  publicPersona: string;
  privateAgenda: string; // NEW - diary room is where this naturally surfaces
  lastSpokeAtTick: number;
  rivalryScores: Record<string, number>;
}

export interface SceneLogEntry {
  tick: number;
  sceneId: string;
  participantIds: string[];
  reason: string;
  twistInjected: boolean;
  sceneEvent: "continue" | "scene_start" | "scene_end" | "diary_room";
}

export interface CurrentScene {
  id: string;
  location: string;
  participantIds: string[];
  ticksElapsed: number;
  maxTicks: number;
  dialogueHistory: { contestantId: string; name: string; line: string }[];
  isDiaryRoom: boolean; // NEW
  sourceSceneSummary?: string; // NEW - what diary room is reflecting on, if applicable
}

export interface DialogueLogEntry {
  tick: number;
  sceneId: string;
  contestantId: string;
  name: string;
  line: string;
}