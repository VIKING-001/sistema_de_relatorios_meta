#!/usr/bin/env node

import { Client } from 'pg';
import { readFileSync, existsSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function initProject() {
  log('\n╔════════════════════════════════════════╗', 'bright');
  log('║     Inicializando Sistema de Meta     ║', 'bright');
  log('╚════════════════════════════════════════╝\n', 'bright');

  try {
    // 1. Verificar se .env existe
    log('📋 Verificando configurações...', 'blue');
    const envPath = resolve(projectRoot, '.env');
    const envExamplePath = resolve(projectRoot, '.env.example');

    if (!existsSync(envPath)) {
      if (existsSync(envExamplePath)) {
        log('⚠️  Arquivo .env não encontrado. Criando a partir de .env.example...', 'yellow');
        copyFileSync(envExamplePath, envPath);
        log('✅ Arquivo .env criado. Certifique-se de configurar o DATABASE_URL', 'green');
      } else {
        log('❌ Arquivo .env não encontrado e .env.example também não!', 'red');
        process.exit(1);
      }
    } else {
      log('✅ Arquivo .env encontrado', 'green');
    }

    // 2. Carregar variáveis de ambiente
    dotenv.config({ path: envPath });
    dotenv.config({ path: resolve(projectRoot, '.env.local') });

    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
      log('❌ Erro: DATABASE_URL não configurada!', 'red');
      log('Configure a variável DATABASE_URL no arquivo .env', 'yellow');
      process.exit(1);
    }

    // 3. Conectar ao banco de dados
    log('\n🔄 Conectando ao banco de dados...', 'blue');
    const client = new Client({ connectionString: DATABASE_URL });

    await client.connect();
    log('✅ Conectado com sucesso', 'green');

    // 4. Executar migração
    log('\n📦 Executando migração do banco de dados...', 'blue');
    const migrationPath = resolve(projectRoot, 'drizzle/migrations/add_ad_sales_tracking.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    try {
      await client.query(migrationSQL);
      log('✅ Migração executada com sucesso!', 'green');
    } catch (err) {
      if (err.message.includes('already exists')) {
        log('ℹ️  As tabelas já existem no banco de dados', 'yellow');
      } else {
        throw err;
      }
    }

    await client.end();

    // 5. Resumo final
    log('\n╔════════════════════════════════════════╗', 'bright');
    log('║    ✅ Setup Completo com Sucesso!    ║', 'bright');
    log('╚════════════════════════════════════════╝\n', 'bright');

    log('📚 Próximos passos:', 'yellow');
    log('  1. npm run dev          - Inicie o servidor de desenvolvimento', 'yellow');
    log('  2. Abra http://localhost:5173 no navegador', 'yellow');
    log('  3. Configure suas credenciais do Meta Ads', 'yellow');
    log('  4. Use o botão "Sincronizar do Meta" para trazer campanhas', 'yellow');

    log('\n📊 Tabelas criadas:', 'blue');
    log('  • metaCampaigns     - Campanhas do Meta Ads', 'blue');
    log('  • metaAdsets        - Conjuntos de Anúncios', 'blue');
    log('  • metaAds           - Anúncios', 'blue');
    log('  • adMetrics         - Métricas de Anúncios (gastos, cliques, etc)', 'blue');
    log('  • adSales           - Rastreamento de Vendas por Anúncio', 'blue');

    log('\n🎉 Sistema pronto para usar!\n', 'green');

  } catch (error) {
    log(`\n❌ Erro durante inicialização: ${error.message}`, 'red');
    process.exit(1);
  }
}

initProject();
