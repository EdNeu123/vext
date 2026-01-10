import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

// ==========================================
// HELPER: Admin-only procedure
// ==========================================
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

// ==========================================
// HELPER: Calculate deal probability based on BANT
// ==========================================
function calculateDealProbability(deal: {
  stage: string;
  budgetConfirmed?: boolean | null;
  decisionMakerIdentified?: boolean | null;
  painPoints?: string | null;
  timeline?: string | null;
}): number {
  const stageProbabilities: Record<string, number> = {
    prospecting: 10,
    qualification: 25,
    presentation: 50,
    negotiation: 75,
    won: 100,
    lost: 0,
  };

  let baseProbability = stageProbabilities[deal.stage] || 10;

  // BANT bonuses
  if (deal.budgetConfirmed) baseProbability += 5;
  if (deal.decisionMakerIdentified) baseProbability += 5;
  if (deal.painPoints && deal.painPoints.length > 10) baseProbability += 5;
  if (deal.timeline) baseProbability += 5;

  // End of month pressure (last 5 days)
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  if (today.getDate() > daysInMonth - 5) {
    baseProbability += 5;
  }

  return Math.min(baseProbability, 100);
}

// ==========================================
// HELPER: Create audit log
// ==========================================
async function createAuditLog(
  entityType: "deal" | "contact" | "product" | "user" | "invite" | "task" | "landing_page",
  entityId: number,
  action: string,
  userId: number,
  userName: string,
  changes?: Record<string, { old: unknown; new: unknown }>,
  reason?: string
) {
  await db.createAuditLog({
    entityType,
    entityId,
    action,
    userId,
    userName,
    changes,
    reason,
  });
}

