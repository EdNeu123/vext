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
// PROXY TRUST (Vercel / Cloud Run / qualquer reverse proxy)
// ==========================================
// Vercel injeta o IP real em X-Forwarded-For. Sem `trust proxy`,
// req.ip retorna o IP da edge (não do cliente) e o express-rate-limit v7+
// lança ERR_ERL_UNEXPECTED_X_FORWARDED_FOR dentro do keyGenerator → 500.
// O valor `1` significa: confiar em EXATAMENTE um hop (a edge da Vercel).
// NUNCA use `true` em produção — permitiria spoofing de X-Forwarded-For.
app.set('trust proxy', 1);

// ==========================================
// SECURITY
// ==========================================

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = env.CORS_ORIGIN.split(',').map((o) => o.trim());
    if (!origin && env.NODE_ENV !== 'production') return callback(null, true);
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' não permitida`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());
app.use((_req, res, next) => { res.setHeader('Vary', 'Origin'); next(); });

// ==========================================
// RATE LIMITING
// ==========================================

app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Muitas tentativas de login. Tente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use('/api/auth/register', rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Muitas tentativas de registro.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

/**
 * Extrai o userId do JWT sem verificar assinatura (apenas para rate-limit key).
 * Segurança: a autenticação real é feita pelo middleware `authenticate`.
 * IMPORTANTE: retorna SEMPRE uma string. Em express-rate-limit v7+,
 * retornar `undefined` lança ERR_ERL_KEY_GEN_UNDEFINED e vira 500.
 */
function rateLimitKey(req: express.Request): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      const token = auth.slice(7);
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        if (payload?.userId) return `user:${payload.userId}`;
      }
    } catch {
      // Payload malformado — cai no fallback de IP abaixo
    }
  }
  return `ip:${req.ip ?? 'unknown'}`;
}

app.use('/api', rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  keyGenerator: rateLimitKey,
  skip: (req) => req.path.includes('/auth/login') || req.path.includes('/auth/register'),
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
// LOGGING
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
