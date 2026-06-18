/**
 * Vext CRM v2.1 — dev:init (cross-platform)
 * Sobe Docker, espera PG, roda Prisma e Seed
 */

import { execSync } from 'child_process';
import { existsSync, copyFileSync } from 'fs';
import { resolve } from 'path';

// ── Cores (ANSI) ──────────────────────────────
const green  = (t: string) => `\x1b[32m${t}\x1b[0m`;
const yellow = (t: string) => `\x1b[33m${t}\x1b[0m`;
const cyan   = (t: string) => `\x1b[36m${t}\x1b[0m`;
const red    = (t: string) => `\x1b[31m${t}\x1b[0m`;

function run(cmd: string, label?: string): void {
  if (label) console.log(`  📦 ${label}...`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: resolve(__dirname, '..') });
  } catch {
    console.error(red(`❌ Falha ao executar: ${cmd}`));
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function checkCommand(cmd: string): boolean {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function isDockerRunning(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function isPgReady(): boolean {
  try {
    execSync('docker exec vext-postgres pg_isready -U vext -d vext_crm', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const backendDir = resolve(__dirname, '..');
  const composeFile = resolve(backendDir, 'docker', 'docker-compose.yml');
  const envFile = resolve(backendDir, '.env');
  const envExample = resolve(backendDir, '.env.example');

  console.log('');
  console.log(cyan('═══════════════════════════════════════════'));
  console.log(cyan('   🚀 Vext CRM — Setup do Ambiente Local   '));
  console.log(cyan('═══════════════════════════════════════════'));
  console.log('');

  // ── 1. Verificar Docker ──────────────────────
  console.log(yellow('[1/6]'), 'Verificando Docker...');
  if (!checkCommand('docker')) {
    console.error(red('❌ Docker não encontrado! Instale em: https://docs.docker.com/get-docker/'));
    process.exit(1);
  }
  if (!isDockerRunning()) {
    console.error(red('❌ Docker daemon não está rodando! Inicie o Docker Desktop.'));
    process.exit(1);
  }
  console.log(green('  ✔ Docker OK'));

  // ── 2. Verificar .env ────────────────────────
  console.log(yellow('[2/6]'), 'Verificando .env...');
  if (!existsSync(envFile)) {
    console.log(yellow('  ⚠ Arquivo .env não encontrado. Copiando .env.example → .env'));
    copyFileSync(envExample, envFile);
    console.log(green('  ✔ .env criado — revise as variáveis se necessário'));
  } else {
    console.log(green('  ✔ .env já existe'));
  }

  // ── 3. Subir containers ─────────────────────
  console.log(yellow('[3/6]'), 'Subindo containers Docker...');
  run(`docker compose -f "${composeFile}" up -d --remove-orphans`);
  console.log(green('  ✔ Containers iniciados'));

  // ── 4. Aguardar PostgreSQL ──────────────────
  console.log(yellow('[4/6]'), 'Aguardando PostgreSQL ficar pronto...');
  const maxRetries = 30;
  let ready = false;

  for (let i = 1; i <= maxRetries; i++) {
    if (isPgReady()) {
      ready = true;
      break;
    }
    process.stdout.write(`  ⏳ Tentativa ${i}/${maxRetries}...\r`);
    await sleep(2000);
  }

  if (!ready) {
    console.error(red('\n❌ PostgreSQL não ficou pronto em tempo hábil.'));
    console.error(red('   Execute: docker logs vext-postgres'));
    process.exit(1);
  }
  console.log(green('  ✔ PostgreSQL pronto na porta 5433'));

  // ── 5. Prisma ───────────────────────────────
  console.log(yellow('[5/6]'), 'Executando Prisma...');
  run('npx prisma generate', 'prisma generate');
  run('npx prisma migrate dev --name init', 'prisma migrate dev');
  console.log(green('  ✔ Migrações aplicadas'));

  // ── 6. Seed ─────────────────────────────────
  console.log(yellow('[6/6]'), 'Populando banco com dados iniciais...');
  run('npx tsx prisma/seed.ts', 'seed');

  console.log('');
  console.log(green('═══════════════════════════════════════════'));
  console.log(green('   ✅ Ambiente configurado com sucesso!     '));
  console.log(green('═══════════════════════════════════════════'));
  console.log('');
  console.log(`  ${cyan('PostgreSQL:')}  localhost:5433`);
  console.log(`  ${cyan('pgAdmin:')}     http://localhost:5050`);
  console.log(`  ${cyan('             Email: admin@vext.com.br')}`);
  console.log(`  ${cyan('             Senha: admin123')}`);
  console.log('');
  console.log(`  ${cyan('Próximo passo:')} npm run dev`);
  console.log('');
}

main().catch((err) => {
  console.error(red('❌ Erro inesperado:'), err);
  process.exit(1);
});
