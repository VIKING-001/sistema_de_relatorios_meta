#!/usr/bin/env node

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carregar variáveis de ambiente
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Erro: DATABASE_URL não configurada!');
  console.error('Adicione a variável DATABASE_URL no seu arquivo .env');
  process.exit(1);
}

async function setupDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔄 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Ler o arquivo de migração
    const migrationPath = resolve(__dirname, '../drizzle/migrations/add_ad_sales_tracking.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('\n📦 Executando migração do banco de dados...');

    // Executar o SQL
    await client.query(migrationSQL);

    console.log('✅ Migração executada com sucesso!');
    console.log('\n📊 Tabelas criadas:');
    console.log('  • metaCampaigns - Campanhas do Meta Ads');
    console.log('  • metaAdsets - Conjuntos de Anúncios');
    console.log('  • metaAds - Anúncios');
    console.log('  • adMetrics - Métricas de Anúncios');
    console.log('  • adSales - Rastreamento de Vendas por Anúncio');

    console.log('\n🎉 Setup do banco de dados completo!');
    console.log('Você já pode usar o sistema normalmente.');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  As tabelas já existem no banco de dados.');
      console.log('Nenhuma ação necessária.');
    } else {
      console.error('❌ Erro ao executar migração:');
      console.error(error.message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

setupDatabase();
