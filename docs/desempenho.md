# Desempenho

## SLO declarado

- **Latência:** 95% das requisições do fluxo principal (criar e consultar pedido) em menos de **300 ms**.
- **Disponibilidade/erros:** menos de **1%** de requisições com erro.

Os dois limites estão como `thresholds` em `tests/k6/smoke.js`: o k6 falha se o SLO não for cumprido.

## Resultado do smoke test

Cenário: 5 usuários virtuais por 30 s, cada iteração faz `POST /orders` e `GET /orders/:id` (150 iterações, 300 requisições).

| Métrica | Valor medido | Meta |
| ------- | ------------ | ---- |
| `http_req_duration` p(95) | 42 ms | < 300 ms |
| `http_req_duration` média | 14,11 ms | |
| `http_req_duration` máximo | 137,84 ms | |
| `http_req_failed` | 0,00% | < 1% |
| Requisições totais | 300 | |
| Ambiente | Windows com Docker Desktop; API e Postgres via `docker compose`; k6 via Docker | |
| Data da medição | 12/11/2026 | |

Saída completa do k6:

```text
  █ THRESHOLDS

    http_req_duration
    ✓ 'p(95)<300' p(95)=42ms

    http_req_failed
    ✓ 'rate<0.01' rate=0.00%


  █ TOTAL RESULTS

    checks_total.......: 300     9.689192/s
    checks_succeeded...: 100.00% 300 out of 300
    checks_failed......: 0.00%   0 out of 300

    ✓ POST /orders retornou 201
    ✓ GET /orders/:id retornou 200

    HTTP
    http_req_duration..............: avg=14.11ms min=5.74ms med=9.1ms max=137.84ms p(90)=21.68ms p(95)=42ms
      { expected_response:true }...: avg=14.11ms min=5.74ms med=9.1ms max=137.84ms p(90)=21.68ms p(95)=42ms
    http_req_failed................: 0.00%  0 out of 300
    http_reqs......................: 300    9.689192/s

    EXECUTION
    iteration_duration.............: avg=1.03s   min=1.01s  med=1.02s max=1.19s    p(90)=1.04s   p(95)=1.08s
    iterations.....................: 150    4.844596/s
    vus............................: 5      min=5        max=5
    vus_max........................: 5      min=5        max=5

    NETWORK
    data_received..................: 154 kB 5.0 kB/s
    data_sent......................: 53 kB  1.7 kB/s



running (0m31.0s), 0/5 VUs, 150 complete and 0 interrupted iterations
default ✓ [ 100% ] 5 VUs  30s
```

## Análise

O SLO foi cumprido: o p95 ficou em 42 ms (meta de 300 ms) e não houve nenhuma requisição com erro.

O teste exercitou apenas `POST /orders` e `GET /orders/:id`. A rota de listagem (`GET /orders`) **não foi medida**, então não dá para afirmar nada sobre ela com estes números. O máximo de 137 ms, bem acima da média, pode ser efeito das primeiras requisições (conexões novas com o banco), mas isso é uma hipótese não verificada.

Paginação (`limit`/`offset`) e índice em `created_at` já existem na implementação. Próximos passos, se a carga crescesse: medir a listagem com muitos pedidos e aumentar o número de usuários virtuais para achar o ponto em que o p95 se aproxima de 300 ms.
