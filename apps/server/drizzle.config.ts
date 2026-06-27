import { defineConfig } from "drizzle-kit";
import "dotenv/config";

declare const process: {
  env: {
    GOOGLE_API_KEY?: string;
    DATABASE_URL?: string;
  };
};


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to apps/server/.env");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});