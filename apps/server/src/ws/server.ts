import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";

export type ContestantState = {
  id: string;
  name: string;
  room: string;
  animation: "idle" | "walking" | "talking" | "flirting";
  dialogue?: string;
};

export type WorldStateMessage =
  | { type: "contestants_update"; payload: ContestantState[] }
  | { type: "agent_move"; payload: { contestantId: string; room: string; x: number; y: number; z: number } }
  | { type: "agent_animation"; payload: { contestantId: string; animation: "idle" | "walking" | "talking" | "flirting" } }
  | { type: "dialogue"; payload: { contestantId: string; sceneId: string; content: string } }
  | { type: "scene_cut"; payload: { sceneId: string; location: string; participantIds: string[] } }
  | { type: "diary_room"; payload: { contestantId: string; sceneId: string; content: string; sourceSceneSummary?: string } }
  | { type: "relationship_update"; payload: { contestantId: string; towardContestantId: string; rivalryDelta: number; reasoning: string[] } };

let wss: WebSocketServer | null = null;

// Starting cast. `room` values must match the keys in the frontend's
// roomLayout.js ROOMS config (kitchen, living_room, bedroom, bathroom,
// diary_room, backyard) — a mismatch here silently strands avatars at
// the origin on the client side.
const INITIAL_CONTESTANTS: ContestantState[] = [
  { id: "alex", name: "Alex", room: "living_room", animation: "idle" },
  { id: "sam", name: "Sam", room: "kitchen", animation: "idle" },
  { id: "jamie", name: "Jamie", room: "kitchen", animation: "idle" },
  { id: "taylor", name: "Taylor", room: "bedroom", animation: "idle" },
  { id: "casey", name: "Casey", room: "backyard", animation: "idle" },
  { id: "morgan", name: "Morgan", room: "living_room", animation: "idle" },
];

export function initWebSocketServer(httpServer: HttpServer) {
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (socket) => {
    console.log("Client connected to /ws");

    // Send the current roster immediately so the client has a cast to
    // render before any simulation/game-loop logic produces real ticks.
    const initMessage: WorldStateMessage = {
      type: "contestants_update",
      payload: INITIAL_CONTESTANTS,
    };
    socket.send(JSON.stringify(initMessage));

    socket.on("close", () => {
      console.log("Client disconnected from /ws");
    });

    socket.on("error", (err) => {
      console.error("WebSocket client error:", err);
    });
  });

  

  console.log("WebSocket server mounted at /ws");
  return wss;
}

/** Broadcast a world-state message to all connected clients. */
export function broadcast(message: WorldStateMessage) {
  if (!wss) {
    console.warn("broadcast() called before WebSocket server was initialized");
    return;
  }

  const data = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

