import SubscriptionPlan from '@/module/subscription/domain/entities/subscription-plan.entity.js';
import ISubscriptionPlanRepository from '@/module/subscription/domain/interfaces/subscription-plan.repository.interface.js';
import ISubscriptionPlanService from '@/module/subscription/domain/interfaces/subscription-plan.service.interface.js';
import { inject, injectable } from 'tsyringe';

@injectable()
class SubscriptionPlanService implements ISubscriptionPlanService {
  constructor(
    @inject('ISubscriptionPlanRepository')
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
  ) {}

  getAllPlans = async (): Promise<SubscriptionPlan[]> => {
    return this.subscriptionPlanRepository.findAllWithDetails();
  };

  findByIdWithDetails = async (id: string): Promise<SubscriptionPlan | null> => {
    return this.subscriptionPlanRepository.findByIdWithDetails(id);
  };
}

export default SubscriptionPlanService;
