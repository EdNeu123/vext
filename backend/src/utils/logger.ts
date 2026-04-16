import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Formato para desenvolvimento (legível no terminal)
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${stack || message}${metaStr}`;
  })
);

// Formato para produção (JSON estruturado)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: { service: 'vext-crm-api' },
  transports: [
    new winston.transports.Console(),
  ],
});

// Stream para integrar com Morgan (HTTP request logging)
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
