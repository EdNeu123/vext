import { z } from 'zod';

export const createInviteSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['moderator', 'seller']), // 'admin' nunca é convidável (seção 2.3)
  permissions: z.array(z.string()).optional(),
});
