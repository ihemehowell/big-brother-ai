import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";

export type WorldStateMessage =
  | { type: "agent_move"; payload: { contestantId: string; room: string; x: number; y: number; z: number } }
  | { type: "agent_animation"; payload: { contestantId: string; animation: "idle" | "walking" | "talking" | "flirting" } }
  | { type: "dialogue"; payload: { contestantId: string; sceneId: string; content: string } }
  | { type: "scene_cut"; payload: { sceneId: string; location: string; participantIds: string[] } }
  | { type: "diary_room"; payload: { contestantId: string; sceneId: string; content: string; sourceSceneSummary?: string } }
  | { type: "relationship_update"; payload: { contestantId: string; towardContestantId: string; rivalryDelta: number; reasoning: string[] } };

let wss: WebSocketServer | null = null;

export function initWebSocketServer(httpServer: HttpServer) {
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (socket) => {
    console.log("Client connected to /ws");

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