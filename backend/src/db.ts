import { eq, and, desc, asc, gte, lte, sql, inArray, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  contacts, InsertContact, Contact,
  deals, InsertDeal, Deal,
  tags, InsertTag, Tag,
  dealTags, InsertDealTag,
  products, InsertProduct, Product,
  tasks, InsertTask, Task,
  invites, InsertInvite, Invite,
  auditLogs, InsertAuditLog, AuditLog,
  landingPages, InsertLandingPage, LandingPage,
  notifications, InsertNotification, Notification,
  aiPredictions, InsertAIPrediction, AIPrediction,
  metricsSnapshots, InsertMetricsSnapshot
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==========================================
// USER QUERIES
// ==========================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone", "avatar"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function getTeamMembers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(asc(users.name));
}

export async function getSellers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.role, "seller")).orderBy(asc(users.name));
}

// ==========================================
// CONTACT QUERIES
// ==========================================

export async function createContact(data: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contacts).values(data);
  return result[0].insertId;
}

export async function getContactById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getContacts(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (ownerId) {
    return db.select().from(contacts).where(eq(contacts.ownerId, ownerId)).orderBy(desc(contacts.createdAt));
  }
  return db.select().from(contacts).orderBy(desc(contacts.createdAt));
}

export async function updateContact(id: number, data: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) return;
  await db.update(contacts).set(data).where(eq(contacts.id, id));
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(contacts).where(eq(contacts.id, id));
}

export async function searchContacts(query: string, ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const searchPattern = `%${query}%`;
  const conditions = [
    or(
      like(contacts.name, searchPattern),
      like(contacts.email, searchPattern),
      like(contacts.company, searchPattern)
    )
  ];
  if (ownerId) {
    conditions.push(eq(contacts.ownerId, ownerId));
  }
  return db.select().from(contacts).where(and(...conditions)).orderBy(desc(contacts.createdAt));
}

export async function bulkCreateContacts(data: InsertContact[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return;
  await db.insert(contacts).values(data);
}

// ==========================================
// DEAL QUERIES
// ==========================================

export async function createDeal(data: InsertDeal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deals).values(data);
  return result[0].insertId;
}

export async function getDealById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDeals(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (ownerId) {
    return db.select().from(deals).where(eq(deals.ownerId, ownerId)).orderBy(desc(deals.createdAt));
  }
  return db.select().from(deals).orderBy(desc(deals.createdAt));
}

export async function getDealsByStage(stage: Deal["stage"], ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(deals.stage, stage)];
  if (ownerId) conditions.push(eq(deals.ownerId, ownerId));
  return db.select().from(deals).where(and(...conditions)).orderBy(desc(deals.createdAt));
}

export async function updateDeal(id: number, data: Partial<InsertDeal>) {
  const db = await getDb();
  if (!db) return;
  await db.update(deals).set(data).where(eq(deals.id, id));
}

export async function deleteDeal(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(dealTags).where(eq(dealTags.dealId, id));
  await db.delete(deals).where(eq(deals.id, id));
}

export async function getDealsWithFollowUp(date: Date, ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const conditions = [
    gte(deals.nextFollowUpDate, startOfDay),
    lte(deals.nextFollowUpDate, endOfDay)
  ];
  if (ownerId) conditions.push(eq(deals.ownerId, ownerId));
  
  return db.select().from(deals).where(and(...conditions)).orderBy(asc(deals.nextFollowUpDate));
}

export async function getPipelineStats(ownerId?: number) {
  const db = await getDb();
  if (!db) return { total: 0, won: 0, lost: 0, pipeline: 0 };
  
  const allDeals = ownerId 
    ? await db.select().from(deals).where(eq(deals.ownerId, ownerId))
    : await db.select().from(deals);
  
  const total = allDeals.reduce((acc, d) => acc + Number(d.value), 0);
  const won = allDeals.filter(d => d.stage === "won").reduce((acc, d) => acc + Number(d.value), 0);
  const lost = allDeals.filter(d => d.stage === "lost").reduce((acc, d) => acc + Number(d.value), 0);
  const pipeline = allDeals.filter(d => !["won", "lost"].includes(d.stage)).reduce((acc, d) => acc + Number(d.value), 0);
  
  return { total, won, lost, pipeline };
}

// ==========================================
// TAG QUERIES
// ==========================================

export async function createTag(data: InsertTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tags).values(data);
  return result[0].insertId;
}

