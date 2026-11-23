import logger from 'jet-logger';
import { sql } from 'drizzle-orm';

import EnvVars, { NodeEnvs } from './common/constants/env';
import { startLoginRateLimit } from './common/utils/middleware/rate_limit';
import db from './db/db';
import server from './server';

/******************************************************************************
                                Constants
******************************************************************************/

const SERVER_START_MESSAGE =
  'Express server started on port: ' + EnvVars.Port.toString();

/******************************************************************************
                                Functions
******************************************************************************/

// Cria a tabela de usuários se ela ainda não existir (mesma estrutura do src/db/schema.ts).
// Assim o serviço funciona com um banco novo ou com um que já tenha dados.
async function ensureSchema() {
  if (EnvVars.NodeEnv !== NodeEnvs.PRODUCTION) return;
  await db.transaction(async (tx) => {
    // Multiple replicas can start at once against a new database.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('auth-service:users-schema'))`);
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        name varchar NOT NULL,
        email varchar NOT NULL UNIQUE,
        password varchar NOT NULL,
        is_admin boolean NOT NULL DEFAULT false
      )
    `);
    await tx.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false
    `);
  });
}

/******************************************************************************
                                  Run
******************************************************************************/

startLoginRateLimit();
ensureSchema()
  .then(() => {
    server.listen(EnvVars.Port, (err) => {
      if (!!err) {
        logger.err(err.message);
      } else {
        logger.info(SERVER_START_MESSAGE);
      }
    });
  })
  .catch((err: Error) => {
    logger.err('Could not prepare the database: ' + err.message);
    process.exit(1);
  });
