/**
 * ConsultiveReport — Análise de Performance com Claude Haiku 4.5
 * Gera análise inteligente e personalizada com os dados reais da campanha.
 */

import { trpc } from "@/lib/trpc";
import { analyzeMetrics } from "@shared/analytics";
import { CheckCircle, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";

interface ConsultiveReportProps {
  metrics: {
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
  };
  empresa?: string;
  periodo?: string;
}

export default function ConsultiveReport({ metrics, empresa, periodo }: ConsultiveReportProps) {
  const [aiData, setAiData] = useState<{
    pontosFortesTexto: string[];
    pontosFracosTexto: string[];
    recomendacaoPrincipal: string;
  } | null>(null);
  const [aiError, setAiError] = useState(false);

  const analyzeMutation = trpc.aiAnalysis.analyzeReport.useMutation({
    onSuccess: (data) => setAiData(data),
    onError: () => {
      setAiError(true);
    },
  });

  // Fallback local (regras)
  const { resumoGeral } = analyzeMetrics(metrics);
  const fallback = resumoGeral;

  // Dados a exibir: IA se disponível, senão fallback local
  const roas = metrics.totalSpent > 0 && (metrics.purchaseValue ?? 0) > 0
    ? (metrics.purchaseValue ?? 0) / metrics.totalSpent
    : 0;

  const display = aiData ?? fallback;

  const handleGenerateAI = () => {
    if (analyzeMutation.isPending) return;
    analyzeMutation.mutate({
      totalSpent:             metrics.totalSpent,
      ctr:                    metrics.ctr,
      cpm:                    metrics.cpm,
      cpc:                    metrics.costPerClick,
      totalImpressions:       metrics.totalImpressions,
      totalReach:             metrics.totalReach,
      totalClicks:            metrics.totalClicks,
      purchases:              metrics.purchases ?? 0,
      purchaseValue:          metrics.purchaseValue ?? 0,
      costPerPurchase:        metrics.costPerPurchase ?? 0,
      roas,
      messagesInitiated:      metrics.messagesInitiated,
      costPerMessage:         metrics.costPerMessage ?? 0,
      instagramProfileVisits: metrics.instagramProfileVisits,
      costPerProfileVisit:    metrics.costPerProfileVisit,
      newInstagramFollowers:  metrics.newInstagramFollowers,
      videoRetentionRate:     metrics.videoRetentionRate,
      empresa,
      periodo,
    });
  };

  return (
    <div className="mt-8 space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-1">📋 Análise de Performance</h2>
        <p className="text-gray-400 text-sm">Destaques e oportunidades identificadas no período</p>
      </div>

      {/* Botão Gerar com IA */}
      {!aiData && (
        <div className="flex justify-center">
          <button
            onClick={handleGenerateAI}
            disabled={analyzeMutation.isPending}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
              analyzeMutation.isPending
                ? "border-primary/30 bg-primary/10 text-primary/60 cursor-not-allowed"
                : "border-primary/40 bg-primary/15 text-primary hover:bg-primary/25 hover:border-primary/60"
            }`}
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando com Haiku 4.5...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar análise com IA (Claude Haiku 4.5)
              </>
            )}
          </button>
        </div>
      )}

      {aiError && (
        <div className="text-center text-xs text-amber-400/70 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
          IA indisponível — exibindo análise automática
        </div>
      )}

      {aiData && (
        <div className="flex items-center justify-center gap-2 text-xs text-primary/60">
          <Sparkles className="h-3 w-3" />
          <span>Análise gerada por Claude Haiku 4.5</span>
        </div>
      )}

      {/* Grid: Pontos Fortes + Oportunidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Pontos Fortes */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            <h4 className="text-base font-bold text-emerald-300">Pontos Positivos</h4>
          </div>
          {display.pontosFortesTexto.length > 0 ? (
            <ul className="space-y-2">
              {display.pontosFortesTexto.map((ponto, idx) => (
                <li key={idx} className="flex items-start gap-2 text-emerald-200 text-sm">
                  <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                  <span>{ponto}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">Nenhum ponto positivo identificado neste período.</p>
          )}
        </div>

        {/* Oportunidades */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
            <h4 className="text-base font-bold text-amber-300">Oportunidades de Melhoria</h4>
          </div>
          {display.pontosFracosTexto.length > 0 ? (
            <ul className="space-y-2">
              {display.pontosFracosTexto.map((ponto, idx) => (
                <li key={idx} className="flex items-start gap-2 text-amber-200 text-sm">
                  <span className="text-amber-400 mt-0.5 shrink-0">!</span>
                  <span>{ponto}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">Nenhuma oportunidade identificada. Excelente performance!</p>
          )}
        </div>
      </div>

      {/* Recomendação Principal */}
      <div className="bg-gradient-to-r from-yellow-500/15 to-yellow-600/15 border border-yellow-500/30 rounded-2xl p-5">
        <p className="text-[10px] font-bold text-yellow-400/70 uppercase tracking-widest mb-1.5">
          💡 Recomendação Geral
        </p>
        <p className="text-white text-sm leading-relaxed">{display.recomendacaoPrincipal}</p>
      </div>
    </div>
  );
}
