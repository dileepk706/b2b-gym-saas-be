import { z } from 'zod';

export const updateUserSchema = z.object({
  email: z.email('Invalid email address').optional(),
  name: z.string().optional(),
  password: z.string().optional(),
  currentPassword: z.string().optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
