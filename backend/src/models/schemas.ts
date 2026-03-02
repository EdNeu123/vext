import { z } from 'zod';

// ==========================================
// AUTH SCHEMAS
// ==========================================

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  inviteToken: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  salesGoal: z.number().positive().optional(),
});

// ==========================================
// CONTACT SCHEMAS
// ==========================================

export const createContactSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateContactSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  ltv: z.number().optional(),
  averageTicket: z.number().optional(),
  npsScore: z.number().int().min(0).max(10).optional(),
  churnRisk: z.enum(['low', 'medium', 'high']).optional(),
  bestContactTime: z.string().optional(),
});

export const bulkImportContactsSchema = z.array(
  z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    position: z.string().optional(),
    source: z.string().optional(),
  })
);

// ==========================================
// DEAL SCHEMAS
// ==========================================

export const createDealSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  value: z.number().positive('Valor deve ser positivo'),
  contactId: z.number().int(),
  productId: z.number().int().optional(),
  stage: z.enum(['prospecting', 'qualification', 'presentation', 'negotiation']).optional(),
  notes: z.string().optional(),
  tagIds: z.array(z.number().int()).optional(),
  budgetConfirmed: z.boolean().optional(),
  decisionMakerIdentified: z.boolean().optional(),
  painPoints: z.string().optional(),
  competitors: z.string().optional(),
  timeline: z.string().optional(),
  nextFollowUpDate: z.string().datetime().optional(),
});

export const updateDealSchema = z.object({
  title: z.string().min(1).optional(),
  value: z.number().positive().optional(),
  stage: z.enum(['prospecting', 'qualification', 'presentation', 'negotiation', 'won', 'lost']).optional(),
  contactId: z.number().int().optional(),
  productId: z.number().int().optional().nullable(),
  budgetConfirmed: z.boolean().optional(),
  decisionMakerIdentified: z.boolean().optional(),
  painPoints: z.string().optional(),
  competitors: z.string().optional(),
  timeline: z.string().optional(),
  nextFollowUpDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
  lostReason: z.string().optional(),
  tagIds: z.array(z.number().int()).optional(),
  reason: z.string().optional(),
});

// ==========================================
// TAG SCHEMAS
// ==========================================

export const createTagSchema = z.object({
  label: z.string().min(1, 'Label é obrigatório'),
  color: z.string().min(1, 'Cor é obrigatória'),
});

export const updateTagSchema = z.object({
  label: z.string().min(1).optional(),
  color: z.string().optional(),
});

// ==========================================
// PRODUCT SCHEMAS
// ==========================================

export const createProductSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  price: z.number().positive('Preço deve ser positivo'),
  description: z.string().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ==========================================
// TASK SCHEMAS
// ==========================================

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['call', 'meeting', 'email', 'follow_up', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime(),
  dealId: z.number().int().optional(),
  contactId: z.number().int().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['call', 'meeting', 'email', 'follow_up', 'other']).optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime().optional(),
  reason: z.string().optional(),
});

// ==========================================
// LANDING PAGE SCHEMAS
// ==========================================

export const createLandingPageSchema = z.object({
  title: z.string().min(1),
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  ctaText: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  themeColor: z.enum(['indigo', 'emerald', 'rose', 'amber', 'blue', 'purple']).optional(),
  productId: z.number().int().optional(),
});

export const updateLandingPageSchema = z.object({
  title: z.string().min(1).optional(),
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  ctaText: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  themeColor: z.enum(['indigo', 'emerald', 'rose', 'amber', 'blue', 'purple']).optional(),
  productId: z.number().int().optional().nullable(),
  isActive: z.boolean().optional(),
});

// ==========================================
// INVITE SCHEMAS
// ==========================================

export const createInviteSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'seller']),
  permissions: z.array(z.string()).optional(),
});

// ==========================================
// TEAM SCHEMAS
// ==========================================

export const updateMemberSchema = z.object({
  role: z.enum(['admin', 'seller']).optional(),
  permissions: z.array(z.string()).optional(),
  salesGoal: z.number().positive().optional(),
});

// ==========================================
// QUERY SCHEMAS
// ==========================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateLandingPageInput = z.infer<typeof createLandingPageSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
