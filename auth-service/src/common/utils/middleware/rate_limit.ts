import type { NextFunction, Request, Response } from 'express';
import Redis from 'ioredis';
import logger from 'jet-logger';

import EnvVars from '@src/common/constants/env';
import { RouteError } from '../route-errors';

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 10;

const redis = new Redis(EnvVars.RedisUrl, {
    lazyConnect: true,
    enableOfflineQueue: false,
    autoResendUnfulfilledCommands: false,
    connectTimeout: 1_000,
    commandTimeout: 1_000,
});

redis.on('error', (error: Error) => logger.warn(`Login rate limiter Redis: ${error.message}`));

// Redis executes both operations atomically. Only the first attempt sets the TTL.
const REGISTER_ATTEMPT = `
local attempts = redis.call('INCR', KEYS[1])
if attempts == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return attempts
`;

export function startLoginRateLimit() {
    void redis.connect().catch((error: Error) => {
        logger.warn(`Could not connect the login rate limiter: ${error.message}`);
    });
}

export default async function loginRateLimit(req: Request, _res: Response, next: NextFunction) {
    if (!req.ip) {
        throw new RouteError(500, 'Error missing IP.');
    }

    let attempts: unknown;
    try {
        attempts = await redis.eval(REGISTER_ATTEMPT, 1, `auth:login:${req.ip}`, WINDOW_SECONDS);
    } catch {
        throw new RouteError(503, 'Login temporarily unavailable. Try again later.');
    }

    if (typeof attempts !== 'number') {
        throw new RouteError(503, 'Login temporarily unavailable. Try again later.');
    }
    if (attempts > MAX_ATTEMPTS) {
        throw new RouteError(429, 'Too many login attempts. Try again later.');
    }

    next();
}
