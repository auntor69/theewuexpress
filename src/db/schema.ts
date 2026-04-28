import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  caption: text("caption").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image").notNull(),
  images: text("images").default("[]"),
  category: text("category").notNull(),
  tags: text("tags").default("[]"),
  views: integer("views").default(0).notNull(),
  featured: integer("featured", { mode: "boolean" }).default(false).notNull(),
  editorPick: integer("editor_pick", { mode: "boolean" }).default(false).notNull(),
  published: integer("published", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("created_at")
    .default(sql`(datetime('now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: text("created_at")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
