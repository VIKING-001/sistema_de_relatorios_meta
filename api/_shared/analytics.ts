/**
 * Utilitários para análise inteligente de métricas de campanhas Meta
 * Inclui benchmarks, insights e recomendações personalizadas
 */

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

/**
 * Benchmarks para campanhas Meta (baseado em dados de indústria)
 */
const BENCHMARKS = {
  ctr: 1.5, // % - Taxa de cliques média
  cpm: 12.0, // R$ - Custo por mil impressões
  frequencia: 2.0, // Número de vezes que o anúncio é mostrado
  videoRetencao: 20.0, // % - Retenção de vídeo
  custoPorClique: 1.5, // R$ - CPC médio
  custoPorVisita: 0.3, // R$ - Custo por visita ao perfil
};

/**
 * Analisa métricas de campanha Meta e gera insights
 */
export function analyzeMetrics(metrics: {
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
}): MetricsAnalysis {
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

/**
 * Analisa CTR (Taxa de Cliques)
 */
function analyzeCTR(ctr: number) {
  let status: "excelente" | "bom" | "aceitavel" | "ruim";
  let insight = "";
  let recomendacao = "";

  if (ctr >= 2.5) {
    status = "excelente";
    insight = `Sua taxa de cliques (${ctr.toFixed(2)}%) está acima da média. Seus anúncios estão gerando grande interesse e engajamento.`;
    recomendacao = "Mantenha a estratégia criativa atual. Considere aumentar o orçamento para aproveitar o bom desempenho.";
  } else if (ctr >= 1.5) {
    status = "bom";
    insight = `Sua taxa de cliques (${ctr.toFixed(2)}%) está dentro da média esperada para campanhas Meta.`;
    recomendacao = "Teste variações de criativo para tentar melhorar ainda mais. Analise qual tipo de conteúdo gera mais cliques.";
  } else if (ctr >= 0.8) {
    status = "aceitavel";
    insight = `Sua taxa de cliques (${ctr.toFixed(2)}%) está abaixo da média. Há espaço para melhorias.`;
    recomendacao = "Revise o copy do anúncio, imagens e público-alvo. Teste diferentes formatos de anúncio (carousel, vídeo, etc).";
  } else {
    status = "ruim";
    insight = `Sua taxa de cliques (${ctr.toFixed(2)}%) está significativamente abaixo da média.`;
    recomendacao = "Faça uma revisão completa: público-alvo pode estar errado, criativo pode não estar atrativo ou oferta pode não ser clara.";
  }

  return { value: ctr, status, benchmark: BENCHMARKS.ctr, insight, recomendacao };
}

/**
 * Analisa CPM (Custo por 1000 Impressões)
 */
function analyzeCPM(cpm: number) {
  let status: "excelente" | "bom" | "aceitavel" | "ruim";
  let insight = "";
  let recomendacao = "";

  if (cpm <= 8) {
    status = "excelente";
    insight = `Seu CPM (R$ ${cpm.toFixed(2)}) está muito abaixo da média. Você está obtendo impressões com custo muito baixo.`;
    recomendacao = "Excelente eficiência! Considere aumentar o orçamento para aproveitar esse custo favorável.";
  } else if (cpm <= 12) {
    status = "bom";
    insight = `Seu CPM (R$ ${cpm.toFixed(2)}) está dentro da faixa esperada para campanhas Meta.`;
    recomendacao = "Bom custo-benefício. Monitore regularmente para garantir que se mantenha nessa faixa.";
  } else if (cpm <= 18) {
    status = "aceitavel";
    insight = `Seu CPM (R$ ${cpm.toFixed(2)}) está acima da média, mas ainda aceitável.`;
    recomendacao = "Otimize o público-alvo para reduzir custos. Teste diferentes horários de exibição e localizações.";
  } else {
    status = "ruim";
    insight = `Seu CPM (R$ ${cpm.toFixed(2)}) está muito alto. Você está pagando caro por impressões.`;
    recomendacao = "Revise segmentação de público. Considere usar lookalike audiences. Teste diferentes posicionamentos de anúncio.";
  }

  return { value: cpm, status, benchmark: BENCHMARKS.cpm, insight, recomendacao };
}

/**
 * Analisa Alcance e Frequência
 */
function analyzeAlcance(reach: number, impressions: number, frequencia: number) {
  let status: "excelente" | "bom" | "aceitavel" | "ruim";
  let insight = "";
  let recomendacao = "";

  if (frequencia <= 1.5) {
    status = "excelente";
    insight = `Você alcançou ${reach.toLocaleString("pt-BR")} pessoas com frequência de ${frequencia.toFixed(2)}x. Excelente distribuição.`;
    recomendacao = "Ótima estratégia de alcance. Mantenha essa abordagem para maximizar o número de pessoas atingidas.";
  } else if (frequencia <= 2.5) {
    status = "bom";
    insight = `Alcance de ${reach.toLocaleString("pt-BR")} com frequência de ${frequencia.toFixed(2)}x. Distribuição equilibrada.`;
    recomendacao = "Bom equilíbrio entre alcance e repetição. Continue monitorando para não saturar o público.";
  } else if (frequencia <= 4) {
    status = "aceitavel";
    insight = `Frequência de ${frequencia.toFixed(2)}x indica que o mesmo público está vendo o anúncio várias vezes.`;
    recomendacao = "Risco de fadiga de anúncio. Considere rotacionar criativos ou expandir o público-alvo.";
  } else {
    status = "ruim";
    insight = `Frequência muito alta (${frequencia.toFixed(2)}x). Seu público está saturado com o anúncio.`;
    recomendacao = "Urgente: Expanda o público-alvo ou pause a campanha. Alta frequência reduz efetividade e aumenta custos.";
  }

  return { value: reach, impressoes: impressions, frequencia, status, insight, recomendacao };
}

/**
 * Analisa Engajamento (Seguidores, Mensagens, Visitas)
 */
function analyzeEngajamento(seguidores: number, mensagens: number, visitas: number) {
  let status: "excelente" | "bom" | "aceitavel" | "ruim";
  let insight = "";
  let recomendacao = "";

  const totalEngajamento = seguidores + mensagens + visitas;

  if (totalEngajamento > 2000) {
    status = "excelente";
    insight = `Excelente engajamento! ${seguidores} novos seguidores, ${mensagens} mensagens e ${visitas.toLocaleString("pt-BR")} visitas ao perfil.`;
    recomendacao = "Seu conteúdo está gerando forte interesse. Responda rapidamente às mensagens para converter leads.";
  } else if (totalEngajamento > 1000) {
    status = "bom";
    insight = `Bom engajamento com ${seguidores} novos seguidores, ${mensagens} mensagens e ${visitas.toLocaleString("pt-BR")} visitas.`;
    recomendacao = "Mantenha a qualidade do conteúdo. Considere criar conteúdo específico para converter visitantes em clientes.";
  } else if (totalEngajamento > 500) {
    status = "aceitavel";
    insight = `Engajamento moderado: ${seguidores} seguidores, ${mensagens} mensagens, ${visitas.toLocaleString("pt-BR")} visitas.`;
    recomendacao = "Melhore a call-to-action. Teste diferentes tipos de conteúdo para aumentar interação.";
  } else {
    status = "ruim";
    insight = `Engajamento baixo com apenas ${totalEngajamento} interações totais.`;
    recomendacao = "Revise sua proposta de valor. Certifique-se de que o CTA é claro e atrativo. Teste novos formatos.";
  }

  return { seguidores, mensagens, visitasProfile: visitas, status, insight, recomendacao };
}

/**
 * Analisa Retenção de Vídeo
 */
function analyzeVideo(retencao: number) {
  let status: "excelente" | "bom" | "aceitavel" | "ruim";
  let insight = "";
  let recomendacao = "";

  if (retencao >= 25) {
    status = "excelente";
    insight = `Retenção de vídeo de ${retencao.toFixed(2)}% é excelente. Seu vídeo está mantendo a atenção do público.`;
    recomendacao = "Continue produzindo vídeos de qualidade. Esse formato está funcionando muito bem para sua marca.";
  } else if (retencao >= 15) {
    status = "bom";
    insight = `Retenção de ${retencao.toFixed(2)}% está acima da média. Seu vídeo está gerando boa retenção.`;
    recomendacao = "Bom desempenho. Teste variações de comprimento e estilo para otimizar ainda mais.";
  } else if (retencao >= 8) {
    status = "aceitavel";
    insight = `Retenção de ${retencao.toFixed(2)}% é aceitável, mas há espaço para melhorias.`;
    recomendacao = "Melhore os primeiros 3 segundos do vídeo. Adicione texto, música ou elementos visuais mais atrativos.";
  } else {
    status = "ruim";
    insight = `Retenção de ${retencao.toFixed(2)}% é muito baixa. As pessoas estão deixando o vídeo rapidamente.`;
    recomendacao = "Revise completamente o vídeo. Comece com um hook forte, mantenha ritmo rápido e adicione legendas.";
  }

  return { retencao, status, insight, recomendacao };
}

/**
 * Analisa Investimento e ROI
 */
function analyzeInvestimento(
  gasto: number,
  custoPorClique: number,
  custoPorVisita: number,
  cliques: number,
  alcance: number
) {
  let status: "excelente" | "bom" | "aceitavel" | "ruim";
  let insight = "";
  let recomendacao = "";

  // Estimativa simples de ROI baseada em conversão típica
  const roiEstimado = (alcance * 0.02) / gasto; // Assumindo 2% de conversão

  if (custoPorClique <= 1.0 && custoPorVisita <= 0.25) {
    status = "excelente";
    insight = `Custos muito eficientes: R$ ${custoPorClique.toFixed(2)} por clique e R$ ${custoPorVisita.toFixed(2)} por visita.`;
    recomendacao = "Excelente eficiência de custos. Considere aumentar o orçamento para aproveitar essa oportunidade.";
  } else if (custoPorClique <= 1.5 && custoPorVisita <= 0.35) {
    status = "bom";
    insight = `Custos dentro da faixa esperada: R$ ${custoPorClique.toFixed(2)}/clique e R$ ${custoPorVisita.toFixed(2)}/visita.`;
    recomendacao = "Bom custo-benefício. Mantenha o monitoramento regular para garantir eficiência.";
  } else if (custoPorClique <= 2.0 && custoPorVisita <= 0.5) {
    status = "aceitavel";
    insight = `Custos acima da média: R$ ${custoPorClique.toFixed(2)}/clique e R$ ${custoPorVisita.toFixed(2)}/visita.`;
    recomendacao = "Otimize o público-alvo e teste diferentes estratégias de licitação para reduzir custos.";
  } else {
    status = "ruim";
    insight = `Custos muito altos: R$ ${custoPorClique.toFixed(2)}/clique e R$ ${custoPorVisita.toFixed(2)}/visita.`;
    recomendacao = "Urgente: Revise segmentação, teste novos públicos e considere pausar campanhas com baixo desempenho.";
  }

  return { gasto, custoPorClique, custoPorVisita, roi: roiEstimado, status, insight, recomendacao };
}

/**
 * Gera resumo geral com pontos fortes e fracos
 */
function generateResumo(metrics: {
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
}) {
  const pontosFortesTexto: string[] = [];
  const pontosFracosTexto: string[] = [];

  // Análise de pontos fortes
  if (metrics.ctr >= 1.5) pontosFortesTexto.push("Taxa de cliques acima da média");
  if (metrics.cpm <= 12) pontosFortesTexto.push("Custo por impressão eficiente");
  if (metrics.videoRetentionRate >= 15) pontosFortesTexto.push("Boa retenção de vídeo");
  if (metrics.newInstagramFollowers > 500) pontosFortesTexto.push("Crescimento significativo de seguidores");
  if (metrics.costPerClick <= 1.5) pontosFortesTexto.push("Custo por clique competitivo");

  // Análise de pontos fracos
  if (metrics.ctr < 0.8) pontosFracosTexto.push("Taxa de cliques abaixo da média");
  if (metrics.cpm > 18) pontosFracosTexto.push("Custo por impressão muito alto");
  if (metrics.videoRetentionRate < 8) pontosFracosTexto.push("Retenção de vídeo baixa");
  if (metrics.messagesInitiated < 100) pontosFracosTexto.push("Poucas mensagens iniciadas");
  if (metrics.costPerProfileVisit > 0.5) pontosFracosTexto.push("Custo por visita ao perfil elevado");

  const recomendacaoPrincipal =
    pontosFortesTexto.length > pontosFracosTexto.length
      ? "Sua campanha está performando bem. Continue com a estratégia atual e teste incrementos para melhorar ainda mais."
      : "Há oportunidades significativas de melhoria. Revise a segmentação de público e teste novos criativos.";

  return {
    pontosFortesCount: pontosFortesTexto.length,
    pontosFortesTexto,
    pontosFracosCount: pontosFracosTexto.length,
    pontosFracosTexto,
    recomendacaoPrincipal,
  };
}
