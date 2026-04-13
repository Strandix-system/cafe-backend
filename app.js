import 'express-async-errors';
import compression from 'compression';
import cors from 'cors';
import env from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import connectDB from './database/dbConnect.js';
import { getSwaggerUiOptions } from './docs/swagger-ui.options.js';
import { errorHandler, notFoundError } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { webhookRoutes } from './routes/webhookRoute.js';

env.config();

const app = express();

const swaggerSpec = (
  await import('./docs/swagger-output.json', {
    with: { type: 'json' },
  })
).default;

app.set('trust proxy', 1);

app.use((req, res, next) => {
  if (
    req.headers['x-forwarded-proto'] &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }

  next();
});

app.use(helmet());
app.use('/api', webhookRoutes);
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      'https://aeternis.in',
      'https://admin.aeternis.in',
      'https://portfolio.aeternis.in',
      'https://staging.d1o5djpa63pq8h.amplifyapp.com',
      'https://staging.d2kw487x9mccls.amplifyapp.com',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:8080',
      'http://localhost:8081',
    ],
    // origin: "*",
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
    ],
  }),
);
app.use(compression());

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, getSwaggerUiOptions()),
);

app.get('/', (req, res) => {
  res.status(200).send('OK');
});

app.use('/api', routes);

app.use(notFoundError);

app.use(errorHandler);

connectDB();

export default app;
