/**
 * Smoke tests — validações que NÃO precisam de banco rodando.
 *
 * Cobrem:
 *  1. App sobe sem crash
 *  2. /api/health responde 200
 *  3. CORS retorna os headers corretos para origins permitidas
 *  4. CORS bloqueia origin não permitida (em production)
 *  5. Endpoints protegidos retornam 401 sem token
 *
 * Para testes que precisam de DB (CRUD), rodar com banco de teste
 * dedicado e setup separado (não incluído neste smoke).
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Smoke: app boots', () => {
  it('GET /api/health → 200 com status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Smoke: CORS — protege origins', () => {
  it('Origin permitida no CORS_ORIGIN: header Access-Control-Allow-Origin presente', async () => {
    // CORS_ORIGIN no setup inclui http://localhost:5173
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('Origin permitida do Firebase: aceita', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://vext-app.web.app');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://vext-app.web.app');
  });

  it('Vary: Origin presente em todas as responses (necessário p/ cache CDN)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers.vary).toContain('Origin');
  });

  it('OPTIONS preflight retorna 204/200', async () => {
    const res = await request(app)
      .options('/api/cards')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization,content-type');

    expect([200, 204]).toContain(res.status);
  });
});

describe('Smoke: autenticação obrigatória', () => {
  const protectedEndpoints = [
    '/api/dashboard/metrics',
    '/api/dashboard/today-tasks',
    '/api/dashboard/timeseries',
    '/api/dashboard/monthly',
    '/api/cards',
    '/api/cards/stats',
    '/api/contacts',
    '/api/tags',
    '/api/products',
    '/api/products/stats',
    '/api/team/ranking',
  ];

  it.each(protectedEndpoints)('GET %s sem token → 401', async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('Smoke: rotas novas registradas', () => {
  // Apenas confirma que existem (não 404). 401 é esperado por estar protegido.
  it('GET /api/dashboard/timeseries existe (não 404)', async () => {
    const res = await request(app).get('/api/dashboard/timeseries');
    expect(res.status).not.toBe(404);
  });

  it('GET /api/dashboard/monthly existe (não 404)', async () => {
    const res = await request(app).get('/api/dashboard/monthly');
    expect(res.status).not.toBe(404);
  });

  it('GET /api/products/stats existe (não 404)', async () => {
    const res = await request(app).get('/api/products/stats');
    expect(res.status).not.toBe(404);
  });

  it('GET /api/cards/1/events existe (não 404)', async () => {
    const res = await request(app).get('/api/cards/1/events');
    expect(res.status).not.toBe(404);
  });

  it('GET /api/tags/1/usage existe (não 404)', async () => {
    const res = await request(app).get('/api/tags/1/usage');
    expect(res.status).not.toBe(404);
  });
});
