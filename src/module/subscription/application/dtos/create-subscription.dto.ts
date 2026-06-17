import { z } from 'zod';

// ── Checkout ──────────────────────────────────────────────────────────────────

export const createCheckoutSessionSchema = z.object({
  plan_id: z.string().uuid('Invalid plan id'),
});

export type CreateCheckoutSessionDto = z.infer<typeof createCheckoutSessionSchema>;

export const completeCheckoutSchema = z.object({
  session_id: z.string().uuid('Invalid session id'),
});

export type CompleteCheckoutDto = z.infer<typeof completeCheckoutSchema>;

// ── Plan change ───────────────────────────────────────────────────────────────

export const changePlanSchema = z.object({
  plan_id: z.string().uuid('Invalid plan id'),
});

export type ChangePlanDto = z.infer<typeof changePlanSchema>;

// ── Keep old DTO name for backward-compat (maps to checkout) ─────────────────

export const createSubscriptionSchema = createCheckoutSessionSchema;
export type CreateSubscriptionDto = CreateCheckoutSessionDto;
