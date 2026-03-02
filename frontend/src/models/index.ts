export interface User {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: 'admin' | 'seller';
  salesGoal: number | null;
  isActive: boolean;
  lastSignedIn: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  source: string | null;
  notes: string | null;
  ltv: number;
  averageTicket: number;
  totalPurchases: number;
  lastPurchaseAt: string | null;
  churnRisk: 'low' | 'medium' | 'high';
  npsScore: number | null;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  owner?: { id: number; name: string; email: string };
  deals?: { id: number; title: string; value: number; stage: string }[];
}

export type DealStage = 'prospecting' | 'qualification' | 'presentation' | 'negotiation' | 'won' | 'lost';

export interface Deal {
  id: number;
  title: string;
  value: number;
  stage: DealStage;
  probability: number;
  contactId: number;
  ownerId: number;
  productId: number | null;
  budgetConfirmed: boolean;
  decisionMakerIdentified: boolean;
  painPoints: string | null;
  competitors: string | null;
  timeline: string | null;
  nextFollowUpDate: string | null;
  notes: string | null;
  closedAt: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
  contact?: { id: number; name: string; company: string | null };
  owner?: { id: number; name: string };
  tags?: Tag[];
}

export interface Tag {
  id: number;
  label: string;
  color: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export type TaskType = 'call' | 'meeting' | 'email' | 'follow_up' | 'other';
export type TaskStatus = 'pending' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  completedAt: string | null;
  dealId: number | null;
  contactId: number | null;
  ownerId: number;
  createdAt: string;
  contact?: { id: number; name: string } | null;
  deal?: { id: number; title: string } | null;
  owner?: { id: number; name: string };
}

export interface Notification {
  id: number;
  title: string;
  message: string | null;
  type: 'info' | 'success' | 'warning' | 'error' | 'ai';
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export interface LandingPage {
  id: number;
  title: string;
  headline: string;
  subheadline: string | null;
  ctaText: string | null;
  slug: string;
  themeColor: string;
  productId: number | null;
  views: number;
  conversions: number;
  isActive: boolean;
  ownerId: number;
  createdAt: string;
}

export interface Invite {
  id: number;
  token: string;
  email: string;
  name: string;
  role: string;
  status: 'pending' | 'used' | 'expired';
  expiresAt: string;
  createdAt: string;
  inviter?: { id: number; name: string };
}

export interface DashboardMetrics {
  totalPipeline: number;
  wonDeals: number;
  lostDeals: number;
  activeDeals: number;
  conversionRate: number;
  avgDealValue: number;
  contactCount: number;
  pendingTasks: number;
}

export interface GoalProgress {
  current: number;
  target: number;
  progress: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
