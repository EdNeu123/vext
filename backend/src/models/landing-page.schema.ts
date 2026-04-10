import { z } from 'zod';

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
