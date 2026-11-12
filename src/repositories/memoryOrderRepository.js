// Implementacao em memoria do "contrato" de repositorio:
//   save(order), findById(id), list({ limit, offset })
// Usada nos testes e util para desenvolvimento sem banco.
export class MemoryOrderRepository {
  constructor() {
    this.orders = new Map();
  }

  async save(order) {
    this.orders.set(order.id, structuredClone(order));
  }

  async findById(id) {
    const order = this.orders.get(id);
    return order ? structuredClone(order) : null;
  }

  async list({ limit = 20, offset = 0 } = {}) {
    return [...this.orders.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(offset, offset + limit)
      .map((o) => structuredClone(o));
  }
}