export async function getTags() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tags).orderBy(asc(tags.label));
}

export async function updateTag(id: number, data: Partial<InsertTag>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tags).set(data).where(eq(tags.id, id));
}

export async function deleteTag(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(dealTags).where(eq(dealTags.tagId, id));
  await db.delete(tags).where(eq(tags.id, id));
}

export async function getDealTags(dealId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ tag: tags })
    .from(dealTags)
    .innerJoin(tags, eq(dealTags.tagId, tags.id))
    .where(eq(dealTags.dealId, dealId));
  return result.map(r => r.tag);
}

export async function setDealTags(dealId: number, tagIds: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(dealTags).where(eq(dealTags.dealId, dealId));
  if (tagIds.length > 0) {
    await db.insert(dealTags).values(tagIds.map(tagId => ({ dealId, tagId })));
  }
}

// ==========================================
// PRODUCT QUERIES
// ==========================================

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  return result[0].insertId;
}

export async function getProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.isActive, true)).orderBy(asc(products.name));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set({ isActive: false }).where(eq(products.id, id));
}

// ==========================================
// TASK QUERIES
// ==========================================

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(data);
  return result[0].insertId;
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTasks(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (ownerId) {
    return db.select().from(tasks).where(eq(tasks.ownerId, ownerId)).orderBy(asc(tasks.dueDate));
  }
  return db.select().from(tasks).orderBy(asc(tasks.dueDate));
}

export async function getTasksByDate(date: Date, ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const conditions = [
    gte(tasks.dueDate, startOfDay),
    lte(tasks.dueDate, endOfDay)
  ];
  if (ownerId) conditions.push(eq(tasks.ownerId, ownerId));
  
  return db.select().from(tasks).where(and(...conditions)).orderBy(asc(tasks.dueDate));
}

export async function getTasksByMonth(year: number, month: number, ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  const conditions = [
    gte(tasks.dueDate, startOfMonth),
    lte(tasks.dueDate, endOfMonth)
  ];
  if (ownerId) conditions.push(eq(tasks.ownerId, ownerId));
  
  return db.select().from(tasks).where(and(...conditions)).orderBy(asc(tasks.dueDate));
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(tasks).where(eq(tasks.id, id));
}

export async function getPendingTasksCount(ownerId?: number) {
  const db = await getDb();
  if (!db) return 0;
  const conditions = [eq(tasks.status, "pending")];
  if (ownerId) conditions.push(eq(tasks.ownerId, ownerId));
  const result = await db.select().from(tasks).where(and(...conditions));
  return result.length;
}

// ==========================================
// INVITE QUERIES
// ==========================================

export async function createInvite(data: InsertInvite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(invites).values(data);
  return result[0].insertId;
}

export async function getInviteByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invites).where(eq(invites.token, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getInvites() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invites).orderBy(desc(invites.createdAt));
}

export async function updateInvite(id: number, data: Partial<InsertInvite>) {
  const db = await getDb();
  if (!db) return;
  await db.update(invites).set(data).where(eq(invites.id, id));
}

export async function markInviteAsUsed(id: number, usedBy: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(invites).set({ 
    status: "used", 
    usedBy, 
    usedAt: new Date() 
  }).where(eq(invites.id, id));
}

// ==========================================
// AUDIT LOG QUERIES
// ==========================================

export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(auditLogs).values(data);
  return result[0].insertId;
}

export async function getAuditLogs(entityType: AuditLog["entityType"], entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs)
    .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
    .orderBy(desc(auditLogs.createdAt));
}

export async function getAllAuditLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

// ==========================================
// LANDING PAGE QUERIES
// ==========================================

export async function createLandingPage(data: InsertLandingPage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(landingPages).values(data);
  return result[0].insertId;
}

