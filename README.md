**Nível: Projeto B (simples)**

# Pedidos API

API REST de pedidos em Node.js (Express + Postgres), feita para o Projeto Final do curso Full Cycle, Módulo 4.

**Fluxo principal (ponta a ponta):** criar pedido → consultar → pagar → enviar → entregar (ou cancelar).

## Como subir (1 comando)

Requisitos: Docker e Docker Compose.

```bash
docker compose up --build
```

A API sobe em `http://localhost:3000` junto com um Postgres. Para trocar porta, usuário ou senha do banco, copie `.env.example` para `.env` e edite (o `.env` não vai para o Git).

Teste rápido:

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"customer":"Maria Silva","items":[{"sku":"SKU-1","quantity":2,"unitPriceCents":1990}]}'

curl http://localhost:3000/orders
curl http://localhost:3000/health
curl http://localhost:3000/metrics
```

## Como testar

Requisitos: Node.js 22+.

```bash
npm install
npm run lint
npm test
npm run test:coverage   # falha se a cobertura ficar abaixo do mínimo declarado
```

**Cobertura mínima declarada** (em `vitest.config.js`): 80% de linhas, funções e statements; 70% de branches. O `server.js` (bootstrap) e o repositório Postgres ficam fora da conta porque dependem de um banco real; o contrato deles é exercitado pelo repositório em memória.

## Teste de carga (k6)

Com a API no ar (`docker compose up`):

```bash
# Linux
docker run --rm -i --network host -e BASE_URL=http://localhost:3000 grafana/k6 run - < tests/k6/smoke.js

# Windows / macOS (Docker Desktop)
docker run --rm -i -e BASE_URL=http://host.docker.internal:3000 grafana/k6 run - < tests/k6/smoke.js
```

Resultados em [`docs/desempenho.md`](docs/desempenho.md).

## Endpoints

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| POST | `/orders` | Cria um pedido (valores em centavos) |
| GET | `/orders?limit=20&offset=0` | Lista, do mais novo ao mais antigo |
| GET | `/orders/:id` | Consulta um pedido |
| PATCH | `/orders/:id/status` | Altera o status (`{"status":"PAID"}`) |
| GET | `/health` | Verificação de saúde |
| GET | `/metrics` | Métricas Prometheus |

Contrato completo em [`docs/openapi.yaml`](docs/openapi.yaml). Fluxo de status permitido:
`CREATED → PAID → SHIPPED → DELIVERED`, com `CANCELLED` possível a partir de `CREATED` e `PAID`.

## Estrutura

```
src/domain/        regras de negócio puras (validação, total, transições de status)
src/services/      casos de uso (OrderService)
src/repositories/  persistência (Postgres em produção, memória nos testes)
src/app.js         rotas HTTP, métricas e tratamento de erros
src/server.js      bootstrap (config, banco, shutdown)
tests/             unitários, serviço e integração HTTP; tests/k6 = carga
docs/              ADR, OpenAPI, desempenho
```

## Decisões de design

- **SOLID:** responsabilidade única por camada; o serviço depende de um contrato de repositório, não de uma implementação (inversão de dependência).
- **Pattern escolhido:** Repository. Justificativa e alternativas em [`docs/adr/0001-repositorio-para-persistencia.md`](docs/adr/0001-repositorio-para-persistencia.md).
- **Valores em centavos inteiros** para evitar erro de ponto flutuante.

## Observabilidade e SLO

- Logs estruturados em JSON (pino), com uma linha por requisição.
- Métricas RED em `/metrics` (`http_requests_total`, `http_request_duration_seconds`).
- **SLO:** 95% das requisições abaixo de 300 ms e menos de 1% de erros, medidos pelo k6.

## Segredos

Nenhum segredo está no repositório. Variáveis ficam no `.env` (ignorado pelo Git); `.env.example` mostra os nomes. Os valores padrão do `docker-compose.yml` são só para desenvolvimento local.

## Uso de IA

Declarado em [`docs/ia.md`](docs/ia.md).
