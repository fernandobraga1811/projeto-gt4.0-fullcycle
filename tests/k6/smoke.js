import http from 'k6/http';
import { check, sleep } from 'k6';

// Smoke test: carga leve para medir o p95 do fluxo principal (criar + consultar pedido).
export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'], // SLO: menos de 1% de erros
    http_req_duration: ['p(95)<300'], // SLO: p95 abaixo de 300 ms
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
const JSON_HEADERS = { headers: { 'Content-Type': 'application/json' } };

export default function () {
  const payload = JSON.stringify({
    customer: 'Cliente k6',
    items: [{ sku: 'SKU-1', quantity: 2, unitPriceCents: 1990 }],
  });

  const created = http.post(`${BASE}/orders`, payload, JSON_HEADERS);
  check(created, { 'POST /orders retornou 201': (r) => r.status === 201 });

  const id = created.json('id');
  const got = http.get(`${BASE}/orders/${id}`);
  check(got, { 'GET /orders/:id retornou 200': (r) => r.status === 200 });

  sleep(1);
}
