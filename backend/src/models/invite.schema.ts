import { z } from 'zod';

export const createInviteSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'seller']),
  permissions: z.array(z.string()).optional(),
});
