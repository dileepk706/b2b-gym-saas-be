import { injectable } from 'tsyringe';

export interface MockPaymentIntent {
  id: string;
  status: 'succeeded' | 'failed';
  amount: number;
  currency: string;
  failure_reason: string | null;
}

/**
 * MockPaymentProvider simulates a payment gateway.
 *
 * In development/test, all payments succeed by default.
 * Set MOCK_PAYMENT_FAIL_RATE (0–1) env variable to simulate failures.
 *
 * In a real production system, replace this with a Stripe/Braintree adapter
 * that implements the same interface.
 */
@injectable()
class MockPaymentProvider {
  private readonly failRate: number;

  constructor() {
    const envRate = process.env['MOCK_PAYMENT_FAIL_RATE'];
    this.failRate = envRate ? parseFloat(envRate) : 0;
  }

  /**
   * Process a payment intent synchronously (mock).
   * Returns the result immediately — no webhooks needed.
   */
  processPayment = async (
    amount: number,
    currency: string,
    _tenantId: string,
  ): Promise<MockPaymentIntent> => {
    const shouldFail = Math.random() < this.failRate;

    const intentId = `mock_pi_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Simulate processing delay (10–50 ms)
    await new Promise((resolve) => setTimeout(resolve, 10 + Math.random() * 40));

    if (shouldFail) {
      return {
        id: intentId,
        status: 'failed',
        amount,
        currency,
        failure_reason: 'Your card was declined.',
      };
    }

    return {
      id: intentId,
      status: 'succeeded',
      amount,
      currency,
      failure_reason: null,
    };
  };
}

export default MockPaymentProvider;
