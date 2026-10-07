import Role from '@/module/role/domain/entities/role.entity.js';
import { IRoleRepository } from '@/module/role/domain/interfaces/role.repository.interface.js';
import { Pool } from 'pg';
import { inject, injectable } from 'tsyringe';
import { QueryExecutor } from '@/shared/types/database.js';
import { insertQueryBuilder, queryBuilder } from '@/utils/db.psql.util.js';

@injectable()
class RoleRepository implements IRoleRepository {
  constructor(@inject(Pool) private readonly pool: Pool) {}

  findOne = async (role: Partial<Role>, client?: QueryExecutor): Promise<Role> => {
    const { query, values } = queryBuilder('roles', role);
    const exec = client || this.pool;
    const r = await exec.query(query, values);
    return r.rows[0];
  };

  findOneById = async (id: string, client?: QueryExecutor): Promise<Role> => {
    const exec = client || this.pool;
    const r = await exec.query('SELECT * FROM roles WHERE id=$1', [id]);
    return r.rows[0];
  };

  findOneByIdAndTenant = async (
    id: string,
    tenant_id: string,
    client?: QueryExecutor,
  ): Promise<Role> => {
    const exec = client || this.pool;
    const r = await exec.query('SELECT * FROM roles WHERE id=$1 AND tenant_id=$2', [id, tenant_id]);
    return r.rows[0];
  };

  findAll = async (role: Partial<Role> | null, client?: QueryExecutor): Promise<Role[]> => {
    const exec = client || this.pool;
    if (role && 'tenant_id' in role && role.tenant_id === null) {
      const r = await exec.query('SELECT * FROM roles WHERE tenant_id IS NULL');
      return r.rows;
    }
    const { query, values } = queryBuilder('roles', role);
    const r = await exec.query(query, values);
    return r.rows;
  };

  create = async (
    role: Pick<Role, 'name' | 'tenant_id'>,
    client?: QueryExecutor,
  ): Promise<Role> => {
    const exec = client || this.pool;

    const { query, values } = insertQueryBuilder('roles', {
      name: role.name,
      tenant_id: role.tenant_id,
    });

    const r = await exec.query(query, values);
    return r.rows[0];
  };

  update = async (
    id: string,
    tenant_id: string,
    data: Partial<Role>,
    client?: QueryExecutor,
  ): Promise<Role> => {
    const exec = client || this.pool;
    
    const setClauses: string[] = [];
    const values: any[] = [id, tenant_id];
    let paramIndex = 3;

    for (const [key, value] of Object.entries(data)) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    const query = `
      UPDATE roles
      SET ${setClauses.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;

    const r = await exec.query(query, values);
    return r.rows[0];
  };

  delete = async (
    id: string,
    tenant_id: string,
    client?: QueryExecutor,
  ): Promise<Role> => {
    const exec = client || this.pool;
    const r = await exec.query(
      'DELETE FROM roles WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, tenant_id]
    );
    return r.rows[0];
  };
}

export default RoleRepository;
