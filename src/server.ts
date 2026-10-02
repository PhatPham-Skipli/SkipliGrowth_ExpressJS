import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import type { IncomingMessage, ServerResponse } from 'http';

import Paths from '@src/common/constants/Paths';
import { IApiInfomation } from '@src/common/types/responses/api.response';
import BaseRouter from '@src/routes/apiRouter';

import EnvVars, { NodeEnvs } from './common/constants/env';
import { responseFormatter } from './common/middlewares/response.middleware';
import { IBeforeTransformResponseType } from './common/types/responses/api.response';
import { errorHandler } from './common/utils/error-handlers';

/******************************************************************************
                                Setup
******************************************************************************/

const app = express();

// **** Middleware **** //

// Basic middleware
app.use(
  cors({
    origin: '*',
  }),
);
app.use(
  express.json({
    verify: (req: IncomingMessage, _res: ServerResponse, buf: Buffer) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

// Swagger setup
const swaggerDocument = YAML.load(
  path.join(__dirname, '../swagger.yaml'),
) as Record<string, unknown>;
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'Skipli Growth API Docs',
  }),
);

// Raw OpenAPI JSON spec endpoint
app.get('/swagger.json', (_: Request, res: Response) => {
  const doc = YAML.load(
    path.join(__dirname, '../swagger.yaml'),
  ) as Record<string, unknown>;
  return res.json(doc);
});

// Show routes called in console during development
if (EnvVars.NodeEnv === NodeEnvs.DEV) {
  app.use(morgan('dev'));
}

// Security
if (EnvVars.NodeEnv === NodeEnvs.PRODUCTION) {
  app.use(helmet());
}

// Add response formatter middleware
app.use(responseFormatter);

// Add APIs, must be after middleware
app.use(Paths._, BaseRouter);

// Add error handler
app.use(errorHandler);

// **** FrontEnd Content **** //

// Set views directory (html)
const viewsDir = path.join(__dirname, 'views');
app.set('views', viewsDir);

// Set static directory (js and css).
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// Nav to users pg by default
app.get(
  '/',
  (_: Request, res: Response<IBeforeTransformResponseType<IApiInfomation>>) => {
    return res.json({
      type: 'response',
      data: {
        api: 'Skipli Growth',
        author: 'Luca Dev (Skipli)',
        github: 'https://github.com/PhatPham-Skipli/',
        version: '1.0.0',
      },
      message: 'Get API Infomation success',
    });
  },
);

// // Redirect to login if not logged in.
// app.get('/users', (_: Request, res: Response) => {
//   return res.sendFile('users.html', { root: viewsDir });
// });

/******************************************************************************
                                Export default
******************************************************************************/

export default app;
