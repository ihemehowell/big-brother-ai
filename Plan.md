Big Brother AI
3D Multi-Agent Reality Show Simulation — Project Scope
Concept
A cast of AI-driven personas with distinct personalities, goals, and relationships, living in a shared 3D virtual
house. Each agent runs on an LLM with persistent memory; the show is the emergent drama from their
interactions — alliances, arguments, romances, and weekly evictions. Viewers watch a live feed and can vote.
Tech Stack
3D Frontend
• Three.js via React Three Fiber (R3F) — fits existing React/Next.js skillset directly
• @react-three/drei for helpers (cameras, controls, loaders)
• Characters: ready-made rigged humanoid avatars (Mixamo or Ready Player Me) rather than custom 3D
modeling
• Simple low-poly house environment (Sketchfab/Kenney assets, or a basic Blender blockout)
Backend / Agent Simulation
• Next.js API routes or a separate Node service for the tick-loop / director logic
• Supabase — contestants, relationships, scenes, memory, episodes
• Qwen Cloud (dashscope-intl) or Anthropic API for agent reasoning — centralized model config, same
pattern as lib/ai-config.ts
• A queue/cron (Supabase Edge Functions or a simple interval worker) driving ticks
Realtime Sync
• Supabase Realtime (or a WebSocket layer) to push agent state, position, and dialogue to the 3D client live
Architecture Layers
1. Simulation engine (headless, backend)
Agents, memory, relationships, director logic. Runs independently of any 3D rendering — pure data.
2. World state store
Position, animation state (idle / walking / talking / flirting), current room, current dialogue line per agent.
Written by the simulation engine, read by the 3D client.
3. 3D renderer (R3F)
Subscribes to world state, animates avatars accordingly, renders the house, and cuts between scenes like a
TV director would switch cameras.
4. UI overlay
Diary room subtitles/captions, relationship graph, voting panel, episode guide — all 2D HTML rendered over
the 3D canvas.
Keeping simulation and rendering decoupled is the most important design decision. The 3D layer is purely a
"skin" reading state — it should never contain game logic. This allows the agent simulation to be built and
validated in plain JSON/console output well before any Three.js work begins.
Cast Design
Each contestant needs more than a one-line personality to generate real storylines:
• Public persona — what they show the house (e.g. confident flirt, quiet strategist, drama instigator)
• Private agenda — a goal only they know (win the money, find a partner, get famous, expose another
contestant)
• Relationship matrix — a running score per other contestant (trust, attraction, rivalry) that shifts after every
interaction and influences future dialogue
• Backstory hooks — 2–3 facts they can reveal at dramatic moments
Director / Tick-Loop Logic
Rather than having every agent act every tick (chaotic and expensive), a lightweight director model:
• Picks 1–3 agents to act this tick based on story tension (unresolved beef, agents who haven't spoken in a
while)
• Occasionally injects a twist (task, temptation, secret note) to force interaction
• Decides when a scene is over and cuts to the next one, like an editor
This also keeps LLM API costs bounded since agents aren't all called every tick.
Diary Room
After key scenes, involved agents are pulled into a private diary room call where they reflect in character on
what just happened. This serves two purposes: it is the primary source material for highlight reels / recaps,
and it is a cheap way to surface internal agent state to viewers without exposing it in the live feed.
Eviction Mechanic
A weekly cycle: nominations (agents nominate each other based on relationship scores) → public vote or a
jury of eliminated agents → eviction with a final LLM-generated, in-character exit interview.
Memory Tiering
Without compression, context windows blow up quickly with 8+ agents over weeks of "show time." Three tiers
keep this manageable:
• Scene memory — last few exchanges, full detail
• Episode memory — compressed daily digest, LLM-generated, stored per agent
• Season memory — key facts that persist forever (who they trust, who betrayed them, who they're into)
Frontend Surfaces (Next.js)
• Live feed — the current 3D scene, chat-log or subtitle overlay
• House map — simple grid/overhead view showing who is where
• Diary room tab — confessionals
• Stats/relationships page — a D3 force-directed graph of alliances
• Vote/eviction UI
Build Phases
Phase Focus Key Deliverables
1. Headless
simulation
No 3D at all Supabase schema (contestants, relationships,
scenes, dialogue_lines, diary_entries, episodes);
director-loop; memory tiering; validate storylines
via console/log output
2. Minimal 3D
viewer
Basic rendering 3–4 room house in R3F; idle/walk avatar
animations; world-state subscription; speech
bubbles/captions instead of voice
3. Show polish Make it feel like
TV
Camera director (auto-cut between scenes); diary
room as a separate set/angle; LLM-generated
weekly highlight reel script
4. Viewer
interaction
Audience
participation
Eviction voting UI; live relationship graph; optional
viewer-submitted twists fed into the director loop
Scope Cuts (to survive as a solo dev)
• No voice synthesis/lip-sync — captions only; TTS + viseme sync is a major time sink for low payoff at
this stage
• No physics/collision — characters move along fixed paths between marked room positions
• No custom 3D modeling — reuse rigged avatar packs and free environment assets
• No live multiplayer viewers initially — a single shared world state is fine; everyone watching sees the
same simulation
Cost / Performance Watchpoints
• LLM calls are the main cost driver — the director picking 1–3 agents per tick (not all of them) keeps this
bounded
• Keep Three.js poly counts low, bake lighting where possible, avoid real-time shadows on everything
Guardrails (build in from day one)
• Keep romance/flirting suggestive, not explicit — both for app store/hosting policy and because explicit
content generation from LLMs is unreliable to ship
• Add a profanity/escalation filter on agent output before it is rendered
• Allow the showrunner to inject events, but don't let agents take irreversible actions without a check
Recommended next step: build the Phase 1 Supabase schema and director-loop logic, and validate emergent storylines
via console output before touching any 3D rendering


claude --resume 65eadd4d-599c-4238-8c52-b269785b8737