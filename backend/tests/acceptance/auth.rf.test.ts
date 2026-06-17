/**
 * Testes de aceitação — Autenticação e Conta de Usuário.
 *
 * Cobre os Requisitos Funcionais (vault "Vext Requisitos"):
 *   RF-0001 Registro de Usuário
 *   RF-0002 Autenticação de Usuário
 *   RF-0003 Renovação de Token de Acesso
 *   RF-0004 Logout de Usuário
 *   RF-0007 Alteração do Próprio Perfil
 *
 * Cada `it` referencia o critério de aceitação que valida. DB mockado.
 */
import { describe, it, expect, vi } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';

// jwt usa prisma (refresh tokens) — deixamos passar pelo mock, mas trocamos a
// geração de access token por algo determinístico p/ asserção.
vi.mock('../../src/utils/jwt', () => ({
  generateAccessToken: vi.fn(() => 'access.jwt.token'),
  generateRefreshToken: vi.fn(async () => 'refresh-token-abc'),
  rotateRefreshToken: vi.fn(),
  revokeAllRefreshTokens: vi.fn(async () => undefined),
}));

import { authService } from '../../src/services/auth.service';
import * as hash from '../../src/utils/hash';
import * as jwt from '../../src/utils/jwt';

describe('RF-0001 — Registro de Usuário', () => {
  it('CA1/CA2: aceita nome/email/senha válidos e cria registro no banco', async () => {
    (prismaMock.user.findUnique as any).mockResolvedValue(null); // email livre
    (prismaMock.user.create as any).mockResolvedValue({
      id: 1, name: 'Edu', email: 'edu@x.com', password: 'hashed', role: 'seller',
    });
    (prismaMock.teamMember.findMany as any).mockResolvedValue([]);

    const result = await authService.register({ name: 'Edu', email: 'edu@x.com', password: 'senha123' } as any);

    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(result.user).toMatchObject({ id: 1, email: 'edu@x.com' });
    // senha nunca volta na resposta
    expect((result.user as any).password).toBeUndefined();
  });

  it('rejeita e-mail já cadastrado (409)', async () => {
    (prismaMock.user.findUnique as any).mockResolvedValue({ id: 9, email: 'edu@x.com' });
    await expect(
      authService.register({ name: 'Edu', email: 'edu@x.com', password: 'senha123' } as any),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('senha é armazenada com hash (nunca em texto puro)', async () => {
    const spy = vi.spyOn(hash, 'hashPassword');
    (prismaMock.user.findUnique as any).mockResolvedValue(null);
    (prismaMock.user.create as any).mockResolvedValue({ id: 2, name: 'A', email: 'a@x.com', password: 'h', role: 'seller' });
    (prismaMock.teamMember.findMany as any).mockResolvedValue([]);

    await authService.register({ name: 'A', email: 'a@x.com', password: 'segredo123' } as any);

    expect(spy).toHaveBeenCalledWith('segredo123');
    const createArg = (prismaMock.user.create as any).mock.calls[0][0];
    expect(createArg.data.password).not.toBe('segredo123'); // hasheada
  });
});

describe('RF-0002 — Autenticação de Usuário', () => {
  it('CA1: rejeita e-mail não cadastrado (401)', async () => {
    (prismaMock.user.findUnique as any).mockResolvedValue(null);
    await expect(authService.login({ email: 'x@x.com', password: '123456' } as any))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('CA2: rejeita senha incorreta (401)', async () => {
    (prismaMock.user.findUnique as any).mockResolvedValue({ id: 1, email: 'e@x.com', password: 'hash', isActive: true });
    vi.spyOn(hash, 'comparePassword').mockResolvedValue(false);
    await expect(authService.login({ email: 'e@x.com', password: 'errada' } as any))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('CA3: em sucesso, retorna access token e refresh token', async () => {
    (prismaMock.user.findUnique as any).mockResolvedValue({
      id: 1, email: 'e@x.com', name: 'Edu', password: 'hash', role: 'seller', isActive: true,
    });
    vi.spyOn(hash, 'comparePassword').mockResolvedValue(true);
    (prismaMock.user.update as any).mockResolvedValue({});
    (prismaMock.teamMember.findMany as any).mockResolvedValue([]);

    const result = await authService.login({ email: 'e@x.com', password: 'certa' } as any);

    expect(result.accessToken).toBe('access.jwt.token');
    expect(result.refreshToken).toBe('refresh-token-abc');
    expect((result.user as any).password).toBeUndefined();
  });

  it('bloqueia login de conta inativa (403)', async () => {
    (prismaMock.user.findUnique as any).mockResolvedValue({ id: 1, email: 'e@x.com', password: 'hash', isActive: false });
    await expect(authService.login({ email: 'e@x.com', password: 'x' } as any))
      .rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('RF-0003 — Renovação de Token de Acesso', () => {
  it('CA1: renova com refresh token válido (delega a rotateRefreshToken)', async () => {
    (jwt.rotateRefreshToken as any).mockResolvedValue({ accessToken: 'new.access', refreshToken: 'new.refresh' });
    const result = await authService.refreshToken('valid-token');
    expect(result).toEqual({ accessToken: 'new.access', refreshToken: 'new.refresh' });
  });

  it('CA2/CA3: token inválido/expirado → retorna null (exige nova autenticação)', async () => {
    (jwt.rotateRefreshToken as any).mockResolvedValue(null);
    const result = await authService.refreshToken('expired');
    expect(result).toBeNull();
  });
});

describe('RF-0004 — Logout de Usuário', () => {
  it('CA1: invalida os refresh tokens do usuário', async () => {
    await authService.logout(42);
    expect(jwt.revokeAllRefreshTokens).toHaveBeenCalledWith(42);
  });
});

describe('RF-0007 — Alteração do Próprio Perfil', () => {
  it('CA: e-mail NÃO é alterável por este endpoint (campo ignorado)', async () => {
    (prismaMock.user.update as any).mockResolvedValue({ id: 1, name: 'Novo', email: 'orig@x.com' });

    await authService.updateProfile(1, { name: 'Novo', email: 'hacker@x.com' } as any);

    const arg = (prismaMock.user.update as any).mock.calls[0][0];
    expect(arg.data).not.toHaveProperty('email'); // email descartado
    expect(arg.data.name).toBe('Novo');
  });

  it('CA: resposta não inclui o campo password (select sem password)', async () => {
    (prismaMock.user.update as any).mockResolvedValue({ id: 1, name: 'Novo' });
    await authService.updateProfile(1, { name: 'Novo' } as any);
    const arg = (prismaMock.user.update as any).mock.calls[0][0];
    expect(arg.select.password).toBeUndefined();
  });

  it('avatar só aceita URL HTTPS (rejeita http/javascript)', async () => {
    await expect(authService.updateProfile(1, { avatar: 'http://evil.com/x.png' } as any))
      .rejects.toThrow();
    await expect(authService.updateProfile(1, { avatar: 'javascript:alert(1)' } as any))
      .rejects.toThrow();
  });
});
