import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.email('Invalid email address'),
  name: z.string(),
  password: z.string(),
  // .min(8, 'Password must be at least 8 characters')
  // .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  // .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  // .regex(/[0-9]/, 'Must contain at least one number')
  // .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character'),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
