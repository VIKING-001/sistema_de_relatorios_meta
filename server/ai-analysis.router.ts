import { router } from "./_core/trpc";
import OpenAI from "openai";

export interface AiAnalysisInput {
  totalSpent: number;
  ctr: number;
  cpm: number;
  cpc: number;
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  purchases?: number;
  purchaseValue?: number;
  costPerPurchase?: number;
  roas?: number;
  messagesInitiated?: number;
  costPerMessage?: number;
  instagramProfileVisits?: number;
  costPerProfileVisit?: number;
  newInstagramFollowers?: number;
  videoRetentionRate?: number;
  empresa?: string;
  periodo?: string;
}

export interface AiAnalysisResult {
  pontosFortesTexto: string[];
  pontosFracosTexto: string[];
  recomendacaoPrincipal: string;
}

/**
 * Gera análise de performance via z.ai (GLM-4-Flash).
 * Chamado no servidor durante a criação do relatório.
 */
export async function generateAiAnalysis(input: AiAnalysisInput): Promise<AiAnalysisResult> {
  // Google Gemini (gratuito) via endpoint compatível com OpenAI.
  // Aceita GEMINI_API_KEY (preferencial) ou GOOGLE_API_KEY.
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");

  const client = new OpenAI({
    apiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
  const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const brl = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const num = (v: number) => v.toLocaleString("pt-BR");
  const pct = (v: number) => `${v.toFixed(2)}%`;

  const purchases           = input.purchases          ?? 0;
  const purchaseValue       = input.purchaseValue      ?? 0;
  const costPerPurchase     = input.costPerPurchase    ?? 0;
  const roas                = input.roas               ?? 0;
  const messagesInitiated   = input.messagesInitiated  ?? 0;
  const costPerMessage      = input.costPerMessage     ?? 0;
  const instagramProfileVisits = input.instagramProfileVisits ?? 0;
  const costPerProfileVisit = input.costPerProfileVisit ?? 0;
  const newInstagramFollowers  = input.newInstagramFollowers ?? 0;
  const videoRetentionRate  = input.videoRetentionRate ?? 0;
  const frequencia = input.totalImpressions / Math.max(input.totalReach, 1);

  const prompt = `Você é um especialista sênior em tráfego pago e marketing digital. Analise os dados abaixo de uma campanha Meta Ads e gere um relatório de performance conciso para o CLIENTE. Tom: profissional, positivo quando possível, orientado a ação.

DADOS DA CAMPANHA${input.empresa ? ` — ${input.empresa}` : ""}${input.periodo ? ` (${input.periodo})` : ""}:

📊 ALCANCE:
- Pessoas alcançadas: ${num(input.totalReach)}
- Impressões: ${num(input.totalImpressions)}
- Frequência: ${frequencia.toFixed(1)}x

💰 INVESTIMENTO:
- Total investido: ${brl(input.totalSpent)}
- CPM: ${brl(input.cpm)} (média mercado: R$ 12,00)
- CPC: ${brl(input.cpc)} (média mercado: R$ 1,50)
- CTR: ${pct(input.ctr)} (média mercado: 1,5%)
- Cliques: ${num(input.totalClicks)}
${purchases > 0 ? `
🛍️ VENDAS:
- Vendas: ${purchases}
- Faturamento: ${brl(purchaseValue)}
- ROAS: ${roas.toFixed(2)}x
- Custo por venda: ${brl(costPerPurchase)}` : ""}
${messagesInitiated > 0 ? `
💬 MENSAGENS:
- Mensagens iniciadas: ${num(messagesInitiated)}
- Custo por mensagem: ${brl(costPerMessage)}` : ""}
${instagramProfileVisits > 0 ? `
👤 INSTAGRAM:
- Visitas ao perfil: ${num(instagramProfileVisits)}
- Custo por visita: ${brl(costPerProfileVisit)}
- Novos seguidores: ${num(newInstagramFollowers)}` : ""}
${videoRetentionRate > 0 ? `
🎬 VÍDEO:
- Retenção: ${pct(videoRetentionRate)} (média: 15-20%)` : ""}

BENCHMARKS Meta Ads Brasil: CTR bom >1,5% | CPM bom <R$12 | CPC bom <R$1,50 | ROAS sustentável >3x | Frequência ideal 1,5-3x

Responda SOMENTE com JSON válido (sem markdown, sem texto extra):
{
  "pontosFortesTexto": ["frase curta com número real 1", "frase curta com número real 2"],
  "pontosFracosTexto": ["frase curta com número real 1"],
  "recomendacaoPrincipal": "Parágrafo de 2-4 frases com recomendação específica citando valores reais do relatório."
}

REGRAS: máximo 4 itens por lista | cada item = 1 frase com o número real | se ROAS >= 3x destaque como ponto principal | listas podem ser vazias []`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1024,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content?.trim() ?? "";

  // Extrair JSON da resposta (pode vir com markdown)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Resposta inválida da IA");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    pontosFortesTexto:    (parsed.pontosFortesTexto    ?? []) as string[],
    pontosFracosTexto:    (parsed.pontosFracosTexto    ?? []) as string[],
    recomendacaoPrincipal:(parsed.recomendacaoPrincipal ?? "") as string,
  };
}

// Router vazio — toda a lógica agora é server-side (chamada durante createReport)
export const aiAnalysisRouter = router({});
