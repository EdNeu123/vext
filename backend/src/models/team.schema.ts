import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(255).optional(),
});

// 'admin' NUNCA é atribuível diretamente — só via transferOwnership.
export const updateTeamMemberSchema = z.object({
  role: z.enum(['moderator', 'seller']),
});

export const transferOwnershipSchema = z.object({
  newOwnerUserId: z.number().int().positive(),
});

export const joinByOrgCodeSchema = z.object({
  orgCode: z.string().length(6, 'Código deve ter 6 caracteres'),
});

// Mantido por compatibilidade com rotas legadas (se necessário)
export const updateMemberSchema = updateTeamMemberSchema;

export type CreateTeamInput        = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput        = z.infer<typeof updateTeamSchema>;
export type UpdateTeamMemberInput  = z.infer<typeof updateTeamMemberSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
export type JoinByOrgCodeInput     = z.infer<typeof joinByOrgCodeSchema>;
