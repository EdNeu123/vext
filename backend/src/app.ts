import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { morganStream } from './utils/logger';
import { errorHandler, notFoundHandler } from './middlewares';
import routes from './routes';
import { swaggerSpec } from './docs/swagger';

const app = express();

// ==========================================
// SECURITY
// ==========================================

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = env.CORS_ORIGIN.split(',').map((o) => o.trim());
    // Permite requisições sem origin (ex: Postman, server-to-server) apenas em dev
    if (!origin && env.NODE_ENV !== 'production') return callback(null, true);
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' não permitida`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Força Vary: Origin para evitar cache poisoning em proxies
app.use((_req, res, next) => { res.setHeader('Vary', 'Origin'); next(); });

// Rate limiting
// Auth endpoints: limite restrito por IP (brute-force protection)
app.use('/api/auth/login',    rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Muitas tentativas de login. Tente em 15 minutos.' }, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { success: false, message: 'Muitas tentativas de registro.' }, standardHeaders: true, legacyHeaders: false }));

// Demais rotas: limite por userId (evita bloquear todos os users do mesmo IP)
app.use('/api', rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  keyGenerator: (req: any) => {
    const auth = req.headers.authorization as string | undefined;
    if (auth?.startsWith('Bearer ')) {
      try {
        const payload = JSON.parse(Buffer.from(auth.slice(7).split('.')[1], 'base64').toString());
        if (payload?.userId) return ;
      } catch {}
    }
    return req.ip ?? 'unknown';
  },
  skip: (req: any) => req.path.includes('/auth/login') || req.path.includes('/auth/register'),
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
