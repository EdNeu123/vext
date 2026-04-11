import { z } from 'zod';

export const createCardSchema = z.object({
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

export const updateCardSchema = z.object({
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

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
