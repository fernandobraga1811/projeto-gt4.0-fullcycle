import {
  createOrder,
  changeStatus as changeOrderStatus,
  NotFoundError,
  ValidationError,
} from '../domain/order.js';

// O servico depende de um "repository" qualquer que respeite o contrato
// (inversao de dependencia): em producao Postgres, nos testes memoria.
export class OrderService {
  constructor(repository, { clock = () => new Date() } = {}) {
    this.repository = repository;
    this.clock = clock;
  }

  async create(input) {
    const order = createOrder(input, { now: this.clock() });
    await this.repository.save(order);
    return order;
  }

  async get(id) {
    const order = await this.repository.findById(id);
    if (!order) throw new NotFoundError(`pedido ${id} não encontrado`);
    return order;
  }

  async list({ limit = 20, offset = 0 } = {}) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new ValidationError('limit deve ser inteiro entre 1 e 100');
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw new ValidationError('offset deve ser inteiro >= 0');
    }
    return this.repository.list({ limit, offset });
  }

  async changeStatus(id, status) {
    const order = await this.get(id);
    const updated = changeOrderStatus(order, status, this.clock());
    await this.repository.save(updated);
    return updated;
  }
}
