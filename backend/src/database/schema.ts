import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

// ==========================================
// USERS & AUTHENTICATION
// ==========================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  avatar: text("avatar"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "seller"]).default("seller").notNull(),
  permissions: json("permissions").$type<string[]>(),
  salesGoal: decimal("salesGoal", { precision: 12, scale: 2 }),
  birthDate: timestamp("birthDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==========================================
// INVITES (Secure Token System)
// ==========================================

export const invites = mysqlTable("invites", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "seller"]).default("seller").notNull(),
  permissions: json("permissions").$type<string[]>(),
  status: mysqlEnum("status", ["pending", "used", "expired"]).default("pending").notNull(),
  invitedBy: int("invitedBy").notNull(),
  usedBy: int("usedBy"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"),
});

export type Invite = typeof invites.$inferSelect;
export type InsertInvite = typeof invites.$inferInsert;

// ==========================================
// CONTACTS (Customers/Leads)
// ==========================================

export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 100 }),
  ownerId: int("ownerId").notNull(),
  source: varchar("source", { length: 100 }),
  notes: text("notes"),
  // Customer Success Metrics
  ltv: decimal("ltv", { precision: 12, scale: 2 }),
  averageTicket: decimal("averageTicket", { precision: 12, scale: 2 }),
  totalPurchases: int("totalPurchases").default(0),
  lastPurchaseAt: timestamp("lastPurchaseAt"),
  bestContactTime: varchar("bestContactTime", { length: 50 }),
  churnRisk: mysqlEnum("churnRisk", ["low", "medium", "high"]).default("low"),
  npsScore: int("npsScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// ==========================================
// TAGS
// ==========================================

export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 50 }).notNull(),
  color: varchar("color", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

// ==========================================
// PRODUCTS
// ==========================================

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ==========================================
// DEALS (Pipeline)
// ==========================================

export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  stage: mysqlEnum("stage", ["prospecting", "qualification", "presentation", "negotiation", "won", "lost"]).default("prospecting").notNull(),
  probability: int("probability").default(10),
  contactId: int("contactId").notNull(),
  ownerId: int("ownerId").notNull(),
  productId: int("productId"),
  // BANT Fields
  budgetConfirmed: boolean("budgetConfirmed").default(false),
  decisionMakerIdentified: boolean("decisionMakerIdentified").default(false),
  painPoints: text("painPoints"),
  competitors: text("competitors"),
  timeline: varchar("timeline", { length: 100 }),
  // Follow-up
  nextFollowUpDate: timestamp("nextFollowUpDate"),
  notes: text("notes"),
  // Metadata
  closedAt: timestamp("closedAt"),
  lostReason: text("lostReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

// ==========================================
// DEAL TAGS (Many-to-Many)
// ==========================================

export const dealTags = mysqlTable("deal_tags", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  tagId: int("tagId").notNull(),
});

export type DealTag = typeof dealTags.$inferSelect;
export type InsertDealTag = typeof dealTags.$inferInsert;

// ==========================================
// AUDIT LOG (History)
// ==========================================

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["deal", "contact", "product", "user", "invite", "task", "landing_page"]).notNull(),
  entityId: int("entityId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  changes: json("changes").$type<Record<string, { old: unknown; new: unknown }>>(),
  reason: text("reason"),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ==========================================
// TASKS (Calendar/Agenda)
// ==========================================

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["call", "meeting", "email", "follow_up", "other"]).default("other").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  completedAt: timestamp("completedAt"),
  dealId: int("dealId"),
  contactId: int("contactId"),
  ownerId: int("ownerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ==========================================
// LANDING PAGES (Vext Pages)
// ==========================================

export const landingPages = mysqlTable("landing_pages", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  headline: varchar("headline", { length: 500 }).notNull(),
  subheadline: text("subheadline"),
  ctaText: varchar("ctaText", { length: 100 }),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  themeColor: mysqlEnum("themeColor", ["indigo", "emerald", "rose", "amber", "blue", "purple"]).default("indigo").notNull(),
  productId: int("productId"),
  views: int("views").default(0),
  conversions: int("conversions").default(0),
  isActive: boolean("isActive").default(true),
  ownerId: int("ownerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LandingPage = typeof landingPages.$inferSelect;
export type InsertLandingPage = typeof landingPages.$inferInsert;

// ==========================================
// NOTIFICATIONS
// ==========================================

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  type: mysqlEnum("type", ["info", "success", "warning", "error", "ai"]).default("info").notNull(),
  isRead: boolean("isRead").default(false),
  userId: int("userId").notNull(),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ==========================================
// AI PREDICTIONS
// ==========================================

export const aiPredictions = mysqlTable("ai_predictions", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["churn_risk", "repurchase", "deal_score", "best_contact_time"]).notNull(),
  entityType: mysqlEnum("entityType", ["contact", "deal"]).notNull(),
  entityId: int("entityId").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  factors: json("factors").$type<string[]>(),
  recommendation: text("recommendation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type AIPrediction = typeof aiPredictions.$inferSelect;
export type InsertAIPrediction = typeof aiPredictions.$inferInsert;

// ==========================================
// METRICS SNAPSHOT (For Dashboard)
// ==========================================

export const metricsSnapshots = mysqlTable("metrics_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull(),
  mrr: decimal("mrr", { precision: 12, scale: 2 }),
  churnRate: decimal("churnRate", { precision: 5, scale: 2 }),
  nps: int("nps").default(0),
  totalDeals: int("totalDeals").default(0),
  wonDeals: int("wonDeals").default(0),
  lostDeals: int("lostDeals").default(0),
  pipelineValue: decimal("pipelineValue", { precision: 12, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MetricsSnapshot = typeof metricsSnapshots.$inferSelect;
export type InsertMetricsSnapshot = typeof metricsSnapshots.$inferInsert;
