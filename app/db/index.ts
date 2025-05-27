import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL environment variable is required");
}

// Initialize the database connection
export const db = drizzle(process.env.DATABASE_URL, { schema });

// Export schema for use in other files
export * from "./schema";
