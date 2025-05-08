import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User profiles
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").notNull().unique(),
  displayName: text("display_name"),
  avatarInitials: text("avatar_initials"),
  reputation: integer("reputation").default(0),
  activeStatus: text("active_status").default("offline"),
  lastActive: integer("last_active"),
  createdAt: integer("created_at"),
});

// User's crypto assets
export const assets = sqliteTable("assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  chain: text("chain").notNull(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  balance: text("balance").notNull(),
  value: text("value").notNull(),
  logoUrl: text("logo_url"),
});

// User's trading preferences
export const tradingPreferences = sqliteTable("trading_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  wantedTokens: blob("wanted_tokens", { mode: "json" }).notNull(),
  offeredTokens: blob("offered_tokens", { mode: "json" }).notNull(),
});

// Match records between users
export const matches = sqliteTable("matches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user1Id: integer("user1_id").notNull().references(() => users.id),
  user2Id: integer("user2_id").notNull().references(() => users.id),
  user1Liked: integer("user1_liked", { mode: "boolean" }).default(false),
  user2Liked: integer("user2_liked", { mode: "boolean" }).default(false),
  matchedAt: integer("matched_at"),
  matchPercentage: integer("match_percentage"),
  status: text("status").default("pending"),
});

// Messages between matched users
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matchId: integer("match_id").notNull().references(() => matches.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  sentAt: integer("sent_at"),
  read: integer("read", { mode: "boolean" }).default(false),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
});

export const insertTradingPreferenceSchema = createInsertSchema(tradingPreferences).omit({
  id: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  matchedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
});

// Token schema for API responses
export const tokenSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  balance: z.string(),
  value: z.string(),
  chain: z.string(),
  logoUrl: z.string().optional(),
});

export const chainSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type TradingPreference = typeof tradingPreferences.$inferSelect;
export type InsertTradingPreference = z.infer<typeof insertTradingPreferenceSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Token = z.infer<typeof tokenSchema>;
export type Chain = z.infer<typeof chainSchema>;
