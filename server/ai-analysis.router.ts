import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import OpenAI from "openai";

const metricsSchema = z.object({
  periodo: z.string().optional(),
  empresa: z.string().optional(),
  totalSpent: z.number(),
  ctr: z.number(),
  cpm: z.number(),
  cpc: z.number(),
  totalImpressions: z.number(),
  totalReach: z.number(),
  totalClicks: z.number(),
  purchases: z.number().default(0),
  purchaseValue: z.number().default(0),
  costPerPurchase: z.number().default(0),
  roas: z.number().default(0),
  messagesInitiated: z.number().default(0),
  costPerMessage: z.number().default(0),
  instagramProfileVisits: z.number().default(0),
  costPerProfileVisit: z.number().default(0),
  newInstagramFollowers: z.number().default(0),
  videoRetentionRate: z.number().default(0),
});

export const aiAnalysisRouter = router({
  analyzeReport: publicProcedure
    .input(metricsSchema)
    .mutation(async ({ input }) => {
      const apiKey = process.env.ZAI_API_KEY;
      if (!apiKey) throw new Error("ZAI_API_KEY não configurada");

      const client = new OpenAI({
        apiKey,
        baseURL: "https://api.z.ai/v1",
      });

      const brl = (v: number) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const num = (v: number) => v.toLocaleString("pt-BR");
      const pct = (v: number) => `${v.toFixed(2)}%`;
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
${input.purchases > 0 ? `
🛍️ VENDAS:
- Vendas: ${input.purchases}
- Faturamento: ${brl(input.purchaseValue)}
- ROAS: ${input.roas.toFixed(2)}x
- Custo por venda: ${brl(input.costPerPurchase)}` : ""}
${input.messagesInitiated > 0 ? `
💬 MENSAGENS:
- Mensagens iniciadas: ${num(input.messagesInitiated)}
- Custo por mensagem: ${brl(input.costPerMessage)}` : ""}
${input.instagramProfileVisits > 0 ? `
👤 INSTAGRAM:
- Visitas ao perfil: ${num(input.instagramProfileVisits)}
- Custo por visita: ${brl(input.costPerProfileVisit)}
- Novos seguidores: ${num(input.newInstagramFollowers)}` : ""}
${input.videoRetentionRate > 0 ? `
🎬 VÍDEO:
- Retenção: ${pct(input.videoRetentionRate)} (média: 15-20%)` : ""}

BENCHMARKS Meta Ads Brasil: CTR bom >1,5% | CPM bom <R$12 | CPC bom <R$1,50 | ROAS sustentável >3x | Frequência ideal 1,5-3x

Responda SOMENTE com JSON válido (sem markdown, sem texto extra):
{
  "pontosFortesTexto": ["frase curta com número real 1", "frase curta com número real 2"],
  "pontosFracosTexto": ["frase curta com número real 1"],
  "recomendacaoPrincipal": "Parágrafo de 2-4 frases com recomendação específica citando valores reais do relatório."
}

REGRAS: máximo 4 itens por lista | cada item = 1 frase com o número real | se ROAS >= 3x destaque como ponto principal | listas podem ser vazias []`;

      const response = await client.chat.completions.create({
        model: "glm-4-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
        temperature: 0.7,
      });

      const text = response.choices[0]?.message?.content?.trim() ?? "";

      // Extrair JSON da resposta (pode vir com markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Resposta inválida da IA");

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        pontosFortesTexto: (parsed.pontosFortesTexto ?? []) as string[],
        pontosFracosTexto: (parsed.pontosFracosTexto ?? []) as string[],
        recomendacaoPrincipal: (parsed.recomendacaoPrincipal ?? "") as string,
        model: "glm-4-flash (z.ai)",
      };
    }),
});
