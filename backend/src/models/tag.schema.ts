import { z } from 'zod';

export const createTagSchema = z.object({
  label: z.string().min(1, 'Label é obrigatório'),
  color: z.string().min(1, 'Cor é obrigatória'),
});

export const updateTagSchema = z.object({
  label: z.string().min(1).optional(),
  color: z.string().optional(),
});
