import Staff from '@/module/staff/domain/entities/staff.entity.js';
import IStaffRepository, {
  StaffSearchFilters,
} from '@/module/staff/domain/interfaces/staff.repository.interface.js';
import { Pool } from 'pg';
import { inject, injectable } from 'tsyringe';
import { QueryExecutor } from '@/shared/types/database.js';
import { insertQueryBuilder, updateQueryBuilder, queryBuilder } from '@/utils/db.psql.util.js';

@injectable()
class StaffRepository implements IStaffRepository {
  constructor(@inject(Pool) private readonly pool: Pool) {}

  create = async (staff: Partial<Staff>, client?: QueryExecutor): Promise<Staff> => {
    const exec = client || this.pool;
    const { query, values } = insertQueryBuilder('staff', staff);
    const result = await exec.query(query, values);
    return result.rows[0];
  };

  findOne = async (filters: Partial<Staff>, client?: QueryExecutor): Promise<Staff | null> => {
    const exec = client || this.pool;
    const { query, values } = queryBuilder('staff', filters);
    const result = await exec.query(query, values);
    return result.rows[0] || null;
  };

  findById = async (id: string, client?: QueryExecutor): Promise<Staff | null> => {
    const exec = client || this.pool;
    const result = await exec.query(
      `SELECT s.*, r.name AS role_name
       FROM staff s
       LEFT JOIN roles r ON s.role_id = r.id
       WHERE s.id = $1`,
      [id],
    );
    return result.rows[0] || null;
  };

  findAll = async (filters: StaffSearchFilters, client?: QueryExecutor): Promise<Staff[]> => {
    const exec = client || this.pool;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.gym_id) {
      conditions.push(`s.gym_id = $${paramIndex++}`);
      values.push(filters.gym_id);
    }
    if (filters.tenant_id) {
      conditions.push(`s.tenant_id = $${paramIndex++}`);
      values.push(filters.tenant_id);
    }
    if (filters.role_id) {
      conditions.push(`s.role_id = $${paramIndex++}`);
      values.push(filters.role_id);
    }
    if (filters.name) {
      conditions.push(`s.name ILIKE $${paramIndex++}`);
      values.push(`%${filters.name}%`);
    }
    if (filters.email) {
      conditions.push(`s.email ILIKE $${paramIndex++}`);
      values.push(`%${filters.email}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT  s.*, 
      row_to_json(r.*) AS "roleData"
      FROM staff s
      LEFT JOIN roles r ON s.role_id = r.id
      ${whereClause}
      ORDER BY s.created_at DESC
    `;

    const result = await exec.query(query, values);
    return result.rows;
  };

  updateById = async (
    id: string,
    data: Partial<Staff>,
    client?: QueryExecutor,
  ): Promise<Staff | null> => {
    const exec = client || this.pool;
    const { query, values } = updateQueryBuilder('staff', id, data);
    const result = await exec.query(query, values);
    return result.rows[0] || null;
  };

  deleteById = async (id: string, client?: QueryExecutor): Promise<Staff | null> => {
    const exec = client || this.pool;
    const result = await exec.query(`DELETE FROM staff WHERE id = $1 RETURNING *`, [id]);
    return result.rows[0] || null;
  };
}

export default StaffRepository;
