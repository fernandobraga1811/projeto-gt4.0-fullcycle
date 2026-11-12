import express from 'express';
import pinoHttp from 'pino-http';
import { createMetrics } from './metrics.js';
import {
  ValidationError,
  NotFoundError,
  InvalidTransitionError,
} from './domain/order.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function createApp({ service, logger, defaultMetrics = true }) {
  const app = express();
  const metrics = createMetrics({ defaultMetrics });

  app.use(pinoHttp({ logger }));
  app.use(metrics.middleware);
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.get(
    '/metrics',
    asyncHandler(async (_req, res) => {
      res.set('Content-Type', metrics.register.contentType);
      res.send(await metrics.register.metrics());
    }),
  );

  app.post(
    '/orders',
    asyncHandler(async (req, res) => {
      const order = await service.create(req.body);
      req.log.info({ orderId: order.id, totalCents: order.totalCents }, 'pedido criado');
      res.status(201).location(`/orders/${order.id}`).json(order);
    }),
  );

  app.get(
    '/orders',
    asyncHandler(async (req, res) => {
      const limit = Number(req.query.limit ?? 20);
      const offset = Number(req.query.offset ?? 0);
      res.json(await service.list({ limit, offset }));
    }),
  );

  app.get(
    '/orders/:id',
    asyncHandler(async (req, res) => {
      res.json(await service.get(req.params.id));
    }),
  );

  app.patch(
    '/orders/:id/status',
    asyncHandler(async (req, res) => {
      const order = await service.changeStatus(req.params.id, req.body?.status);
      req.log.info({ orderId: order.id, status: order.status }, 'status alterado');
      res.json(order);
    }),
  );

  app.use((_req, res) => res.status(404).json({ error: 'rota não encontrada' }));

  // Handler de erros: traduz erros de dominio em codigos HTTP.
  app.use((err, req, res, _next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'JSON inválido' });
    }
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    if (err instanceof InvalidTransitionError) {
      return res.status(409).json({ error: err.message });
    }
    req.log.error({ err }, 'erro inesperado');
    return res.status(500).json({ error: 'erro interno' });
  });

  return app;
}
