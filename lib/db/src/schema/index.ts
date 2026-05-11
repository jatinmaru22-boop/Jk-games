import { pgTable, text, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  balance: numeric("balance", { precision: 18, scale: 2 }).notNull().default("10000"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const transfersTable = pgTable("transfers", {
  id: text("id").primaryKey(),
  fromUserId: text("from_user_id").notNull().references(() => usersTable.id),
  toUserId: text("to_user_id").notNull().references(() => usersTable.id),
  fromUsername: text("from_username").notNull(),
  toUsername: text("to_username").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransferSchema = createInsertSchema(transfersTable).omit({ createdAt: true });
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transfersTable.$inferSelect;

export const gameRoundsTable = pgTable("game_rounds", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  betAmount: numeric("bet_amount", { precision: 18, scale: 2 }).notNull(),
  multiplier: numeric("multiplier", { precision: 10, scale: 2 }).notNull(),
  cashoutMultiplier: numeric("cashout_multiplier", { precision: 10, scale: 2 }),
  won: boolean("won").notNull().default(false),
  profit: numeric("profit", { precision: 18, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGameRoundSchema = createInsertSchema(gameRoundsTable).omit({ createdAt: true });
export type InsertGameRound = z.infer<typeof insertGameRoundSchema>;
export type GameRound = typeof gameRoundsTable.$inferSelect;
