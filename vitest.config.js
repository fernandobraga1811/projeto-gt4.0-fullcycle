import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.js'],
      // server.js (bootstrap) e o repositorio Postgres dependem de um banco real;
      // o contrato deles e coberto pelo repositorio em memoria usado nos testes.
      exclude: ['src/server.js', 'src/repositories/postgresOrderRepository.js'],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
});
