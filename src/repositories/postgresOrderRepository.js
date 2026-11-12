// Implementacao Postgres do mesmo contrato de repositorio.
export class PostgresOrderRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id           TEXT PRIMARY KEY,
        customer     TEXT        NOT NULL,
        items        JSONB       NOT NULL,
        total_cents  INTEGER     NOT NULL,
        status       TEXT        NOT NULL,
        created_at   TIMESTAMPTZ NOT NULL,
        updated_at   TIMESTAMPTZ NOT NULL
      )
    `);
    await this.pool.query(
      'CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC)',
    );
  }

  async save(order) {
    await this.pool.query(
      `INSERT INTO orders (id, customer, items, total_cents, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE
         SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
      [
        order.id,
        order.customer,
        JSON.stringify(order.items),
        order.totalCents,
        order.status,
        order.createdAt,
        order.updatedAt,
      ],
    );
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return rows[0] ? toOrder(rows[0]) : null;
  }

  async list({ limit = 20, offset = 0 } = {}) {
    const { rows } = await this.pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset],
    );
    return rows.map(toOrder);
  }
}

function toOrder(row) {
  return {
    id: row.id,
    customer: row.customer,
    items: row.items,
    totalCents: row.total_cents,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
