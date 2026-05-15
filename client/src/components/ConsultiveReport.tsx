/**
 * ConsultiveReport — Exibe análise de performance gerada pelo z.ai no momento
 * da criação do relatório. Nenhum botão é exibido ao cliente.
 */

import { analyzeMetrics } from "@shared/analytics";
import { CheckCircle, AlertCircle, Sparkles } from "lucide-react";

interface AiAnalysis {
  pontosFortesTexto: string[];
  pontosFracosTexto: string[];
  recomendacaoPrincipal: string;
}

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
  /** Análise gerada pelo z.ai no servidor (JSON string ou objeto já parseado) */
  aiAnalysis?: string | AiAnalysis | null;
}

export default function ConsultiveReport({ metrics, aiAnalysis }: ConsultiveReportProps) {
  // Tentar usar análise IA armazenada
  let storedAi: AiAnalysis | null = null;
  if (aiAnalysis) {
    if (typeof aiAnalysis === "string") {
      try { storedAi = JSON.parse(aiAnalysis); } catch { storedAi = null; }
    } else {
      storedAi = aiAnalysis;
    }
  }

  // Fallback para análise local baseada em regras
  const { resumoGeral } = analyzeMetrics(metrics);
  const display = storedAi ?? resumoGeral;
  const isAi    = !!storedAi;

  return (
    <div className="mt-8 space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-1">📋 Análise de Performance</h2>
        <p className="text-gray-400 text-sm">Destaques e oportunidades identificadas no período</p>
      </div>

      {/* Indicador de fonte da análise */}
      {isAi && (
        <div className="flex items-center justify-center gap-2 text-xs text-primary/60">
          <Sparkles className="h-3 w-3" />
          <span>Análise gerada por inteligência artificial</span>
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
