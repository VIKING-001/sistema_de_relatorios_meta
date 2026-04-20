/**
 * analytics.ts
 * Análise de métricas de campanhas Meta — dois modos:
 *   1. analyzeMetrics()       → análise neutra para o relatório do cliente
 *   2. strategicDiagnosis()   → diagnóstico estratégico para o admin (olho clínico)
 */

// ─── Tipos ─────────────────────────────────────────────────────────────────────

export interface MetricsAnalysis {
  ctr: {
    value: number;
    status: "excelente" | "bom" | "aceitavel" | "ruim";
    benchmark: number;
    insight: string;
    recomendacao: string;
  };
  cpm: {
    value: number;
    status: "excelente" | "bom" | "aceitavel" | "ruim";
    benchmark: number;
    insight: string;
    recomendacao: string;
  };
  alcance: {
    value: number;
    impressoes: number;
    frequencia: number;
    status: "excelente" | "bom" | "aceitavel" | "ruim";
    insight: string;
    recomendacao: string;
  };
  engajamento: {
    seguidores: number;
    mensagens: number;
    visitasProfile: number;
    status: "excelente" | "bom" | "aceitavel" | "ruim";
    insight: string;
    recomendacao: string;
  };
  video: {
    retencao: number;
    status: "excelente" | "bom" | "aceitavel" | "ruim";
    insight: string;
    recomendacao: string;
  };
  investimento: {
    gasto: number;
    custoPorClique: number;
    custoPorVisita: number;
    roi: number;
    status: "excelente" | "bom" | "aceitavel" | "ruim";
    insight: string;
    recomendacao: string;
  };
  resumoGeral: {
    pontosFortesCount: number;
    pontosFortesTexto: string[];
    pontosFracosCount: number;
    pontosFracosTexto: string[];
    recomendacaoPrincipal: string;
  };
}

export type Urgencia = "critico" | "atencao" | "ok" | "destaque";

export interface AcaoEstrategica {
  area: string;
  urgencia: Urgencia;
  titulo: string;
  diagnostico: string;
  acoes: string[];
}

export interface DiagnosticoEstrategico {
  score: number; // 0–100
  scoreLabel: string;
  alertasCriticos: string[];
  acoesPrioritarias: AcaoEstrategica[];
  quickWins: string[];
  resumoExecutivo: string;
}

// ─── Benchmarks ────────────────────────────────────────────────────────────────

const B = {
  ctr: 1.5,
  cpm: 12,
  frequencia: 2.5,
  videoRetencao: 20,
  cpc: 1.5,
  cpv: 0.35,
  cpm_alto: 18,
  cpm_critico: 25,
};

// ─── Tipo de entrada compartilhado ─────────────────────────────────────────────

