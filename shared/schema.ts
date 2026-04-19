import { z } from "zod";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const simulationStatusSchema = z.enum(["success", "error", "timeout", "pending"]);
export type SimulationStatus = z.infer<typeof simulationStatusSchema>;

export const verifyRequestSchema = z.object({
  transactionId: z.string().optional(),
});
export type VerifyRequest = z.infer<typeof verifyRequestSchema>;

// The local SQLite transactions table
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: text("transactionId").notNull().unique(),
  walletAddress: text("walletAddress").notNull(),
  amount: text("amount").notNull(),
  gasFee: text("gasFee").notNull(),
  status: text("status", { enum: ["pending", "success", "error"] }).notNull().default("pending"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

// Zod schemas for easy insertion validation
export const insertTransactionSchema = z.object({
  transactionId: z.string(),
  walletAddress: z.string(),
  amount: z.string(),
  gasFee: z.string(),
  status: z.enum(["pending", "success", "error"]).optional().default("pending"),
  createdAt: z.date(),
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
