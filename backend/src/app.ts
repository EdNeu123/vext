import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { morganStream } from './config/logger';
import { errorHandler, notFoundHandler } from './middlewares';
import routes from './routes';
import { swaggerSpec } from './docs/swagger';

const app = express();

// ==========================================
// SECURITY
// ==========================================

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
app.use('/api', rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: { success: false, message: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// ==========================================
// PARSING
// ==========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// LOGGING (Winston via Morgan)
// ==========================================

if (env.NODE_ENV !== 'test') {
  app.use(morgan(
    env.NODE_ENV === 'development' ? 'dev' : ':method :url :status :res[content-length] - :response-time ms',
    { stream: morganStream }
  ));
}

// ==========================================
// SWAGGER
// ==========================================

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Vext CRM API Docs',
}));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.1.0' });
});

// ==========================================
// ROUTES
// ==========================================

app.use('/api', routes);

// ==========================================
// ERROR HANDLING
// ==========================================

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
