import jetEnv, { num, str } from 'jet-env';
import { env } from 'node:process';
import tspo from 'tspo';

/******************************************************************************
                                 Constants
******************************************************************************/

// NOTE: These need to match the names of your ".env" files
export const NodeEnvs = {
  DEV: 'development',
  TEST: 'test',
  PRODUCTION: 'production',
} as const;

/******************************************************************************
                                 Setup
******************************************************************************/

const EnvVars = jetEnv({
  NodeEnv: (v) => tspo.isValue(NodeEnvs, v),
  Port: num,
  DatabaseUrl: str,
  RedisUrl: str,
  JwtSecret: str,
  FrontendUrl: str
}, {
  getValue: (name) => env[name] ?? (name === 'REDIS_URL' ? 'redis://127.0.0.1:6379' : undefined)
});

/******************************************************************************
                            Export default
******************************************************************************/

export default EnvVars;
