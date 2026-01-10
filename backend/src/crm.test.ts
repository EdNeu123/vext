import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({}),
  getTeamMembers: vi.fn().mockResolvedValue([
    { id: 1, name: "Admin User", email: "admin@test.com", role: "admin" },
    { id: 2, name: "Seller User", email: "seller@test.com", role: "seller" },
  ]),
  getSellers: vi.fn().mockResolvedValue([
    { id: 2, name: "Seller User", email: "seller@test.com", role: "seller" },
  ]),
  getSellerRanking: vi.fn().mockResolvedValue([
    { id: 2, name: "Seller User", totalDeals: 10, totalValue: 50000, wonDeals: 5 },
  ]),
  getContacts: vi.fn().mockResolvedValue([
    { id: 1, name: "Contact 1", email: "contact1@test.com", company: "Company A" },
    { id: 2, name: "Contact 2", email: "contact2@test.com", company: "Company B" },
  ]),
  getDeals: vi.fn().mockResolvedValue([
    { id: 1, title: "Deal 1", value: 10000, stage: "lead" },
    { id: 2, title: "Deal 2", value: 20000, stage: "proposal" },
  ]),
  getDealTags: vi.fn().mockResolvedValue([]),
  getTags: vi.fn().mockResolvedValue([
    { id: 1, label: "Hot Lead", color: "#EF4444" },
    { id: 2, label: "VIP", color: "#10B981" },
  ]),
  getProducts: vi.fn().mockResolvedValue([
    { id: 1, name: "Product A", price: 1000 },
    { id: 2, name: "Product B", price: 2000 },
  ]),
  getNotifications: vi.fn().mockResolvedValue([
    { id: 1, title: "New Deal", message: "New deal created", read: false },
  ]),
  getUnreadNotificationsCount: vi.fn().mockResolvedValue(5),
  getHighChurnRiskContacts: vi.fn().mockResolvedValue([
    { id: 1, name: "Contact 1", company: "Company A", risk: "high", lastPurchase: new Date(), ltv: "10000" },
  ]),
  getRepurchaseOpportunities: vi.fn().mockResolvedValue([
    { id: 2, name: "Contact 2", company: "Company B", lastPurchase: new Date(), avgTicket: "5000" },
  ]),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@test.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createSellerContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "seller-user",
    email: "seller@test.com",
    name: "Seller User",
    loginMethod: "manus",
    role: "seller",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Auth Router", () => {
  it("returns user info for authenticated user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.email).toBe("admin@test.com");
    expect(result?.role).toBe("admin");
  });

  it("returns null for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeNull();
  });

  it("logout clears session cookie", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});

describe("Team Router", () => {
  it("lists team members for authenticated user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.team.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("gets sellers list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.team.getSellers();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("gets seller ranking", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.team.getSellerRanking();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Contacts Router", () => {
  it("lists contacts for authenticated user", async () => {
    const ctx = createSellerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contacts.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Deals Router", () => {
  it("lists deals for authenticated user", async () => {
    const ctx = createSellerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.deals.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Tags Router", () => {
  it("lists tags for authenticated user", async () => {
    const ctx = createSellerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tags.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Products Router", () => {
  it("lists products for authenticated user", async () => {
    const ctx = createSellerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

// Dashboard stats are fetched via individual queries, not a single getStats endpoint

describe("Notifications Router", () => {
  it("lists notifications for authenticated user", async () => {
    const ctx = createSellerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("gets unread notification count", async () => {
    const ctx = createSellerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.getUnreadCount();

    expect(result).toBeDefined();
    expect(typeof result).toBe("number");
  });
});

describe("AI Router", () => {
  it("gets Vext Radar data", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.getVextRadar();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("churnAlerts");
    expect(result).toHaveProperty("repurchaseOpportunities");
  });
});