export interface MetricasEntrada {
  ctr: number;
  cpm: number;
  totalReach: number;
  totalImpressions: number;
  totalSpent: number;
  totalClicks: number;
  costPerClick: number;
  videoRetentionRate: number;
  newInstagramFollowers: number;
  messagesInitiated: number;
  instagramProfileVisits: number;
  costPerProfileVisit: number;
  purchases?: number;
  purchaseValue?: number;
  costPerPurchase?: number;
  costPerMessage?: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. ANÁLISE NEUTRA — para o relatório do cliente
// ══════════════════════════════════════════════════════════════════════════════

export function analyzeMetrics(metrics: MetricasEntrada): MetricsAnalysis {
  const frequencia = metrics.totalImpressions / Math.max(metrics.totalReach, 1);
  return {
    ctr: analyzeCTR(metrics.ctr),
    cpm: analyzeCPM(metrics.cpm),
    alcance: analyzeAlcance(metrics.totalReach, metrics.totalImpressions, frequencia),
    engajamento: analyzeEngajamento(
      metrics.newInstagramFollowers,
      metrics.messagesInitiated,
      metrics.instagramProfileVisits
    ),
    video: analyzeVideo(metrics.videoRetentionRate),
    investimento: analyzeInvestimento(
      metrics.totalSpent,
      metrics.costPerClick,
      metrics.costPerProfileVisit,
      metrics.totalClicks,
      metrics.totalReach
    ),
    resumoGeral: generateResumo(metrics),
  };
}

function analyzeCTR(ctr: number) {
  if (ctr >= 2.5)
    return { value: ctr, status: "excelente" as const, benchmark: B.ctr, insight: `Taxa de cliques de ${ctr.toFixed(2)}% está acima da média — seus anúncios estão gerando grande interesse.`, recomendacao: "Mantenha a estratégia criativa atual." };
  if (ctr >= 1.5)
    return { value: ctr, status: "bom" as const, benchmark: B.ctr, insight: `Taxa de cliques de ${ctr.toFixed(2)}% está dentro da média esperada.`, recomendacao: "Teste variações de criativo para melhorar ainda mais." };
  if (ctr >= 0.8)
    return { value: ctr, status: "aceitavel" as const, benchmark: B.ctr, insight: `Taxa de cliques de ${ctr.toFixed(2)}% está abaixo da média.`, recomendacao: "Revise o copy do anúncio, imagens e público-alvo." };
  return { value: ctr, status: "ruim" as const, benchmark: B.ctr, insight: `Taxa de cliques de ${ctr.toFixed(2)}% está significativamente abaixo da média.`, recomendacao: "Revise o público-alvo, criativo e clareza da oferta." };
}

function analyzeCPM(cpm: number) {
  if (cpm <= 8)
    return { value: cpm, status: "excelente" as const, benchmark: B.cpm, insight: `CPM de R$ ${cpm.toFixed(2)} muito abaixo da média — ótimo custo de impressão.`, recomendacao: "Excelente eficiência. Considere aumentar o orçamento." };
  if (cpm <= 12)
    return { value: cpm, status: "bom" as const, benchmark: B.cpm, insight: `CPM de R$ ${cpm.toFixed(2)} dentro da faixa esperada.`, recomendacao: "Bom custo-benefício. Monitore regularmente." };
  if (cpm <= 18)
    return { value: cpm, status: "aceitavel" as const, benchmark: B.cpm, insight: `CPM de R$ ${cpm.toFixed(2)} acima da média, mas ainda aceitável.`, recomendacao: "Otimize o público-alvo para reduzir custos." };
  return { value: cpm, status: "ruim" as const, benchmark: B.cpm, insight: `CPM de R$ ${cpm.toFixed(2)} muito alto — pagando caro por impressões.`, recomendacao: "Revise segmentação. Teste lookalike audiences." };
}

function analyzeAlcance(reach: number, impressions: number, frequencia: number) {
  if (frequencia <= 1.5)
    return { value: reach, impressoes: impressions, frequencia, status: "excelente" as const, insight: `${reach.toLocaleString("pt-BR")} pessoas alcançadas com frequência ideal de ${frequencia.toFixed(1)}x.`, recomendacao: "Ótima estratégia de alcance." };
  if (frequencia <= 2.5)
    return { value: reach, impressoes: impressions, frequencia, status: "bom" as const, insight: `Alcance de ${reach.toLocaleString("pt-BR")} com frequência equilibrada de ${frequencia.toFixed(1)}x.`, recomendacao: "Continue monitorando para não saturar o público." };
  if (frequencia <= 4)
    return { value: reach, impressoes: impressions, frequencia, status: "aceitavel" as const, insight: `Frequência de ${frequencia.toFixed(1)}x — o mesmo público está vendo o anúncio com mais frequência.`, recomendacao: "Risco de fadiga. Considere rotacionar criativos." };
  return { value: reach, impressoes: impressions, frequencia, status: "ruim" as const, insight: `Frequência muito alta (${frequencia.toFixed(1)}x) — público saturado.`, recomendacao: "Expanda o público-alvo ou pause a campanha." };
}

function analyzeEngajamento(seguidores: number, mensagens: number, visitas: number) {
  const total = seguidores + mensagens + visitas;
  if (total > 2000)
    return { seguidores, mensagens, visitasProfile: visitas, status: "excelente" as const, insight: `Excelente engajamento: ${seguidores} seguidores, ${mensagens} mensagens, ${visitas.toLocaleString("pt-BR")} visitas.`, recomendacao: "Responda rapidamente às mensagens para converter leads." };
  if (total > 1000)
    return { seguidores, mensagens, visitasProfile: visitas, status: "bom" as const, insight: `Bom engajamento: ${seguidores} seguidores, ${mensagens} mensagens, ${visitas.toLocaleString("pt-BR")} visitas.`, recomendacao: "Mantenha a qualidade do conteúdo." };
  if (total > 500)
    return { seguidores, mensagens, visitasProfile: visitas, status: "aceitavel" as const, insight: `Engajamento moderado: ${total.toLocaleString("pt-BR")} interações totais.`, recomendacao: "Melhore a call-to-action." };
  return { seguidores, mensagens, visitasProfile: visitas, status: "ruim" as const, insight: `Engajamento baixo com apenas ${total} interações totais.`, recomendacao: "Revise sua proposta de valor e CTA." };
}

function analyzeVideo(retencao: number) {
  if (retencao >= 25)
    return { retencao, status: "excelente" as const, insight: `Retenção de ${retencao.toFixed(1)}% excelente — vídeo mantém atenção do público.`, recomendacao: "Continue produzindo vídeos nesse estilo." };
  if (retencao >= 15)
    return { retencao, status: "bom" as const, insight: `Retenção de ${retencao.toFixed(1)}% acima da média.`, recomendacao: "Teste variações de comprimento e estilo." };
  if (retencao >= 8)
    return { retencao, status: "aceitavel" as const, insight: `Retenção de ${retencao.toFixed(1)}% aceitável, com espaço para melhorias.`, recomendacao: "Melhore os primeiros 3 segundos do vídeo." };
  return { retencao, status: "ruim" as const, insight: `Retenção de ${retencao.toFixed(1)}% muito baixa — público abandona o vídeo rapidamente.`, recomendacao: "Revise completamente o vídeo. Comece com um hook forte." };
}

function analyzeInvestimento(gasto: number, cpc: number, cpv: number, cliques: number, alcance: number) {
  const roi = (alcance * 0.02) / Math.max(gasto, 1);
  if (cpc <= 1.0 && cpv <= 0.25)
    return { gasto, custoPorClique: cpc, custoPorVisita: cpv, roi, status: "excelente" as const, insight: `Custos muito eficientes: R$ ${cpc.toFixed(2)}/clique e R$ ${cpv.toFixed(2)}/visita.`, recomendacao: "Excelente eficiência. Considere aumentar o orçamento." };
  if (cpc <= 1.5 && cpv <= 0.35)
    return { gasto, custoPorClique: cpc, custoPorVisita: cpv, roi, status: "bom" as const, insight: `Custos dentro da faixa esperada: R$ ${cpc.toFixed(2)}/clique e R$ ${cpv.toFixed(2)}/visita.`, recomendacao: "Bom custo-benefício. Monitore regularmente." };
  if (cpc <= 2.0 && cpv <= 0.5)
    return { gasto, custoPorClique: cpc, custoPorVisita: cpv, roi, status: "aceitavel" as const, insight: `Custos acima da média: R$ ${cpc.toFixed(2)}/clique e R$ ${cpv.toFixed(2)}/visita.`, recomendacao: "Otimize público-alvo e estratégia de licitação." };
  return { gasto, custoPorClique: cpc, custoPorVisita: cpv, roi, status: "ruim" as const, insight: `Custos muito altos: R$ ${cpc.toFixed(2)}/clique e R$ ${cpv.toFixed(2)}/visita.`, recomendacao: "Revise segmentação e pause campanhas de baixo desempenho." };
}

function generateResumo(m: MetricasEntrada) {
  const pontosFortesTexto: string[] = [];
  const pontosFracosTexto: string[] = [];
  if (m.ctr >= 1.5) pontosFortesTexto.push("Taxa de cliques acima da média");
  if (m.cpm <= 12) pontosFortesTexto.push("Custo por impressão eficiente");
  if (m.videoRetentionRate >= 15) pontosFortesTexto.push("Boa retenção de vídeo");
  if (m.newInstagramFollowers > 500) pontosFortesTexto.push("Crescimento significativo de seguidores");
  if (m.costPerClick <= 1.5) pontosFortesTexto.push("Custo por clique competitivo");
  if ((m.purchases ?? 0) > 0) pontosFortesTexto.push("Conversões registradas no período");
  if (m.ctr < 0.8) pontosFracosTexto.push("Taxa de cliques abaixo da média");
  if (m.cpm > 18) pontosFracosTexto.push("Custo por impressão muito alto");
  if (m.videoRetentionRate < 8) pontosFracosTexto.push("Retenção de vídeo baixa");
  if (m.messagesInitiated < 100) pontosFracosTexto.push("Poucas mensagens iniciadas");
  if (m.costPerProfileVisit > 0.5) pontosFracosTexto.push("Custo por visita ao perfil elevado");
  const recomendacaoPrincipal =
    pontosFortesTexto.length > pontosFracosTexto.length
      ? "Sua campanha está performando bem. Continue com a estratégia atual e teste incrementos para melhorar ainda mais."
      : "Há oportunidades significativas de melhoria. Revise a segmentação de público e teste novos criativos.";
  return { pontosFortesCount: pontosFortesTexto.length, pontosFortesTexto, pontosFracosCount: pontosFracosTexto.length, pontosFracosTexto, recomendacaoPrincipal };
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. DIAGNÓSTICO ESTRATÉGICO — exclusivo para o admin
// ══════════════════════════════════════════════════════════════════════════════

export function strategicDiagnosis(m: MetricasEntrada): DiagnosticoEstrategico {
  const frequencia = m.totalImpressions / Math.max(m.totalReach, 1);
  const acoes: AcaoEstrategica[] = [];
  const alertasCriticos: string[] = [];
  const quickWins: string[] = [];
  let pontosPositivos = 0;
  let pontosCriticos = 0;

  // ── CTR ────────────────────────────────────────────────────────────────────
  if (m.ctr < 0.5) {
    pontosCriticos += 2;
    alertasCriticos.push(`CTR crítico: ${m.ctr.toFixed(2)}% — anúncio não está chamando atenção.`);
    acoes.push({
      area: "Criativo",
      urgencia: "critico",
      titulo: `CTR de ${m.ctr.toFixed(2)}% — criativo morto`,
      diagnostico: `Taxa de cliques ${((B.ctr / Math.max(m.ctr, 0.01)) * 100 - 100).toFixed(0)}% abaixo do benchmark. O público está ignorando o anúncio. Isso queima verba sem resultado.`,
      acoes: [
        "Troque imediatamente o criativo principal — use imagem de pessoa real ou produto em uso",
        "Reescreva o copy: primeiro 3 palavras devem gerar curiosidade ou dor",
        "Teste headline em formato de pergunta: 'Você ainda está...'",
        "Reduza o público-alvo em 50% — pode estar muito amplo",
        "Compare com criativos de campanhas anteriores que tiveram CTR > 1%",
      ],
    });
  } else if (m.ctr < 0.8) {
    pontosCriticos++;
    acoes.push({
      area: "Criativo",
      urgencia: "atencao",
      titulo: `CTR de ${m.ctr.toFixed(2)}% — melhorar copy e visual`,
      diagnostico: `CTR abaixo do benchmark de ${B.ctr}%. O anúncio está rodando mas sem convencer. Ajustes no criativo podem dobrar os cliques sem aumentar o investimento.`,
      acoes: [
        "Teste uma variação do criativo com foco diferente (benefício vs. prova social)",
        "Adicione elementos de urgência no copy: 'Vagas limitadas', 'Só até sexta'",
        "Experimente o formato carrossel se estiver usando imagem única",
        "Revise a segmentação — o público pode não ser o ideal",
      ],
    });
  } else if (m.ctr >= 2.5) {
    pontosPositivos++;
    quickWins.push(`CTR de ${m.ctr.toFixed(2)}% está excelente — escale este criativo com mais orçamento`);
  } else {
    pontosPositivos++;
    quickWins.push(`CTR de ${m.ctr.toFixed(2)}% adequado — pequenos testes de copy podem otimizar mais`);
  }

  // ── CPM ────────────────────────────────────────────────────────────────────
  if (m.cpm > B.cpm_critico) {
    pontosCriticos += 2;
    alertasCriticos.push(`CPM de R$ ${m.cpm.toFixed(2)} — custo altíssimo, verba sendo queimada por impressão.`);
    acoes.push({
      area: "Segmentação / Leilão",
      urgencia: "critico",
      titulo: `CPM R$ ${m.cpm.toFixed(2)} — leilão desfavorável`,
      diagnostico: `CPM ${((m.cpm / B.cpm) * 100 - 100).toFixed(0)}% acima do benchmark. Você está competindo em leilão caro demais. A cada R$ 1.000 investidos, você recebe muito menos alcance do que deveria.`,
      acoes: [
        "Expanda o público-alvo — públicos menores (<100k) encarecem o leilão",
        "Teste exibição em horários diferentes: madrugada (01h–06h) pode ser 40% mais barato",
        "Mude o posicionamento: inclua Audience Network e Stories além do Feed",
        "Reduza o orçamento diário e deixe o Meta otimizar por mais dias antes de escalar",
        "Verifique sobreposição de públicos entre campanhas ativas — pode estar concorrendo com você mesmo",
      ],
    });
  } else if (m.cpm > B.cpm_alto) {
    pontosCriticos++;
    acoes.push({
      area: "Segmentação / Leilão",
      urgencia: "atencao",
      titulo: `CPM de R$ ${m.cpm.toFixed(2)} — acima do ideal`,
      diagnostico: `CPM elevado indica competição alta no leilão ou público muito nichado. Há margem para reduzir custos.`,
      acoes: [
        "Teste públicos lookalike (1-3%) a partir da base de clientes",
        "Revise interesses: remova os mais disputados e adicione interesses correlatos menos saturados",
        "Ative campanhas em mais posicionamentos automáticos",
      ],
    });
  } else if (m.cpm <= 8) {
    pontosPositivos++;
    quickWins.push(`CPM de R$ ${m.cpm.toFixed(2)} excelente — aproveite escalando o orçamento desta campanha`);
  } else {
    pontosPositivos++;
  }

  // ── Frequência ─────────────────────────────────────────────────────────────
  if (frequencia > 4.5) {
    pontosCriticos += 2;
    alertasCriticos.push(`Frequência ${frequencia.toFixed(1)}x — público saturado, anúncio perdendo efetividade.`);
    acoes.push({
      area: "Público / Alcance",
      urgencia: "critico",
      titulo: `Frequência ${frequencia.toFixed(1)}x — público esgotado`,
      diagnostico: `O mesmo público está vendo o anúncio ~${frequencia.toFixed(0)} vezes. Acima de 3x a efetividade cai drasticamente e o CPC sobe. Isso é verba desperdiçada em quem já decidiu não clicar.`,
      acoes: [
        "Expanda o público-alvo imediatamente — adicione novos interesses ou aumente a faixa etária",
        "Crie um lookalike audience de 3-5% para alcançar novas pessoas",
        "Rotacione os criativos — troque pelo menos 2 das artes ativas",
        "Considere pausar a campanha por 7-10 dias para 'refrescar' o público",
        "Ative exclusão de quem já clicou para não exibir para o mesmo perfil",
      ],
    });
  } else if (frequencia > 3) {
    pontosCriticos++;
    acoes.push({
      area: "Público / Alcance",
      urgencia: "atencao",
      titulo: `Frequência ${frequencia.toFixed(1)}x — risco de fadiga`,
      diagnostico: `Frequência chegando em zona de saturação. Se não otimizado, o CPM vai subir e o CTR vai cair nas próximas semanas.`,
      acoes: [
        "Adicione novos criativos ao conjunto de anúncios",
        "Expanda o público com novos interesses relacionados",
        "Considere um cap de frequência de 3x por semana nas configurações",
      ],
    });
  } else if (frequencia <= 1.5) {
    pontosPositivos++;
    quickWins.push(`Frequência de ${frequencia.toFixed(1)}x ideal — público fresco, bom para escalar`);
  }

  // ── Mensagens / Custo por Mensagem ─────────────────────────────────────────
  const cpMsg = m.costPerMessage ?? 0;
  if (m.messagesInitiated > 0) {
    if (cpMsg > 15) {
      pontosCriticos++;
      alertasCriticos.push(`Custo por mensagem R$ ${cpMsg.toFixed(2)} — muito alto para o objetivo de conversa.`);
      acoes.push({
        area: "Conversão / Mensagens",
        urgencia: "critico",
        titulo: `R$ ${cpMsg.toFixed(2)} por mensagem — ineficiente`,
        diagnostico: `Cada mensagem está custando R$ ${cpMsg.toFixed(2)}. Para negócios com ticket médio abaixo de R$ 500, isso pode comprometer o ROI. A campanha precisa de otimização de conversão.`,
        acoes: [
          "Revise o botão de CTA — 'Enviar Mensagem' performa melhor que 'Saiba Mais' para conversas",
          "Adicione no criativo um benefício claro de entrar em contato ('Resposta em até 2h')",
          "Teste Landing Page com chat integrado ao invés de link direto",
          "Segmente para públicos de maior intenção: remarketing de visitantes do site ou engajamento no perfil",
          "Adicione depoimentos em vídeo no criativo — aumenta conversão para mensagem",
        ],
      });
    } else if (cpMsg > 8) {
      acoes.push({
        area: "Conversão / Mensagens",
        urgencia: "atencao",
        titulo: `R$ ${cpMsg.toFixed(2)} por mensagem — pode melhorar`,
        diagnostico: `Custo por mensagem dentro do aceitável mas há espaço para otimização. Reduzir 30% é alcançável com ajustes de criativo.`,
        acoes: [
          "Teste variação do CTA com prova social ('Mais de 200 clientes atendidos')",
          "Experimente formato de vídeo curto com depoimento de cliente real",
          "Ative remarketing para quem visitou o perfil mas não enviou mensagem",
        ],
      });
    } else if (cpMsg <= 5 && cpMsg > 0) {
      pontosPositivos++;
      quickWins.push(`Custo por mensagem R$ ${cpMsg.toFixed(2)} excelente — escale esta campanha`);
    }
  }

  // ── Compras / ROAS ─────────────────────────────────────────────────────────
  const purchases = m.purchases ?? 0;
  const purchaseValue = m.purchaseValue ?? 0;
  const cpPurchase = m.costPerPurchase ?? 0;
  if (purchases > 0 && m.totalSpent > 0) {
    const roas = purchaseValue / m.totalSpent;
    if (roas < 1) {
      pontosCriticos += 2;
      alertasCriticos.push(`ROAS de ${roas.toFixed(2)}x — campanha está gastando mais do que gera em receita.`);
      acoes.push({
        area: "ROI / Conversões",
        urgencia: "critico",
        titulo: `ROAS ${roas.toFixed(2)}x — campanha no prejuízo`,
        diagnostico: `Para cada R$ 1 investido, gerou apenas R$ ${roas.toFixed(2)} em receita. A campanha está destruindo valor. Precisa de ação imediata ou pausa.`,
        acoes: [
          "Pause imediatamente conjuntos de anúncios com ROAS < 1",
          "Revise o público — segmente para compradores anteriores ou lookalike de compradores",
          "Aumente o ticket médio: teste upsell ou bundle na página de destino",
          "Reavalie o funil: a página de checkout pode ter gargalo de conversão",
          "Considere focar em campanhas de topo de funil para resgatar investimento no longo prazo",
        ],
      });
    } else if (roas < 2) {
      pontosCriticos++;
      acoes.push({
        area: "ROI / Conversões",
        urgencia: "atencao",
        titulo: `ROAS de ${roas.toFixed(2)}x — abaixo do ideal`,
        diagnostico: `ROAS positivo mas abaixo de 2x não costuma cobrir todos os custos operacionais. Meta é atingir 3x+ para campanhas de conversão sustentáveis.`,
        acoes: [
          "Otimize a página de destino — reduza campos no formulário e adicione provas sociais",
          "Teste públicos de remarketing com intenção mais alta",
          "Revise a oferta — adicione bônus, garantia ou condição especial",
        ],
      });
    } else if (roas >= 3) {
      pontosPositivos += 2;
      quickWins.push(`ROAS de ${roas.toFixed(2)}x excelente — DUPLIQUE o orçamento desta campanha agora`);
    } else {
      pontosPositivos++;
      quickWins.push(`ROAS de ${roas.toFixed(2)}x positivo — otimize para chegar em 3x+`);
    }
  }

  // ── Vídeo ──────────────────────────────────────────────────────────────────
  if (m.videoRetentionRate > 0) {
    if (m.videoRetentionRate < 8) {
      pontosCriticos++;
      acoes.push({
        area: "Conteúdo / Vídeo",
        urgencia: "critico",
        titulo: `Retenção de vídeo ${m.videoRetentionRate.toFixed(1)}% — hook fraco`,
        diagnostico: `8 em cada 10 pessoas abandonam o vídeo nos primeiros segundos. O hook (abertura) está falhando. Isso significa que o algorítmo do Meta penaliza o alcance deste criativo.`,
        acoes: [
          "Os primeiros 2 segundos precisam de impacto: comece com a solução ou o problema, não com o logo",
          "Adicione movimento imediato: zoom in, texto aparecendo, corte rápido",
          "Teste versão mais curta: se o vídeo tem 60s, corte para 15s",
          "Use legenda em todos os vídeos — 85% assistem sem som",
          "Formato vertical (9:16 Reels) costuma ter retenção 40% maior que horizontal",
        ],
      });
    } else if (m.videoRetentionRate >= 25) {
      pontosPositivos++;
      quickWins.push(`Retenção de vídeo ${m.videoRetentionRate.toFixed(1)}% — replique este estilo de criativo em outras campanhas`);
    }
  }

  // ── Visitas ao Perfil ──────────────────────────────────────────────────────
  if (m.instagramProfileVisits > 0 && m.costPerProfileVisit > 0.6) {
    acoes.push({
      area: "Perfil / Topo de Funil",
      urgencia: "atencao",
      titulo: `R$ ${m.costPerProfileVisit.toFixed(2)} por visita ao perfil`,
      diagnostico: `Custo de visita ao perfil acima do ideal indica que o anúncio está alcançando pessoas com baixo interesse. Perfil bem otimizado converte visitas em seguidores e mensagens.`,
      acoes: [
        "Verifique o perfil do Instagram: bio clara, destaque de stories atualizado, feed atrativo",
        "Adicione no copy do anúncio uma razão para visitar o perfil ('Veja nossos resultados no perfil')",
        "Ative campanha de engajamento de perfil em paralelo para custo menor",
      ],
    });
  } else if (m.instagramProfileVisits > 200 && m.costPerProfileVisit < 0.3) {
    pontosPositivos++;
    quickWins.push(`Custo por visita ao perfil R$ ${m.costPerProfileVisit.toFixed(2)} — excelente topo de funil`);
  }

  // ── Score final ────────────────────────────────────────────────────────────
  const totalMetricas = 6;
  const scoreBase = ((pontosPositivos / Math.max(pontosPositivos + pontosCriticos, 1)) * 100);
  const penalidade = alertasCriticos.length * 8;
  const score = Math.max(0, Math.min(100, Math.round(scoreBase - penalidade)));

  let scoreLabel = "";
  if (score >= 80) scoreLabel = "Excelente";
  else if (score >= 60) scoreLabel = "Bom";
  else if (score >= 40) scoreLabel = "Atenção";
  else if (score >= 20) scoreLabel = "Problemático";
  else scoreLabel = "Crítico";

  // Ordenar ações por urgência
  const ordemUrgencia: Record<Urgencia, number> = { critico: 0, atencao: 1, ok: 2, destaque: 3 };
  acoes.sort((a, b) => ordemUrgencia[a.urgencia] - ordemUrgencia[b.urgencia]);

  // Resumo executivo
  const resumoExecutivo =
    alertasCriticos.length > 0
      ? `${alertasCriticos.length} problema${alertasCriticos.length > 1 ? "s" : ""} crítico${alertasCriticos.length > 1 ? "s" : ""} identificado${alertasCriticos.length > 1 ? "s" : ""}. Ação imediata necessária para evitar desperdício de verba.`
      : quickWins.length >= 2
      ? `Campanha performando bem em ${pontosPositivos} área${pontosPositivos > 1 ? "s" : ""}. Oportunidades de escala identificadas.`
      : `Performance estável. Otimizações pontuais podem melhorar os resultados nas próximas semanas.`;

  return {
    score,
    scoreLabel,
    alertasCriticos,
    acoesPrioritarias: acoes,
    quickWins,
    resumoExecutivo,
  };
}
