import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import logger from 'jet-logger';
import morgan from 'morgan';

import { APIPaths } from '@src/common/constants/Paths';
import loginRateLimit from '@src/common/utils/middleware/rate_limit';
import { RouteError } from '@src/common/utils/route-errors';
import BaseRouter from '@src/routes/apiRouter';

import EnvVars, { NodeEnvs } from './common/constants/env';
import DatabaseError from './common/types/DatabaseError';

/******************************************************************************
                                Setup
******************************************************************************/

const app = express();

// **** Middleware **** //

// Nginx is the single public proxy and replaces the forwarded client IP.
app.set('trust proxy', 1)

if (EnvVars.NodeEnv === NodeEnvs.PRODUCTION) {
  app.use(cors({
    origin: EnvVars.FrontendUrl,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
} else {
  app.use(cors());
}

// Show routes called in console during development
if (EnvVars.NodeEnv === NodeEnvs.DEV) {
  app.use(morgan('dev'));
}

// Security
if (EnvVars.NodeEnv === NodeEnvs.PRODUCTION) {
  app.use(helmet());
}

// Count every login POST that reaches the service, even if its body is invalid.
app.post(APIPaths.User.Login(), loginRateLimit);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(BaseRouter);

// Add error handler
app.use((err: Error, _: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  if (EnvVars.NodeEnv !== NodeEnvs.TEST.valueOf()) {
    logger.err(err, true);
  }
  if (err instanceof RouteError) {
    res.status(err.status).json({ error: err.message });
  }
  else if (err instanceof DatabaseError) {
    res.status(500).json({ error: 'Problem with our database'})
  }
  else {
    res.status(500).json({ error: 'An unknown error ocurred' })
  }
});

/******************************************************************************
                                Export default
******************************************************************************/

export default app;
