import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  plan_id: z.uuid('Invalid plan id'),
});

export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;
