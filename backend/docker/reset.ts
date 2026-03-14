/**
 * Vext CRM v2.1 — dev:reset (cross-platform)
 * Destrói containers, volumes e migrations
 */

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';
import { createInterface } from 'readline';

const green  = (t: string) => `\x1b[32m${t}\x1b[0m`;
const yellow = (t: string) => `\x1b[33m${t}\x1b[0m`;
const red    = (t: string) => `\x1b[31m${t}\x1b[0m`;

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main(): Promise<void> {
  const backendDir = resolve(__dirname, '..');
  const composeFile = resolve(backendDir, 'docker', 'docker-compose.yml');
  const migrationsDir = resolve(backendDir, 'prisma', 'migrations');

  console.log('');
  console.log(yellow('⚠ Isso vai APAGAR todos os dados do banco local!'));

  const answer = await ask('Tem certeza? (s/N): ');

  if (answer !== 's') {
    console.log(green('Cancelado.'));
    process.exit(0);
  }

  console.log(yellow('Parando containers e removendo volumes...'));
  try {
    execSync(`docker compose -f "${composeFile}" down -v --remove-orphans`, {
      stdio: 'inherit',
      cwd: backendDir,
    });
  } catch {
    console.log(yellow('⚠ Containers podem já estar parados.'));
  }

  if (existsSync(migrationsDir)) {
    console.log(yellow('Removendo pasta de migrações...'));
    rmSync(migrationsDir, { recursive: true, force: true });
  }

  console.log('');
  console.log(green('✅ Ambiente limpo! Execute "npm run dev:init" para recomeçar.'));
  console.log('');
}

main().catch((err) => {
  console.error(red('❌ Erro:'), err);
  process.exit(1);
});
