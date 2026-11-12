# ADR 0001: Repository para isolar a persistência

- Status: aceito
- Data: 2026-11-11

## Contexto

A API precisa gravar e consultar pedidos em Postgres. Queremos testar as regras de negócio e a API HTTP rapidamente, no CI, sem depender de um banco rodando, e manter a opção de trocar a tecnologia de armazenamento sem reescrever as regras.

## Alternativas consideradas

1. **Consultas SQL direto nas rotas/serviço.** Simples no começo, mas acopla regra de negócio a SQL e exige banco em todo teste.
2. **ORM (Prisma/TypeORM).** Reduz SQL escrito à mão, mas adiciona dependência, geração de código e curva de aprendizado para um domínio com uma única tabela. **Descartada.**
3. **Padrão Repository com contrato mínimo (`save`, `findById`, `list`).** Escolhida.

## Decisão

Adotar o padrão **Repository**: o `OrderService` recebe um repositório por injeção. Há duas implementações do mesmo contrato: `PostgresOrderRepository` (produção, via `pg`) e `MemoryOrderRepository` (testes).

## Consequências

- Testes de domínio, serviço e API rodam em milissegundos, sem banco, e o CI fica simples.
- Trocar o armazenamento exige só uma nova implementação do contrato.
- O repositório Postgres não é coberto pelos testes automatizados; é validado manualmente com `docker compose up` e pelo teste k6. Uma evolução possível é um teste de integração com Testcontainers.
- O SQL é escrito à mão, o que é aceitável para uma tabela.
