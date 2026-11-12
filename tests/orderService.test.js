import { describe, it, expect, beforeEach } from 'vitest';
import { OrderService } from '../src/services/orderService.js';
import { MemoryOrderRepository } from '../src/repositories/memoryOrderRepository.js';
import { NotFoundError, ValidationError } from '../src/domain/order.js';

const input = (customer = 'Ana') => ({
  customer,
  items: [{ sku: 'X-1', quantity: 1, unitPriceCents: 500 }],
});

describe('OrderService', () => {
  let service;
  let tick;

  beforeEach(() => {
    tick = 0;
    // relógio controlado: cada chamada avança 1 minuto
    const clock = () => new Date(Date.UTC(2026, 10, 11, 10, tick++, 0));
    service = new OrderService(new MemoryOrderRepository(), { clock });
  });

  it('cria e consulta um pedido', async () => {
    const created = await service.create(input());
    expect(await service.get(created.id)).toEqual(created);
  });

  it('lança NotFoundError para pedido inexistente', async () => {
    await expect(service.get('nao-existe')).rejects.toThrow(NotFoundError);
  });

  it('altera o status e persiste', async () => {
    const created = await service.create(input());
    const paid = await service.changeStatus(created.id, 'PAID');
    expect(paid.status).toBe('PAID');
    expect((await service.get(created.id)).status).toBe('PAID');
  });

  it('lista do mais novo para o mais antigo, com paginação', async () => {
    const a = await service.create(input('A1'));
    const b = await service.create(input('B2'));
    const c = await service.create(input('C3'));
    const page1 = await service.list({ limit: 2, offset: 0 });
    const page2 = await service.list({ limit: 2, offset: 2 });
    expect(page1.map((o) => o.id)).toEqual([c.id, b.id]);
    expect(page2.map((o) => o.id)).toEqual([a.id]);
  });

  it('valida limit e offset', async () => {
    await expect(service.list({ limit: 0 })).rejects.toThrow(ValidationError);
    await expect(service.list({ limit: 101 })).rejects.toThrow(ValidationError);
    await expect(service.list({ offset: -1 })).rejects.toThrow(ValidationError);
  });
});
