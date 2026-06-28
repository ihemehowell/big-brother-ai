Continue UI Build — Big Brother AI

Context

This is a pnpm monorepo (apps/web) built with Next.js + React Three Fiber, simulating an AI-driven reality TV house. The 3D house scene (House.jsx) and several overlay panels (DiaryRoom, RelationshipGraph, VotingPanel, EpisodeGuide, HouseMap) were just repaired from a broken/non-compiling state — invalid JSX elements, typos, missing braces, dead code paths, and logic bugs were fixed. The app now builds and renders, but the UI is unfinished and unpolished.

Before changing anything, read every file under apps/web/app/ and apps/web/components/ to understand current structure. Do not assume file contents — verify them by reading first.

Known-fixed (don't re-break these)


RelationshipGraph.jsx: width/height must come from the SVG viewBox numbers (200×180), not +svg.attr('width') (which is the string '100%' → NaN). forceLink must be passed uniqueLinks, built before the simulation is created.
House.jsx: uses real R3F/drei elements only (meshStandardMaterial, cylinderGeometry, drei's <Text>, <color attach="background">, etc.) — no invented tags like <distanceArgs>, <meshBasicColor>, lowercase custom <text>.
page.tsx: overlay wrapper uses pointer-events-none with pointer-events-auto on each panel (not the invalid pointer-auto class) so the 3D scene stays orbit/zoom-able in empty space.


What needs work, roughly in priority order

1. Layout & responsiveness


Current overlay layout uses fixed pixel widths (w-[300px], w-[400px]) and viewport-relative max-heights. Test at common breakpoints (1280×800 laptop, 1920×1080 desktop, and a tablet width) and fix overlap/clipping.
Decide whether this is desktop-only or needs to work on mobile/tablet. If mobile matters, the current absolute-positioned 4-corner layout will not work below ~768px — needs a collapsed/drawer pattern instead.
The "Expand" button on the Relationship Graph panel currently does nothing — wire it up (modal, larger panel, or dedicated route).


2. Data flow — everything is hardcoded/mocked right now


House.jsx room assignments, avatar colors, and the random shuffle logic are hardcoded sample data with setInterval-driven fake randomness.
RelationshipGraph.jsx has hardcoded sample nodes/relationships.
Identify (or design) a shared state source — likely a context provider or a fetch from the Express backend / PostgreSQL — that all panels (House, RelationshipGraph, DiaryRoom, VotingPanel, EpisodeGuide, HouseMap) read from, so the 3D house and the 2D panels stay in sync (e.g., who's in what room should match between House.jsx and HouseMap.jsx).
Figure out what's already wired to the backend (LangGraph/NVIDIA NIM simulation) vs. what's still placeholder, and report back before building new state plumbing — don't duplicate an existing data layer if one already exists.


3. Per-component checklist — audit each for the same class of bugs already found and fixed in House/RelationshipGraph (invalid props, dead/unreachable code, stale closures in intervals/effects, off-by-one or mismatched data shapes) before adding new features:


 DiaryRoom.jsx — confirm timestamp formatting is valid JS (a prior bug used Python-style :02d format specifiers inside a template literal)
 VotingPanel.jsx
 EpisodeGuide.jsx
 HouseMap.jsx — should visually agree with House.jsx's room state if both exist
 page.tsx — verify the House import path actually resolves (../components/House vs ./components/House) given the real folder structure


4. Visual polish (only after the above is structurally sound)


Establish one consistent design language across panels (currently bg-black/70 backdrop-blur-sm repeated manually — consider extracting a shared Panel component)
Loading and empty states for each panel (what shows before data arrives?)
Animate room-state and relationship-graph transitions instead of hard re-renders, so changes read as "live" rather than jumpy
Accessibility pass: contrast on white-text-over-video-background, focus states on buttons, alt text where relevant


Working style requested


Fix one bug class or one component at a time, explain what was wrong and why before patching (same style as the prior session), and confirm before large refactors (e.g., introducing global state).
Flag any place where you're inferring intent rather than reading it directly from existing code/comments.
If a fix requires choosing between multiple valid approaches (e.g., Context vs. Zustand vs. backend polling), ask rather than assuming.