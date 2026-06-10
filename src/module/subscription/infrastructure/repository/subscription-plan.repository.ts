import SubscriptionPlan from '@/module/subscription/domain/entities/subscription-plan.entity.js';
import ISubscriptionPlanRepository from '@/module/subscription/domain/interfaces/subscription-plan.repository.interface.js';
import { Pool } from 'pg';
import { inject, injectable } from 'tsyringe';

@injectable()
class SubscriptionPlanRepository implements ISubscriptionPlanRepository {
  constructor(@inject(Pool) private readonly pool: Pool) {}

  private buildPlanQuery(whereClause = '') {
    return `
      SELECT
        sp.id,
        sp.name,
        sp.price,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', f.id,
              'key', f.key,
              'name', f.name
            )
          ) FILTER (WHERE f.id IS NOT NULL),
          '[]'
        ) AS features,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'key', pl.key,
              'value', pl.value
            )
          ) FILTER (WHERE pl.key IS NOT NULL),
          '[]'
        ) AS limits
      FROM subscription_plans sp
      LEFT JOIN plan_features pf ON pf.plan_id = sp.id
      LEFT JOIN features f ON f.id = pf.feature_id
      LEFT JOIN plan_limits pl ON pl.plan_id = sp.id
      ${whereClause}
      GROUP BY sp.id, sp.name, sp.price
      ORDER BY sp.price ASC
    `;
  }

  findAllWithDetails = async (): Promise<SubscriptionPlan[]> => {
    const { rows } = await this.pool.query<SubscriptionPlan>(this.buildPlanQuery());
    return rows;
  };

  findByIdWithDetails = async (id: string): Promise<SubscriptionPlan | null> => {
    const { rows } = await this.pool.query<SubscriptionPlan>(
      this.buildPlanQuery('WHERE sp.id = $1'),
      [id],
    );
    return rows[0] || null;
  };
}

export default SubscriptionPlanRepository;
