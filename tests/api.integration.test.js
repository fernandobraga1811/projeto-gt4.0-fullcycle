import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createLogger } from '../src/logger.js';
import { OrderService } from '../src/services/orderService.js';
import { MemoryOrderRepository } from '../src/repositories/memoryOrderRepository.js';

const body = {
  customer: 'Carlos Souza',
  items: [{ sku: 'SKU-9', quantity: 3, unitPriceCents: 1000 }],
};

describe('API de pedidos (integração HTTP)', () => {
  let app;

  beforeEach(() => {
    const service = new OrderService(new MemoryOrderRepository());
    app = createApp({ service, logger: createLogger('silent'), defaultMetrics: false });
  });

  it('fluxo completo: cria, consulta, paga e lista', async () => {
    const created = await request(app).post('/orders').send(body);
    expect(created.status).toBe(201);
    expect(created.body.totalCents).toBe(3000);
    expect(created.headers.location).toBe(`/orders/${created.body.id}`);

    const got = await request(app).get(`/orders/${created.body.id}`);
    expect(got.status).toBe(200);
    expect(got.body.status).toBe('CREATED');

    const paid = await request(app)
      .patch(`/orders/${created.body.id}/status`)
      .send({ status: 'PAID' });
    expect(paid.status).toBe(200);
    expect(paid.body.status).toBe('PAID');

    const list = await request(app).get('/orders?limit=10');
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });

  it('retorna 400 para pedido inválido', async () => {
    const res = await request(app).post('/orders').send({ customer: 'X', items: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('retorna 400 para JSON malformado', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Content-Type', 'application/json')
      .send('{ quebrado');
    expect(res.status).toBe(400);
  });

  it('retorna 404 para pedido inexistente e rota inexistente', async () => {
    expect((await request(app).get('/orders/xyz')).status).toBe(404);
    expect((await request(app).get('/nada')).status).toBe(404);
  });

  it('retorna 409 para transição de status inválida', async () => {
    const created = await request(app).post('/orders').send(body);
    const res = await request(app)
      .patch(`/orders/${created.body.id}/status`)
      .send({ status: 'DELIVERED' });
    expect(res.status).toBe(409);
  });

  it('retorna 400 para parâmetros de paginação inválidos', async () => {
    expect((await request(app).get('/orders?limit=abc')).status).toBe(400);
  });

  it('expõe /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('expõe métricas Prometheus com a rota usada', async () => {
    await request(app).post('/orders').send(body);
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('route="/orders"');
    expect(res.text).toContain('http_request_duration_seconds');
  });
});
