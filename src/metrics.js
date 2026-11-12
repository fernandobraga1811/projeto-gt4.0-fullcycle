import client from 'prom-client';

// Metricas no estilo RED: Rate (requests_total), Errors (status_code) e Duration (histograma).
export function createMetrics({ defaultMetrics = true } = {}) {
  const register = new client.Registry();
  if (defaultMetrics) client.collectDefaultMetrics({ register });

  const labelNames = ['method', 'route', 'status_code'];
  const requestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total de requisicoes HTTP',
    labelNames,
    registers: [register],
  });
  const duration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duracao das requisicoes HTTP em segundos',
    labelNames,
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
    registers: [register],
  });

  const middleware = (req, res, next) => {
    const stop = duration.startTimer();
    res.on('finish', () => {
      const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : 'unmatched';
      const labels = { method: req.method, route, status_code: res.statusCode };
      stop(labels);
      requestsTotal.inc(labels);
    });
    next();
  };

  return { register, middleware };
}
