import { z } from 'zod';

export const createGymDtoSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  gym_url: z.string().min(3, 'Gym URL must be at least 3 characters'),
  city: z.string().min(3, 'City must be at least 3 characters'),
  address: z.string().min(3, 'Address must be at least 3 characters').optional(),
  email: z.email().optional(),
  state: z.string().optional(),
  logo_url: z.string().optional(),
  opening_time: z.string().optional(),
  closing_time: z.string().optional(),
  maximum_capacity: z.number().int().positive().optional(),
});

export type CreateGymDto = z.infer<typeof createGymDtoSchema>;
