import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const wishes = sqliteTable("wishes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  guestName: text("guest_name").notNull().default("ضيف محب"),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const publishedWishes = sqliteTable("published_wishes", {
  id: text("id").primaryKey(),
  guestName: text("guest_name").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull(),
  publishedAt: text("published_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
