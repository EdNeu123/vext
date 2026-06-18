import { z } from 'zod';

export const updateMemberSchema = z.object({
  role: z.enum(['admin', 'seller']).optional(),
  permissions: z.array(z.string()).optional(),
  salesGoal: z.number().positive().optional(),
});
