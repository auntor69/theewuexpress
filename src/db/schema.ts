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
  // Nullable: posts can be created without a category and assigned later from the admin panel.
  category: text("category"),
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

export const subscribers = sqliteTable("subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  /**
   * Opaque random token used in the one-click unsubscribe link. Rotated when a
   * reader resubscribes, so an old link can never remove a fresh subscription.
   */
  unsubscribeToken: text("unsubscribe_token"),
  /**
   * Double opt-in: the token in the "confirm your subscription" email. Its
   * presence also marks a row as *never confirmed* — rows created before this
   * existed have no token and were backfilled as confirmed, because those
   * readers did type their address in and ask for the emails.
   */
  confirmToken: text("confirm_token"),
  /** Null until the reader clicks the confirmation link. Only confirmed rows are mailed. */
  confirmedAt: text("confirmed_at"),
  /** Null while the reader is subscribed; set to a UTC string when they opt out. */
  unsubscribedAt: text("unsubscribed_at"),
  // UTC timestamp string, same convention as posts.created_at.
  subscribedAt: text("subscribed_at")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

/**
 * Per-recipient delivery log for the newsletter.
 *
 * Every publish enqueues one row per active subscriber, then the dispatcher
 * sends them. The row is the source of truth for "who already got this story",
 * which is what makes retries and multi-request sending safe: a story can never
 * be emailed to the same address twice, and anything left over after a function
 * timeout is still visible (and resumable) instead of silently vanishing.
 */
export const newsletterDeliveries = sqliteTable("newsletter_deliveries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  email: text("email").notNull(),
  /** pending | sent | failed | skipped */
  status: text("status").notNull().default("pending"),
  error: text("error"),
  createdAt: text("created_at")
    .default(sql`(datetime('now'))`)
    .notNull(),
  /** When the most recent send attempt ran — success or failure. */
  attemptedAt: text("attempted_at"),
  /** Only set on a real success, so the two are never confused. */
  sentAt: text("sent_at"),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;
export type NewsletterDelivery = typeof newsletterDeliveries.$inferSelect;

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: text("updated_at")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export type AppSetting = typeof appSettings.$inferSelect;

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
