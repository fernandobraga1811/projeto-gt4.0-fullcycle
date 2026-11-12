import pg from 'pg';
import { createApp } from './app.js';
import { createLogger } from './logger.js';
import { OrderService } from './services/orderService.js';
import { PostgresOrderRepository } from './repositories/postgresOrderRepository.js';

const port = Number(process.env.PORT ?? 3000);
const databaseUrl = process.env.DATABASE_URL;
const logger = createLogger(process.env.LOG_LEVEL ?? 'info');

if (!databaseUrl) {
  logger.fatal('DATABASE_URL não definida');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });
const repository = new PostgresOrderRepository(pool);
await repository.init();

const app = createApp({ service: new OrderService(repository), logger });
const server = app.listen(port, () => logger.info({ port }, 'API no ar'));

async function shutdown(signal) {
  logger.info({ signal }, 'encerrando');
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
