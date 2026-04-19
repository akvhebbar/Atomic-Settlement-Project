// server/db.ts
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@shared/schema";
import path from "path";

// Will create a file local.db in the project root
const dbPath = path.resolve(process.cwd(), "local.db");
const client = createClient({ url: `file:${dbPath}` });

export const db = drizzle(client, { schema });
