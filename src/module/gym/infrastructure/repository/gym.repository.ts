import { inject, injectable } from 'tsyringe';
import { Pool } from 'pg';
//
import Gym, { GymPartial } from '@/module/gym/domain/entities/gym.entity.js';
import IGymRepositoryImpl from '@/module/gym/domain/interfaces/gym.repository.interface.js';
import { QueryExecutor } from '@/shared/types/database.js';
import { insertQueryBuilder, queryBuilder } from '@/utils/db.psql.util.js';

@injectable()
class GymRepositoryImpl implements IGymRepositoryImpl {
  constructor(@inject(Pool) private readonly pool: Pool) {}

  public async findById(id: string, client?: QueryExecutor): Promise<Gym | null> {
    const exec = client || this.pool;
    const result = await exec.query('SELECT * FROM gyms WHERE id = $1 AND deleted = false', [id]);
    return result.rows[0] as Gym;
  }

  create = async (gym: GymPartial, client?: QueryExecutor) => {
    const exec = client || this.pool;
    const { query, values } = insertQueryBuilder('gyms', gym);
    const result = await exec.query(query, values);
    return result.rows[0] as Gym;
  };

  updateById = async (
    id: string,
    updates: GymPartial,
    client?: QueryExecutor,
  ): Promise<Gym | null> => {
    const keys = Object.keys(updates);

    if (keys.length === 0) return null;

    const setFields = keys.map((key, index) => `"${key}" = $${index + 2}`).join(', ');
    const values = Object.values(updates);

    const query = `UPDATE gyms SET ${setFields} WHERE id = $1 RETURNING *`;

    const exec = client || this.pool;
    const result = await exec.query(query, [id, ...values]);

    return result.rows[0] as Gym;
  };

  findOne = async (data: GymPartial, client?: QueryExecutor): Promise<Gym | null> => {
    const { query, values } = queryBuilder('gyms', { ...data, deleted: false });
    const exec = client || this.pool;
    const r = await exec.query(query, values);
    return r.rows[0] as Gym;
  };

  find = async (tenant_id: string, user_id: string): Promise<Gym[]> => {
    const query = `SELECT DISTINCT
  g.gym_id,
  g.name,
  g.address,
  g.tenant_id
FROM gyms g
INNER JOIN staff s ON s.gym_id = g.gym_id
WHERE s.user_id   = $1
  AND s.tenant_id = $2
ORDER BY g.name ASC;`;

    const result = await this.pool.query(query, [user_id, tenant_id]);
    return result.rows;
  };
}

export default GymRepositoryImpl;
