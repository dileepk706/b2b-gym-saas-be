import { TenantPartial } from '@/module/tenant/domian/entities/tenant.entity.js';
import ITenantRepository from '@/module/tenant/domian/interfaces/tenant.repository.interface.js';
import { Pool } from 'pg';
import { inject, injectable } from 'tsyringe';
import Tenant from '@/module/tenant/domian/entities/tenant.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

@injectable()
class TenantRepositoryImpl implements ITenantRepository {
  constructor(@inject(Pool) private readonly pool: Pool) {}

  create = async (tenant: TenantPartial, client?: QueryExecutor): Promise<Tenant> => {
    const exec = client || this.pool;
    const result = await exec.query('INSERT INTO tenants (name) VALUES ($1) RETURNING *', [
      tenant.name,
    ]);
    return result.rows[0] as Tenant;
  };

  updateById = async (id: string, data: TenantPartial, client?: QueryExecutor) => {
    const keys = Object.keys(data);
    if (keys.length == 0) return null;

    const setFields = keys.map((key, index) => `"${key}" = $${index + 2}`).join(', ');

    const values = Object.values(data);

    const query = `UPDATE tenants SET ${setFields} WHERE id=$1 RETURNING *`;

    const exec = client || this.pool;
    const result = await exec.query(query, [id, ...values]);

    return result.rows[0];
  };

  findOneById = async (id: string, client?: QueryExecutor) => {
    const exec = client || this.pool;
    const result = await exec.query('SELECT * FROM tenants WHERE id=$1', [id]);
    return result.rows[0];
  };
}

export default TenantRepositoryImpl;