export async function getLandingPageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(landingPages).where(eq(landingPages.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLandingPageBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(landingPages).where(eq(landingPages.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLandingPages(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (ownerId) {
    return db.select().from(landingPages).where(eq(landingPages.ownerId, ownerId)).orderBy(desc(landingPages.createdAt));
  }
  return db.select().from(landingPages).orderBy(desc(landingPages.createdAt));
}

export async function updateLandingPage(id: number, data: Partial<InsertLandingPage>) {
  const db = await getDb();
  if (!db) return;
  await db.update(landingPages).set(data).where(eq(landingPages.id, id));
}

export async function deleteLandingPage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(landingPages).where(eq(landingPages.id, id));
}

export async function incrementLandingPageViews(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(landingPages).set({ views: sql`${landingPages.views} + 1` }).where(eq(landingPages.id, id));
}

export async function incrementLandingPageConversions(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(landingPages).set({ conversions: sql`${landingPages.conversions} + 1` }).where(eq(landingPages.id, id));
}

// ==========================================
// NOTIFICATION QUERIES
// ==========================================

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function getNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationsCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result.length;
}

// ==========================================
// AI PREDICTION QUERIES
// ==========================================

export async function createAIPrediction(data: InsertAIPrediction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiPredictions).values(data);
  return result[0].insertId;
}

export async function getAIPredictions(entityType: AIPrediction["entityType"], entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiPredictions)
    .where(and(eq(aiPredictions.entityType, entityType), eq(aiPredictions.entityId, entityId)))
    .orderBy(desc(aiPredictions.createdAt));
}

export async function getLatestAIPrediction(type: AIPrediction["type"], entityType: AIPrediction["entityType"], entityId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiPredictions)
    .where(and(
      eq(aiPredictions.type, type),
      eq(aiPredictions.entityType, entityType),
      eq(aiPredictions.entityId, entityId)
    ))
    .orderBy(desc(aiPredictions.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getHighChurnRiskContacts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contacts).where(eq(contacts.churnRisk, "high")).orderBy(desc(contacts.updatedAt));
}

export async function getRepurchaseOpportunities() {
  const db = await getDb();
  if (!db) return [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return db.select().from(contacts)
    .where(and(
      lte(contacts.lastPurchaseAt, thirtyDaysAgo),
      eq(contacts.churnRisk, "low")
    ))
    .orderBy(desc(contacts.ltv));
}

// ==========================================
// METRICS QUERIES
// ==========================================

export async function createMetricsSnapshot(data: InsertMetricsSnapshot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(metricsSnapshots).values(data);
  return result[0].insertId;
}

export async function getMetricsHistory(days = 30) {
  const db = await getDb();
  if (!db) return [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return db.select().from(metricsSnapshots)
    .where(gte(metricsSnapshots.date, startDate))
    .orderBy(asc(metricsSnapshots.date));
}

export async function getDashboardMetrics(ownerId?: number) {
  const db = await getDb();
  if (!db) return {
    totalPipeline: 0,
    wonDeals: 0,
    lostDeals: 0,
    activeDeals: 0,
    conversionRate: 0,
    avgDealValue: 0
  };
  
  const allDeals = ownerId 
    ? await db.select().from(deals).where(eq(deals.ownerId, ownerId))
    : await db.select().from(deals);
  
  const totalPipeline = allDeals.filter(d => !["won", "lost"].includes(d.stage)).reduce((acc, d) => acc + Number(d.value), 0);
  const wonDeals = allDeals.filter(d => d.stage === "won");
  const lostDeals = allDeals.filter(d => d.stage === "lost");
  const activeDeals = allDeals.filter(d => !["won", "lost"].includes(d.stage)).length;
  const closedDeals = wonDeals.length + lostDeals.length;
  const conversionRate = closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0;
  const avgDealValue = wonDeals.length > 0 ? wonDeals.reduce((acc, d) => acc + Number(d.value), 0) / wonDeals.length : 0;
  
  return {
    totalPipeline,
    wonDeals: wonDeals.reduce((acc, d) => acc + Number(d.value), 0),
    lostDeals: lostDeals.reduce((acc, d) => acc + Number(d.value), 0),
    activeDeals,
    conversionRate,
    avgDealValue
  };
}

export async function getSellerRanking() {
  const db = await getDb();
  if (!db) return [];
  
  const sellers = await db.select().from(users).where(eq(users.role, "seller"));
  const allDeals = await db.select().from(deals).where(eq(deals.stage, "won"));
  
  const ranking = sellers.map(seller => {
    const sellerDeals = allDeals.filter(d => d.ownerId === seller.id);
    const totalValue = sellerDeals.reduce((acc, d) => acc + Number(d.value), 0);
    const dealsCount = sellerDeals.length;
    return {
      ...seller,
      totalValue,
      dealsCount,
      progress: seller.salesGoal ? (totalValue / Number(seller.salesGoal)) * 100 : 0
    };
  });
  
  return ranking.sort((a, b) => b.totalValue - a.totalValue);
}
