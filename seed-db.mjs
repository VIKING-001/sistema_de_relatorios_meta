/**
 * Script para popular o banco de dados com dados de exemplo (Versão PostgreSQL/Supabase)
 * Uso: node seed-db.mjs
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não está definida no arquivo .env");
  process.exit(1);
}

async function seed() {
  let pool;

  try {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    console.log("✓ Conectando ao banco de dados Supabase...");

    // 1. Criar usuário de teste (Admin)
    console.log("\n📝 Criando usuário de teste...");
    const ownerOpenId = process.env.OWNER_OPEN_ID || "local_seed_admin_2026";
    const ownerName = process.env.OWNER_NAME || "Viking Administrador";
    const email = "admin@viking.com.br";
    const passwordHash = "pbkdf2:salt:fakehash"; // hash simplificado para o exemplo

    const userResult = await pool.query(
      `INSERT INTO users ("openId", name, email, "passwordHash", "loginMethod", role)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("openId") DO UPDATE SET "lastSignedIn" = NOW()
       RETURNING id`,
      [ownerOpenId, ownerName, email, passwordHash, "email", "admin"]
    );

    const userId = userResult.rows[0].id;
    console.log(`✓ Usuário ID: ${userId}`);

    // 2. Criar empresa de exemplo
    console.log("\n🏢 Criando empresa de exemplo...");
    const companyResult = await pool.query(
      `INSERT INTO companies ("userId", name, description)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [userId, "Viking Digital Agency", "Agência parceira Meta com foco em performance"]
    );

    const companyId = companyResult.rows[0].id;
    console.log(`✓ Empresa criada com ID: ${companyId}`);

    // 3. Criar relatório de Fevereiro
    console.log("\n📊 Criando relatório de fevereiro...");
    const reportTitle = "Performance Meta - Fevereiro 2026";
    const slug = `meta-performance-fevereiro-2026-${Math.floor(Math.random() * 1000)}`;
    
    const reportResult = await pool.query(
      `INSERT INTO reports ("companyId", "userId", title, slug, description, "startDate", "endDate", "isPublished")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        companyId,
        userId,
        reportTitle,
        slug,
        "Análise mensal de performance das campanhas de tráfego pago.",
        "2026-02-01",
        "2026-02-28",
        "published"
      ]
    );

    const reportId = reportResult.rows[0].id;
    console.log(`✓ Relatório criado com ID: ${reportId}`);

    // 4. Criar métricas reais
    console.log("\n📈 Criando métricas...");
    const totalSpent = 1935.02;
    const totalImpressions = 137870;
    const totalClicks = 2125;
    const cpm = (totalSpent / totalImpressions) * 1000;
    const ctr = (totalClicks / totalImpressions) * 100;

    await pool.query(
      `INSERT INTO "reportMetrics" (
        "reportId", "instagramReach", "totalReach", "totalImpressions",
        "instagramProfileVisits", "newInstagramFollowers", "messagesInitiated",
        "totalSpent", "totalClicks", "costPerClick", "videoRetentionRate",
        "profileVisitsThroughCampaigns", "costPerProfileVisit", cpm, ctr
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        reportId,
        46800, 63093, totalImpressions,
        2800, 546, 421,
        totalSpent, totalClicks, (totalSpent / totalClicks).toFixed(2), 
        17.48, 1050, 0.28, cpm.toFixed(2), ctr.toFixed(2)
      ]
    );

    console.log("\n✅ Dados populados com sucesso no Supabase!");
    console.log(`\nRelatório disponível em seu ambiente local após o login.`);
  } catch (error) {
    console.error("❌ Erro ao popular banco de dados:", error);
    process.exit(1);
  } finally {
    if (pool) await pool.end();
  }
}

seed();

