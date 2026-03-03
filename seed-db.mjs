/**
 * Script para popular o banco de dados com dados de exemplo
 * Uso: node seed-db.mjs
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL não está definida");
  process.exit(1);
}

// Parse database URL
const url = new URL(DATABASE_URL);
const config = {
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  port: url.port || 3306,
  ssl: {},
};

async function seed() {
  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log("✓ Conectado ao banco de dados");

    // Dados de exemplo
    const ownerOpenId = process.env.OWNER_OPEN_ID || "test-owner";
    const ownerName = process.env.OWNER_NAME || "Test User";

    // 1. Criar usuário (se não existir)
    console.log("\n📝 Criando usuário...");
    await connection.execute(
      `INSERT IGNORE INTO users (openId, name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [ownerOpenId, ownerName, `${ownerName.toLowerCase().replace(/\s+/g, ".")}@example.com`, "manus", "admin"]
    );
    console.log("✓ Usuário criado/verificado");

    // 2. Obter ID do usuário
    const [users] = await connection.execute(
      "SELECT id FROM users WHERE openId = ? LIMIT 1",
      [ownerOpenId]
    );

    if (users.length === 0) {
      throw new Error("Usuário não encontrado após criação");
    }

    const userId = users[0].id;
    console.log(`✓ ID do usuário: ${userId}`);

    // 3. Criar empresa de exemplo
    console.log("\n🏢 Criando empresa de exemplo...");
    const [companyResult] = await connection.execute(
      `INSERT INTO companies (userId, name, description, createdAt, updatedAt)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [userId, "Empresa Exemplo", "Empresa de exemplo para demonstração do sistema"]
    );

    const companyId = companyResult.insertId;
    console.log(`✓ Empresa criada com ID: ${companyId}`);

    // 4. Criar relatório com dados de fevereiro
    console.log("\n📊 Criando relatório de fevereiro...");
    const [reportResult] = await connection.execute(
      `INSERT INTO reports (companyId, userId, title, slug, description, startDate, endDate, isPublished, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        companyId,
        userId,
        "Campanha Fevereiro 2026",
        "campanha-fevereiro-2026-demo",
        "Relatório de performance das campanhas Meta de fevereiro de 2026",
        "2026-02-01",
        "2026-02-28",
        "published",
      ]
    );

    const reportId = reportResult.insertId;
    console.log(`✓ Relatório criado com ID: ${reportId}`);

    // 5. Criar métricas do relatório
    console.log("\n📈 Criando métricas do relatório...");

    // Cálculos de CPM e CTR
    const totalSpent = 1935.02;
    const totalImpressions = 137870;
    const totalClicks = 2125;
    const cpm = (totalSpent / totalImpressions) * 1000; // 14.04
    const ctr = (totalClicks / totalImpressions) * 100; // 1.54

    await connection.execute(
      `INSERT INTO reportMetrics (
        reportId,
        instagramReach,
        totalReach,
        totalImpressions,
        instagramProfileVisits,
        newInstagramFollowers,
        messagesInitiated,
        totalSpent,
        totalClicks,
        costPerClick,
        videoRetentionRate,
        profileVisitsThroughCampaigns,
        costPerProfileVisit,
        cpm,
        ctr,
        createdAt,
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        reportId,
        46800, // instagramReach
        63093, // totalReach
        137870, // totalImpressions
        2800, // instagramProfileVisits
        546, // newInstagramFollowers
        421, // messagesInitiated
        totalSpent.toString(), // totalSpent
        totalClicks, // totalClicks
        "1.53", // costPerClick (1935.02 / 2125)
        "17.48", // videoRetentionRate
        1050, // profileVisitsThroughCampaigns
        "0.28", // costPerProfileVisit (1935.02 / 6893 aprox)
        cpm.toFixed(2), // cpm
        ctr.toFixed(2), // ctr
      ]
    );

    console.log("✓ Métricas criadas com sucesso");

    console.log("\n✅ Banco de dados populado com sucesso!");
    console.log(`\n📊 Dados de exemplo criados:`);
    console.log(`   - Empresa: Empresa Exemplo`);
    console.log(`   - Relatório: Campanha Fevereiro 2026`);
    console.log(`   - Período: 01/02/2026 a 28/02/2026`);
    console.log(`   - Alcance: 63.093`);
    console.log(`   - Impressões: 137.870`);
    console.log(`   - Valor gasto: R$ 1.935,02`);
    console.log(`   - CPM: R$ ${cpm.toFixed(2)}`);
    console.log(`   - CTR: ${ctr.toFixed(2)}%`);
    console.log(`\n🔗 Link do relatório público será disponível após login`);
  } catch (error) {
    console.error("❌ Erro ao popular banco de dados:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seed();
