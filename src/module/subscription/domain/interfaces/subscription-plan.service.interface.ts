import SubscriptionPlan from '@/module/subscription/domain/entities/subscription-plan.entity.js';

export default interface ISubscriptionPlanService {
  getAllPlans(): Promise<SubscriptionPlan[]>;
  findByIdWithDetails(id: string): Promise<SubscriptionPlan | null>;
}
