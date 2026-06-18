import { z } from 'zod';

export const createStaffSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 characters').optional(),
  role_id: z.uuid('Invalid role id'),
  check_in_code: z.number().min(1000, 'Check in code must be at least 4 digits').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export type CreateStaffDto = z.infer<typeof createStaffSchema>;
