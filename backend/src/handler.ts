/**
 * Vercel Serverless Entry Point
 * Exporta o app Express sem chamar listen() — o Vercel injeta as requisições.
 */
import app from './app';
export default app;
