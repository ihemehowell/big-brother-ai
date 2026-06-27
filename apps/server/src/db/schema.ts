import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  jsonb,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

// --- Contestants ---
export const contestants = pgTable("contestants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  publicPersona: text("public_persona").notNull(),
  privateAgenda: text("private_agenda").notNull(),
  backstoryHooks: jsonb("backstory_hooks").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true), // false once evicted
  evictedAtEpisode: integer("evicted_at_episode"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Relationship matrix: one row per ordered pair (A's view of B) ---
export const relationships = pgTable("relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  contestantId: uuid("contestant_id")
    .notNull()
    .references(() => contestants.id, { onDelete: "cascade" }),
  towardContestantId: uuid("toward_contestant_id")
    .notNull()
    .references(() => contestants.id, { onDelete: "cascade" }),
  trust: real("trust").notNull().default(0), // -100..100
  attraction: real("attraction").notNull().default(0),
  rivalry: real("rivalry").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Episodes (the weekly cycle) ---
export const episodes = pgTable("episodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: integer("number").notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  summary: text("summary"), // LLM-generated digest, used for episode-tier memory
});

// --- Scenes: a tick-loop "unit" the director decides to open/close ---
export const scenes = pgTable("scenes", {
  id: uuid("id").primaryKey().defaultRandom(),
  episodeId: uuid("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  location: text("location").notNull(), // e.g. "kitchen", "diary_room"
  participantIds: jsonb("participant_ids").$type<string[]>().notNull().default([]),
  tensionScore: real("tension_score").notNull().default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
});

// --- Dialogue lines: scene-tier memory, full detail ---
export const dialogueLines = pgTable("dialogue_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  sceneId: uuid("scene_id")
    .notNull()
    .references(() => scenes.id, { onDelete: "cascade" }),
  contestantId: uuid("contestant_id")
    .notNull()
    .references(() => contestants.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Diary room entries: in-character reflection after key scenes ---
export const diaryEntries = pgTable("diary_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  contestantId: uuid("contestant_id")
    .notNull()
    .references(() => contestants.id, { onDelete: "cascade" }),
  sceneId: uuid("scene_id").references(() => scenes.id, { onDelete: "set null" }),
  episodeId: uuid("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Episode-tier memory: compressed daily digest per agent ---
export const episodeMemories = pgTable("episode_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  contestantId: uuid("contestant_id")
    .notNull()
    .references(() => contestants.id, { onDelete: "cascade" }),
  episodeId: uuid("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  digest: text("digest").notNull(), // LLM-generated summary of the agent's episode
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Season-tier memory: key facts that persist forever ---
export const seasonMemories = pgTable("season_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  contestantId: uuid("contestant_id")
    .notNull()
    .references(() => contestants.id, { onDelete: "cascade" }),
  fact: text("fact").notNull(), // e.g. "Betrayed by Jordan in week 2"
  aboutContestantId: uuid("about_contestant_id").references(() => contestants.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Votes (eviction mechanic) ---
export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  episodeId: uuid("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  nominatedContestantId: uuid("nominated_contestant_id")
    .notNull()
    .references(() => contestants.id, { onDelete: "cascade" }),
  voterContestantId: uuid("voter_contestant_id").references(() => contestants.id, {
    onDelete: "set null",
  }), // null if it's a public/viewer vote rather than a contestant nomination
  isPublicVote: boolean("is_public_vote").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});