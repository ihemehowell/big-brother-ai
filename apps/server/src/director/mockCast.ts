// apps/server/src/director/mockCast.ts
import type { MockContestant } from "./types.js";

export function createMockCast(): MockContestant[] {
  return [
    {
      id: "c1",
      name: "Jordan",
      publicPersona: "confident flirt",
      privateAgenda: "wants to find a real partner, not just win the money",
      lastSpokeAtTick: 0,
      rivalryScores: { c2: 10, c3: 0, c4: 5 },
    },
    {
      id: "c2",
      name: "Asha",
      publicPersona: "quiet strategist",
      privateAgenda: "planning to blindside Marcus at the next vote",
      lastSpokeAtTick: 0,
      rivalryScores: { c1: 10, c3: 30, c4: 0 },
    },
    {
      id: "c3",
      name: "Marcus",
      publicPersona: "drama instigator",
      privateAgenda: "wants to expose Asha as fake to the rest of the house",
      lastSpokeAtTick: 0,
      rivalryScores: { c1: 0, c2: 30, c4: 15 },
    },
    {
      id: "c4",
      name: "Priya",
      publicPersona: "loyal underdog",
      privateAgenda: "just wants to get famous, doesn't care about winning",
      lastSpokeAtTick: 0,
      rivalryScores: { c1: 5, c2: 0, c3: 15 },
    },
  ];
}