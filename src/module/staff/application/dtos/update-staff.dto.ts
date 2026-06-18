import { z } from 'zod';

export const updateStaffSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').optional(),
  email: z.email('Invalid email address').optional(),
  phone: z.string().min(10, 'Phone must be at least 10 characters').optional(),
  role_id: z.uuid('Invalid role id').optional(),
  check_in_code: z.number().min(1000, 'Check in code must be at least 4 digits').optional(),
});

export type UpdateStaffDto = z.infer<typeof updateStaffSchema>;
