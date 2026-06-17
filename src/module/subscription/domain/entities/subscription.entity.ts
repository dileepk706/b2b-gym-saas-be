// ──────────────────────────────────────────────────────────────────────────────
// Subscription Status ENUM
// ──────────────────────────────────────────────────────────────────────────────
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired'
  | 'suspended';

// ──────────────────────────────────────────────────────────────────────────────
// Core Subscription entity
// ──────────────────────────────────────────────────────────────────────────────
export default interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;

  // Lifecycle state
  status: SubscriptionStatus;

  // Billing period
  current_period_start: Date;
  current_period_end: Date | null;
  starts_at: Date;
  expires_at: Date | null;

  // Trial
  trial_ends_at: Date | null;

  // Cancellation
  cancelled_at: Date | null;
  cancel_at_period_end: boolean;

  // Scheduled downgrade
  scheduled_plan_id: string | null;

  // Renewal chain
  renewed_from_id: string | null;

  // Metadata
  metadata: Record<string, unknown> | null;
  created_at: Date | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Feature Flag
// ──────────────────────────────────────────────────────────────────────────────
export interface TenantFeatureFlag {
  tenant_id: string;
  feature_id: string;
  enabled: boolean;
  source: string;
  effective_from: Date | null;
  effective_until: Date | null;
}

export type TenantFeatureFlagRecord = TenantFeatureFlag;

// ──────────────────────────────────────────────────────────────────────────────
// Tenant Limit
// ──────────────────────────────────────────────────────────────────────────────
export interface TenantLimit {
  tenant_id: string;
  key: string;
  value: number | null;
  source: string;
  effective_from: Date | null;
  effective_until: Date | null;
}

export type TenantLimitRecord = TenantLimit;

// ──────────────────────────────────────────────────────────────────────────────
// Invoice
// ──────────────────────────────────────────────────────────────────────────────
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface Invoice {
  id: string;
  tenant_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: Date | null;
  paid_at: Date | null;
  period_start: Date | null;
  period_end: Date | null;
  description: string | null;
  idempotency_key: string | null;
  created_at: Date;
  updated_at: Date;
}

// ──────────────────────────────────────────────────────────────────────────────
// Payment
// ──────────────────────────────────────────────────────────────────────────────
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  invoice_id: string;
  tenant_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  provider_payment_id: string | null;
  failure_reason: string | null;
  attempt_number: number;
  processed_at: Date | null;
  created_at: Date;
}

// ──────────────────────────────────────────────────────────────────────────────
// Checkout Session
// ──────────────────────────────────────────────────────────────────────────────
export type CheckoutSessionStatus = 'pending' | 'completed' | 'expired';

export interface CheckoutSession {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: CheckoutSessionStatus;
  expires_at: Date;
  completed_at: Date | null;
  created_at: Date;
}
