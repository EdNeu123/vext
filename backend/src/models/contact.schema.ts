import { z } from 'zod';

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

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
