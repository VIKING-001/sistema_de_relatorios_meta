/**
 * StrategicPanel — Diagnóstico estratégico exclusivo para o admin (gestor)
 * Mostra: score de saúde, alertas críticos, ações prioritárias com urgência,
 * quick wins e resumo executivo. Nunca aparece no relatório do cliente.
 */

import { strategicDiagnosis, type DiagnosticoEstrategico, type Urgencia } from "@shared/analytics";
import { AlertCircle, Zap, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface StrategicPanelProps {
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
}

// ─── Cores e ícones por urgência ────────────────────────────────────────────────

const URGENCIA_CONFIG: Record<Urgencia, {
  bg: string; border: string; badge: string; badgeText: string; label: string; dot: string;
}> = {
  critico: {
    bg: "bg-red-500/8",
    border: "border-red-500/30",
    badge: "bg-red-500/15 border-red-500/40 text-red-400",
    badgeText: "🔴 Crítico",
    label: "text-red-400",
    dot: "bg-red-400",
  },
  atencao: {
    bg: "bg-amber-500/8",
    border: "border-amber-500/25",
    badge: "bg-amber-500/15 border-amber-500/40 text-amber-400",
    badgeText: "🟡 Atenção",
    label: "text-amber-400",
    dot: "bg-amber-400",
  },
  ok: {
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    badge: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    badgeText: "🔵 Observar",
    label: "text-blue-400",
    dot: "bg-blue-400",
  },
  destaque: {
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/25",
    badge: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
    badgeText: "✅ Destaque",
    label: "text-emerald-400",
    dot: "bg-emerald-400",
  },
};

// ─── Score visual ───────────────────────────────────────────────────────────────

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color =
    score >= 75 ? "#10B981" :
    score >= 50 ? "#3B82F6" :
    score >= 30 ? "#F59E0B" : "#EF4444";

  const radius = 32;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white leading-none">{score}</span>
          <span className="text-[9px] text-white/40 mt-0.5">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-bold" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Ação estratégica expandível ────────────────────────────────────────────────

function AcaoCard({ acao }: { acao: DiagnosticoEstrategico["acoesPrioritarias"][0] }) {
  const [open, setOpen] = useState(false);
  const c = URGENCIA_CONFIG[acao.urgencia];

  return (
    <div className={`rounded-xl border ${c.bg} ${c.border} overflow-hidden`}>
      <button
        className="w-full px-4 py-3 flex items-start gap-3 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${c.dot} mt-1.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${c.label}`}>
              {acao.area}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.badge}`}>
              {c.badgeText}
            </span>
          </div>
          <p className="text-sm font-bold text-white leading-snug">{acao.titulo}</p>
          {!open && (
            <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{acao.diagnostico}</p>
          )}
        </div>
        <div className="shrink-0 mt-0.5">
          {open
            ? <ChevronUp className="h-4 w-4 text-white/30" />
            : <ChevronDown className="h-4 w-4 text-white/30" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-white/60 leading-relaxed border-t border-white/5 pt-3">
            {acao.diagnostico}
          </p>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
              Ações concretas
            </p>
            {acao.acoes.map((a, idx) => (
              <div key={idx} className="flex gap-2.5 items-start">
                <span className={`text-[10px] font-black mt-0.5 shrink-0 ${c.label}`}>
                  {idx + 1}.
                </span>
                <p className="text-xs text-white/70 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────────

export default function StrategicPanel({ metrics }: StrategicPanelProps) {
  const diag = strategicDiagnosis(metrics);

  return (
    <div className="space-y-4 mt-2">

      {/* Banner admin */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
        <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
          Diagnóstico Estratégico — Visão do Gestor
        </p>
        <span className="text-[10px] text-white/30 ml-auto">🔒 Não aparece no relatório do cliente</span>
      </div>

      {/* Score + Resumo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/8">
        <ScoreRing score={diag.score} label={diag.scoreLabel} />
        <div className="flex-1">
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Resumo Executivo</p>
          <p className="text-sm text-white leading-relaxed">{diag.resumoExecutivo}</p>
        </div>
      </div>

      {/* Alertas Críticos */}
      {diag.alertasCriticos.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/8 border border-red-500/30 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest">
              Alertas Críticos ({diag.alertasCriticos.length})
            </p>
          </div>
          {diag.alertasCriticos.map((a, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-red-500 text-xs mt-0.5 shrink-0">⚠</span>
              <p className="text-xs text-red-300 leading-snug">{a}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Wins */}
      {diag.quickWins.length > 0 && (
        <div className="p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/25 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Oportunidades de Escala
            </p>
          </div>
          {diag.quickWins.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-emerald-400 text-xs mt-0.5 shrink-0">→</span>
              <p className="text-xs text-emerald-300 leading-snug">{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* Ações Prioritárias */}
      {diag.acoesPrioritarias.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            Ações Prioritárias (clique para expandir)
          </p>
          {diag.acoesPrioritarias.map((acao, i) => (
            <AcaoCard key={i} acao={acao} />
          ))}
        </div>
      )}

      {diag.acoesPrioritarias.length === 0 && diag.alertasCriticos.length === 0 && (
        <div className="text-center py-6 text-white/30 text-sm">
          ✅ Nenhuma ação crítica identificada. Campanha em boa saúde.
        </div>
      )}
    </div>
  );
}