export const appRouter = router({
  system: systemRouter,

  // ==========================================
  // AUTH ROUTER
  // ==========================================
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        avatar: z.string().optional(),
        salesGoal: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUser(ctx.user.id, {
          name: input.name,
          phone: input.phone,
          avatar: input.avatar,
          salesGoal: input.salesGoal?.toString(),
        });
        return { success: true };
      }),
  }),

  // ==========================================
  // TEAM/INVITES ROUTER (Admin)
  // ==========================================
  team: router({
    list: protectedProcedure.query(async () => {
      return db.getTeamMembers();
    }),
    getSellers: protectedProcedure.query(async () => {
      return db.getSellers();
    }),
    getSellerRanking: protectedProcedure.query(async () => {
      return db.getSellerRanking();
    }),
    updateMember: adminProcedure
      .input(z.object({
        id: z.number(),
        role: z.enum(["admin", "seller"]).optional(),
        permissions: z.array(z.string()).optional(),
        salesGoal: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUser(input.id, {
          role: input.role,
          permissions: input.permissions,
          salesGoal: input.salesGoal?.toString(),
        });
        await createAuditLog("user", input.id, "Member Updated", ctx.user.id, ctx.user.name || "Admin");
        return { success: true };
      }),
  }),

  invites: router({
    list: adminProcedure.query(async () => {
      return db.getInvites();
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(["admin", "seller"]),
        permissions: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        const token = `VEXT-${nanoid(8).toUpperCase()}-${nanoid(4).toUpperCase()}`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

        const id = await db.createInvite({
          token,
          email: input.email,
          name: input.name,
          role: input.role,
          permissions: input.permissions,
          invitedBy: ctx.user.id,
          expiresAt,
        });

        await createAuditLog("invite", id, "Invite Created", ctx.user.id, ctx.user.name || "Admin");
        return { token, id };
      }),
    validate: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invite = await db.getInviteByToken(input.token);
        if (!invite) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Convite não encontrado" });
        }
        if (invite.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este convite já foi utilizado" });
        }
        if (new Date() > invite.expiresAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este convite expirou" });
        }
        return {
          name: invite.name,
          email: invite.email,
          role: invite.role,
        };
      }),
    revoke: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateInvite(input.id, { status: "expired" });
        await createAuditLog("invite", input.id, "Invite Revoked", ctx.user.id, ctx.user.name || "Admin");
        return { success: true };
      }),
  }),

  // ==========================================
  // CONTACTS ROUTER
  // ==========================================
  contacts: router({
    list: protectedProcedure
      .input(z.object({ all: z.boolean().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role === "admin" || input?.all) {
          return db.getContacts();
        }
        return db.getContacts(ctx.user.id);
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const contact = await db.getContactById(input.id);
        if (!contact) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Contato não encontrado" });
        }
        return contact;
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        source: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createContact({
          ...input,
          ownerId: ctx.user.id,
        });
        await createAuditLog("contact", id, "Contact Created", ctx.user.id, ctx.user.name || "User");
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        source: z.string().optional(),
        notes: z.string().optional(),
        ltv: z.number().optional(),
        averageTicket: z.number().optional(),
        npsScore: z.number().optional(),
        churnRisk: z.enum(["low", "medium", "high"]).optional(),
        bestContactTime: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const existing = await db.getContactById(id);
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const changes: Record<string, { old: unknown; new: unknown }> = {};
        Object.keys(data).forEach((key) => {
          const k = key as keyof typeof data;
          if (data[k] !== undefined && data[k] !== existing[k as keyof typeof existing]) {
            changes[key] = { old: existing[k as keyof typeof existing], new: data[k] };
          }
        });

        await db.updateContact(id, {
          ...data,
          ltv: data.ltv?.toString(),
          averageTicket: data.averageTicket?.toString(),
        });
        await createAuditLog("contact", id, "Contact Updated", ctx.user.id, ctx.user.name || "User", changes);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await createAuditLog("contact", input.id, "Contact Deleted", ctx.user.id, ctx.user.name || "User");
        await db.deleteContact(input.id);
        return { success: true };
      }),
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role === "admin") {
          return db.searchContacts(input.query);
        }
        return db.searchContacts(input.query, ctx.user.id);
      }),
    bulkImport: protectedProcedure
      .input(z.array(z.object({
        name: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        source: z.string().optional(),
      })))
      .mutation(async ({ ctx, input }) => {
        const contacts = input.map((c) => ({ ...c, ownerId: ctx.user.id }));
        await db.bulkCreateContacts(contacts);
        return { imported: contacts.length };
      }),
    getHighChurnRisk: protectedProcedure.query(async () => {
      return db.getHighChurnRiskContacts();
    }),
    getRepurchaseOpportunities: protectedProcedure.query(async () => {
      return db.getRepurchaseOpportunities();
    }),
  }),

  // ==========================================
  // DEALS ROUTER
  // ==========================================
  deals: router({
    list: protectedProcedure
      .input(z.object({ all: z.boolean().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const deals = ctx.user.role === "admin" || input?.all
          ? await db.getDeals()
          : await db.getDeals(ctx.user.id);

        // Get tags for each deal
        const dealsWithTags = await Promise.all(
          deals.map(async (deal) => {
            const tags = await db.getDealTags(deal.id);
            return { ...deal, tags };
          })
        );

        return dealsWithTags;
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const deal = await db.getDealById(input.id);
        if (!deal) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Oportunidade não encontrada" });
        }
        const tags = await db.getDealTags(deal.id);
        const history = await db.getAuditLogs("deal", deal.id);
        return { ...deal, tags, history };
      }),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        value: z.number(),
        contactId: z.number(),
        productId: z.number().optional(),
        stage: z.enum(["prospecting", "qualification", "presentation", "negotiation", "won", "lost"]).optional(),
        notes: z.string().optional(),
        tagIds: z.array(z.number()).optional(),
        budgetConfirmed: z.boolean().optional(),
        decisionMakerIdentified: z.boolean().optional(),
        painPoints: z.string().optional(),
        competitors: z.string().optional(),
        timeline: z.string().optional(),
        nextFollowUpDate: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { tagIds, nextFollowUpDate, ...dealData } = input;
        const probability = calculateDealProbability({ stage: dealData.stage || "prospecting" });

        const id = await db.createDeal({
          ...dealData,
          value: dealData.value.toString(),
          ownerId: ctx.user.id,
          probability,
          nextFollowUpDate: nextFollowUpDate || null,
        });

        if (tagIds && tagIds.length > 0) {
          await db.setDealTags(id, tagIds);
        }

        await createAuditLog("deal", id, "Deal Created", ctx.user.id, ctx.user.name || "User");
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        value: z.number().optional(),
        stage: z.enum(["prospecting", "qualification", "presentation", "negotiation", "won", "lost"]).optional(),
        contactId: z.number().optional(),
        productId: z.number().optional(),
        budgetConfirmed: z.boolean().optional(),
        decisionMakerIdentified: z.boolean().optional(),
        painPoints: z.string().optional(),
        competitors: z.string().optional(),
        timeline: z.string().optional(),
        nextFollowUpDate: z.date().optional(),
        notes: z.string().optional(),
        lostReason: z.string().optional(),
        tagIds: z.array(z.number()).optional(),
        reason: z.string().optional(), // For compliance
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, tagIds, reason, ...data } = input;
        const existing = await db.getDealById(id);
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Calculate new probability
        const probability = calculateDealProbability({
          stage: data.stage || existing.stage,
          budgetConfirmed: data.budgetConfirmed ?? existing.budgetConfirmed,
          decisionMakerIdentified: data.decisionMakerIdentified ?? existing.decisionMakerIdentified,
          painPoints: data.painPoints ?? existing.painPoints,
          timeline: data.timeline ?? existing.timeline,
        });

        // Track changes for audit
        const changes: Record<string, { old: unknown; new: unknown }> = {};
        Object.keys(data).forEach((key) => {
          const k = key as keyof typeof data;
          if (data[k] !== undefined && data[k] !== existing[k as keyof typeof existing]) {
            changes[key] = { old: existing[k as keyof typeof existing], new: data[k] };
          }
        });

        // Handle won/lost
        let closedAt = existing.closedAt;
        if (data.stage === "won" || data.stage === "lost") {
          closedAt = new Date();
        }

        await db.updateDeal(id, {
          ...data,
          value: data.value?.toString(),
          probability,
          closedAt,
        });

        if (tagIds !== undefined) {
          await db.setDealTags(id, tagIds);
        }

        await createAuditLog("deal", id, "Deal Updated", ctx.user.id, ctx.user.name || "User", changes, reason);
        return { success: true, probability };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await createAuditLog("deal", input.id, "Deal Deleted", ctx.user.id, ctx.user.name || "User");
        await db.deleteDeal(input.id);
        return { success: true };
      }),
    getHistory: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getAuditLogs("deal", input.id);
      }),
    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") {
        return db.getPipelineStats();
      }
      return db.getPipelineStats(ctx.user.id);
    }),
    getWithFollowUp: protectedProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role === "admin") {
          return db.getDealsWithFollowUp(input.date);
        }
        return db.getDealsWithFollowUp(input.date, ctx.user.id);
      }),
  }),

  // ==========================================
  // TAGS ROUTER
  // ==========================================
  tags: router({
    list: protectedProcedure.query(async () => {
      return db.getTags();
    }),
    create: protectedProcedure
      .input(z.object({
        label: z.string().min(1),
        color: z.string(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createTag(input);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        label: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTag(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTag(input.id);
        return { success: true };
      }),
  }),

  // ==========================================
  // PRODUCTS ROUTER
  // ==========================================
  products: router({
    list: protectedProcedure.query(async () => {
      return db.getProducts();
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const product = await db.getProductById(input.id);
        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return product;
      }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        price: z.number(),
        description: z.string().optional(),
        sku: z.string().optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createProduct({
          ...input,
          price: input.price.toString(),
        });
        await createAuditLog("product", id, "Product Created", ctx.user.id, ctx.user.name || "Admin");
        return { id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        price: z.number().optional(),
        description: z.string().optional(),
        sku: z.string().optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateProduct(id, {
          ...data,
          price: data.price?.toString(),
        });
        await createAuditLog("product", id, "Product Updated", ctx.user.id, ctx.user.name || "Admin");
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await createAuditLog("product", input.id, "Product Deleted", ctx.user.id, ctx.user.name || "Admin");
        await db.deleteProduct(input.id);
        return { success: true };
      }),
  }),

  // ==========================================
  // TASKS ROUTER
  // ==========================================
  tasks: router({
    list: protectedProcedure
      .input(z.object({ all: z.boolean().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role === "admin" || input?.all) {
          return db.getTasks();
        }
        return db.getTasks(ctx.user.id);
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const task = await db.getTaskById(input.id);
        if (!task) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return task;
      }),
    getByDate: protectedProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role === "admin") {
          return db.getTasksByDate(input.date);
        }
        return db.getTasksByDate(input.date, ctx.user.id);
      }),
    getByMonth: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role === "admin") {
          return db.getTasksByMonth(input.year, input.month);
        }
        return db.getTasksByMonth(input.year, input.month, ctx.user.id);
      }),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["call", "meeting", "email", "follow_up", "other"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.date(),
        dealId: z.number().optional(),
        contactId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createTask({
          ...input,
          ownerId: ctx.user.id,
        });
        await createAuditLog("task", id, "Task Created", ctx.user.id, ctx.user.name || "User");
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(["call", "meeting", "email", "follow_up", "other"]).optional(),
        status: z.enum(["pending", "completed", "cancelled"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.date().optional(),
        reason: z.string().optional(), // Compliance for rescheduling
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, reason, ...data } = input;
        const existing = await db.getTaskById(id);
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Track changes
        const changes: Record<string, { old: unknown; new: unknown }> = {};
        if (data.dueDate && data.dueDate.getTime() !== existing.dueDate.getTime()) {
          changes.dueDate = { old: existing.dueDate, new: data.dueDate };
        }

        // Compliance: require reason for rescheduling
        if (changes.dueDate && !reason) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "É obrigatório informar o motivo do reagendamento" 
          });
        }

        let completedAt = existing.completedAt;
        if (data.status === "completed") {
          completedAt = new Date();
        }

        await db.updateTask(id, { ...data, completedAt });
        await createAuditLog("task", id, "Task Updated", ctx.user.id, ctx.user.name || "User", changes, reason);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await createAuditLog("task", input.id, "Task Deleted", ctx.user.id, ctx.user.name || "User");
        await db.deleteTask(input.id);
        return { success: true };
      }),
    getPendingCount: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") {
        return db.getPendingTasksCount();
      }
      return db.getPendingTasksCount(ctx.user.id);
    }),
  }),

  // ==========================================
  // LANDING PAGES ROUTER
  // ==========================================
  landingPages: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") {
        return db.getLandingPages();
      }
      return db.getLandingPages(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const page = await db.getLandingPageById(input.id);
        if (!page) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return page;
      }),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const page = await db.getLandingPageBySlug(input.slug);
        if (!page || !page.isActive) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        // Increment views
        await db.incrementLandingPageViews(page.id);
        return page;
      }),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        headline: z.string().min(1),
        subheadline: z.string().optional(),
        ctaText: z.string().optional(),
        slug: z.string().min(1),
        themeColor: z.enum(["indigo", "emerald", "rose", "amber", "blue", "purple"]).optional(),
        productId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if slug is unique
        const existing = await db.getLandingPageBySlug(input.slug);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Este slug já está em uso" });
        }

        const id = await db.createLandingPage({
          ...input,
          ownerId: ctx.user.id,
        });
        await createAuditLog("landing_page", id, "Landing Page Created", ctx.user.id, ctx.user.name || "User");
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        headline: z.string().optional(),
        subheadline: z.string().optional(),
        ctaText: z.string().optional(),
        slug: z.string().optional(),
        themeColor: z.enum(["indigo", "emerald", "rose", "amber", "blue", "purple"]).optional(),
        productId: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;

        // Check slug uniqueness if changing
        if (data.slug) {
          const existing = await db.getLandingPageBySlug(data.slug);
          if (existing && existing.id !== id) {
            throw new TRPCError({ code: "CONFLICT", message: "Este slug já está em uso" });
          }
        }

        await db.updateLandingPage(id, data);
        await createAuditLog("landing_page", id, "Landing Page Updated", ctx.user.id, ctx.user.name || "User");
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await createAuditLog("landing_page", input.id, "Landing Page Deleted", ctx.user.id, ctx.user.name || "User");
        await db.deleteLandingPage(input.id);
        return { success: true };
      }),
    recordConversion: publicProcedure
      .input(z.object({ slug: z.string() }))
      .mutation(async ({ input }) => {
        const page = await db.getLandingPageBySlug(input.slug);
        if (page) {
          await db.incrementLandingPageConversions(page.id);
        }
        return { success: true };
      }),
  }),

  // ==========================================
  // NOTIFICATIONS ROUTER
  // ==========================================
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotifications(ctx.user.id);
    }),
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationsCount(ctx.user.id);
    }),
  }),

  // ==========================================
  // DASHBOARD/METRICS ROUTER
  // ==========================================
  dashboard: router({
    getMetrics: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") {
        return db.getDashboardMetrics();
      }
      return db.getDashboardMetrics(ctx.user.id);
    }),
    getSellerGoalProgress: protectedProcedure.query(async ({ ctx }) => {
      const stats = await db.getPipelineStats(ctx.user.id);
      const user = await db.getUserById(ctx.user.id);
      const goal = user?.salesGoal ? Number(user.salesGoal) : 50000;
      return {
        current: stats.won,
        target: goal,
        progress: (stats.won / goal) * 100,
      };
    }),
    getTodayTasks: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date();
      if (ctx.user.role === "admin") {
        return db.getTasksByDate(today);
      }
      return db.getTasksByDate(today, ctx.user.id);
    }),
    getMetricsHistory: adminProcedure
      .input(z.object({ days: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getMetricsHistory(input?.days || 30);
      }),
  }),

  // ==========================================
  // AI ROUTER
  // ==========================================
  ai: router({
    analyzeDeal: protectedProcedure
      .input(z.object({ dealId: z.number() }))
      .mutation(async ({ input }) => {
        const deal = await db.getDealById(input.dealId);
        if (!deal) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const contact = await db.getContactById(deal.contactId);

        // Use LLM to analyze the deal
        const prompt = `Analise esta oportunidade de venda e forneça insights:
        
Título: ${deal.title}
Valor: R$ ${deal.value}
Estágio: ${deal.stage}
Probabilidade atual: ${deal.probability}%

BANT:
- Orçamento confirmado: ${deal.budgetConfirmed ? "Sim" : "Não"}
- Decisor identificado: ${deal.decisionMakerIdentified ? "Sim" : "Não"}
- Dores do cliente: ${deal.painPoints || "Não informado"}
- Prazo: ${deal.timeline || "Não informado"}

Cliente: ${contact?.name || "N/A"}
Empresa: ${contact?.company || "N/A"}

Forneça:
1. Score de 0-100 para probabilidade de fechamento
2. 3 fatores principais que influenciam a decisão
3. Uma recomendação de próximo passo

Responda em JSON: { "score": number, "factors": string[], "recommendation": string }`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "Você é um especialista em vendas B2B e análise de oportunidades." },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "deal_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    score: { type: "number" },
                    factors: { type: "array", items: { type: "string" } },
                    recommendation: { type: "string" },
                  },
                  required: ["score", "factors", "recommendation"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices[0].message.content;
          const analysis = JSON.parse(typeof content === 'string' ? content : "{}");

          // Save prediction
          await db.createAIPrediction({
            type: "deal_score",
            entityType: "deal",
            entityId: deal.id,
            score: analysis.score.toString(),
            confidence: "85",
            factors: analysis.factors,
            recommendation: analysis.recommendation,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          });

          return analysis;
        } catch (error) {
          console.error("AI analysis failed:", error);
          // Return fallback analysis
          return {
            score: deal.probability,
            factors: ["Análise baseada em dados BANT", "Estágio atual do pipeline", "Histórico de interações"],
            recommendation: "Continue acompanhando o cliente e preencha mais informações BANT para melhor análise.",
          };
        }
      }),

    getVextRadar: protectedProcedure.query(async () => {
      // Get high churn risk contacts
      const churnRisks = await db.getHighChurnRiskContacts();

      // Get repurchase opportunities
      const repurchaseOps = await db.getRepurchaseOpportunities();

      return {
        churnAlerts: churnRisks.slice(0, 5).map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company,
          risk: c.churnRisk,
          lastPurchase: c.lastPurchaseAt,
          ltv: c.ltv,
        })),
        repurchaseOpportunities: repurchaseOps.slice(0, 5).map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company,
          lastPurchase: c.lastPurchaseAt,
          ltv: c.ltv,
          averageTicket: c.averageTicket,
        })),
      };
    }),

    suggestBestContactTime: protectedProcedure
      .input(z.object({ contactId: z.number() }))
      .mutation(async ({ input }) => {
        const contact = await db.getContactById(input.contactId);
        if (!contact) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Simple heuristic based on position
        let suggestion = "14:00 - 16:00";
        if (contact.position?.toLowerCase().includes("ceo") || contact.position?.toLowerCase().includes("diretor")) {
          suggestion = "08:00 - 10:00";
        } else if (contact.position?.toLowerCase().includes("gerente")) {
          suggestion = "10:00 - 12:00";
        }

        await db.updateContact(input.contactId, { bestContactTime: suggestion });

        return { bestTime: suggestion };
      }),
  }),

  // ==========================================
  // AUDIT LOG ROUTER
  // ==========================================
  audit: router({
    getByEntity: protectedProcedure
      .input(z.object({
        entityType: z.enum(["deal", "contact", "product", "user", "invite", "task", "landing_page"]),
        entityId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getAuditLogs(input.entityType, input.entityId);
      }),
    getRecent: adminProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getAllAuditLogs(input?.limit || 100);
      }),
  }),
});

export type AppRouter = typeof appRouter;
