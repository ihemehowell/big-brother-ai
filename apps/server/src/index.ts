import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { initWebSocketServer } from "./ws/server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const isProd = process.env.NODE_ENV === "production";

app.use(express.json());

if (!isProd) {
  // In dev, the Next.js dev server runs separately on its own port,
  // so we need CORS to allow it to call this API.
  app.use(
    cors({
      origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    })
  );
}

// --- API routes ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// TODO: mount real routes here as they're built
// app.use("/api/contestants", contestantsRouter);
// app.use("/api/episodes", episodesRouter);
// app.use("/api/votes", votesRouter);

if (isProd) {
  // Serve the Next.js static export
  const webOutDir = path.join(__dirname, "../../web/out");
  app.use(express.static(webOutDir));

  // Catch-all for client-side routing (Express 5 syntax)
  app.get("/*splat", (_req, res) => {
    res.sendFile(path.join(webOutDir, "index.html"));
  });
}

const httpServer = http.createServer(app);
initWebSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT} (${isProd ? "production" : "development"})`);
});