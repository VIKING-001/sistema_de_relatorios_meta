/**
 * FunnelChart — Funil de Marketing com trapézios reais
 * Cada etapa é um trapézio CSS (clip-path) que estreita progressivamente,
 * formando um funil visual de verdade de cima para baixo.
 */

import { formatCurrency } from "@shared/metrics";

interface FunnelChartProps {
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  instagramProfileVisits: number;
  messagesInitiated: number;
  purchases: number;
  totalSpent: number;
  costPerClick: number;
  costPerProfileVisit: number;
  costPerMessage: number;
  costPerPurchase: number;
  purchaseValue: number;
  dark?: boolean;
}

interface Step {
  key: string;
  label: string;
  value: number;
  cost?: number;
  costLabel?: string;
  colorFrom: string;
  colorTo: string;
  dot: string;
}

function pct(a: number, b: number) {
  if (!b || !a) return null;
  return ((a / b) * 100).toFixed(1);
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString("pt-BR");
}

// Largura proporcional para cada passo (% da largura total, min 22%)
function getWPct(val: number, maxVal: number): number {
  return Math.max(22, (val / maxVal) * 100);
}

export default function FunnelChart({
  totalImpressions,
  totalReach,
  totalClicks,
  instagramProfileVisits,
  messagesInitiated,
  purchases,
  totalSpent,
  costPerClick,
  costPerProfileVisit,
  costPerMessage,
  costPerPurchase,
  purchaseValue,
  dark = false,
}: FunnelChartProps) {

  const allSteps: Step[] = [
    {
      key: "impressions",
      label: "Impressões",
      value: totalImpressions,
      colorFrom: "#3B82F6",
      colorTo: "#1D4ED8",
      dot: "bg-blue-400",
    },
    {
      key: "reach",
      label: "Alcance",
      value: totalReach,
      colorFrom: "#06B6D4",
      colorTo: "#0891B2",
      dot: "bg-cyan-400",
    },
    {
      key: "clicks",
      label: "Cliques",
      value: totalClicks,
      cost: costPerClick,
      costLabel: "CPC",
      colorFrom: "#8B5CF6",
      colorTo: "#6D28D9",
      dot: "bg-violet-400",
    },
    {
      key: "visits",
      label: "Visitas ao Perfil",
      value: instagramProfileVisits,
      cost: costPerProfileVisit,
      costLabel: "Custo/Visita",
      colorFrom: "#F59E0B",
      colorTo: "#D97706",
      dot: "bg-amber-400",
    },
    {
      key: "messages",
      label: "Mensagens",
      value: messagesInitiated,
      cost: costPerMessage,
      costLabel: "Custo/Msg",
      colorFrom: "#EC4899",
      colorTo: "#BE185D",
      dot: "bg-pink-400",
    },
    ...(purchases > 0
      ? [{
          key: "purchases",
          label: "Compras",
          value: purchases,
          cost: costPerPurchase,
          costLabel: "Custo/Compra",
          colorFrom: "#10B981",
          colorTo: "#047857",
          dot: "bg-emerald-400",
        }]
      : []),
  ].filter(s => s.value > 0);

  if (allSteps.length < 2) return null;

  const maxVal = allSteps[0].value;

  const bg     = dark ? "bg-gradient-to-br from-[#070d1a] to-[#0d1628]" : "bg-gradient-to-br from-white/3 to-white/[0.02]";
  const border = dark ? "border-white/8" : "border-white/10";

  return (
    <div className={`rounded-2xl ${bg} border ${border} overflow-hidden`}>

      {/* ── Header ── */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Funil de Conversão</h3>
            <p className="text-xs text-white/40 mt-0.5">Jornada completa do usuário</p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Investimento</p>
              <p className="text-sm font-bold text-white">{formatCurrency(totalSpent)}</p>
            </div>
            {purchases > 0 && purchaseValue > 0 && (
              <>
                <div className="w-px h-8 bg-white/10 hidden sm:block" />
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Faturado</p>
                  <p className="text-sm font-bold text-emerald-400">{formatCurrency(purchaseValue)}</p>
                </div>
                <div className="w-px h-8 bg-white/10 hidden sm:block" />
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">ROAS</p>
                  <p className="text-sm font-bold text-emerald-400">
                    {totalSpent > 0 ? (purchaseValue / totalSpent).toFixed(2) + "x" : "—"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Funil + Sidebar ── */}
      <div className="flex flex-col lg:flex-row">

        {/* ── Funil visual (trapézios) ── */}
        <div className="flex-1 px-3 sm:px-6 py-5 sm:py-7">
          {allSteps.map((step, i) => {
            const topPct  = getWPct(step.value, maxVal);
            const nextPct = i < allSteps.length - 1
              ? getWPct(allSteps[i + 1].value, maxVal)
              : Math.max(14, topPct * 0.75);

            // Offsets para o clip-path (0–50 de cada lado)
            const tl = (100 - topPct)  / 2;  // top-left x%
            const tr = 100 - tl;             // top-right x%
            const bl = (100 - nextPct) / 2;  // bottom-left x%
            const br = 100 - bl;             // bottom-right x%

            const clipPath = `polygon(${tl}% 0%, ${tr}% 0%, ${br}% 100%, ${bl}% 100%)`;

            // Área de texto = largura do meio do trapézio (evita overflow)
            const midPct  = (topPct + nextPct) / 2;
            const textLeft  = `${(100 - midPct) / 2}%`;
            const textWidth = `${midPct}%`;

            const rate    = i > 0 ? pct(step.value, allSteps[i - 1].value) : null;

            return (
              <div key={step.key}>
                {/* Conector entre passos */}
                {i > 0 && (
                  <div className="flex justify-center items-center" style={{ height: 26 }}>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/30 border border-white/8">
                      <span className="text-[10px] text-white/40">↓</span>
                      <span className="text-[10px] font-bold text-white/70">{rate}%</span>
                      <span className="text-[10px] text-white/30">({fmt(step.value)})</span>
                    </div>
                  </div>
                )}

                {/* Trapézio */}
                <div className="relative" style={{ height: 68 }}>
                  {/* Fundo colorido recortado em trapézio */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${step.colorFrom}, ${step.colorTo})`,
                      clipPath,
                      boxShadow: `0 4px 20px ${step.colorFrom}33`,
                    }}
                  />
                  {/* Brilho sutil no topo */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      clipPath,
                      background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 60%)",
                    }}
                  />

                  {/* Conteúdo (label + valor + custo) */}
                  <div
                    className="absolute top-0 bottom-0 flex items-center justify-between gap-2 px-3 sm:px-4"
                    style={{ left: textLeft, width: textWidth }}
                  >
                    {/* Número do passo */}
                    <div className="w-5 h-5 rounded-full bg-black/30 border border-white/20 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-white/70">{i + 1}</span>
                    </div>

                    {/* Label + Valor */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] text-white/60 leading-none mb-0.5 truncate">
                        {step.label}
                      </p>
                      <p className="text-lg sm:text-2xl font-black text-white leading-none tracking-tight">
                        {fmt(step.value)}
                      </p>
                    </div>

                    {/* Custo */}
                    {step.cost != null && step.cost > 0 && (
                      <div className="shrink-0 bg-black/25 rounded-lg px-2 sm:px-2.5 py-1 text-right">
                        <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wide text-white/50 leading-none mb-0.5">
                          {step.costLabel}
                        </p>
                        <p className="text-xs sm:text-sm font-black text-white leading-none">
                          {formatCurrency(step.cost)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Painel lateral — Taxas de Conversão ── */}
        <div className="lg:w-52 border-t lg:border-t-0 lg:border-l border-white/5 bg-white/[0.015]">
          <div className="p-3 sm:p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">
              Taxas de Conversão
            </p>

            <div className="space-y-0.5">
              {allSteps.map((step, i) => {
                if (i === 0) return null;
                const prev  = allSteps[i - 1];
                const rate  = pct(step.value, prev.value);
                const vsTop = pct(step.value, allSteps[0].value);

                return (
                  <div key={step.key} className="py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: step.colorFrom }}
                      />
                      <p className="text-[10px] font-semibold text-white/60 truncate">{step.label}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 pl-3.5">
                      <div>
                        <p className="text-xs font-bold text-white">{rate}%</p>
                        <p className="text-[9px] text-white/30">do anterior</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-white/50">{vsTop}%</p>
                        <p className="text-[9px] text-white/30">do topo</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* KPIs extras */}
            <div className="mt-3 space-y-2">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/8">
                <p className="text-[9px] text-white/40 uppercase tracking-widest mb-0.5">Investimento</p>
                <p className="text-sm font-black text-white">{formatCurrency(totalSpent)}</p>
              </div>
              {totalClicks > 0 && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/8">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-0.5">CTR Geral</p>
                  <p className="text-sm font-black text-white">{pct(totalClicks, totalImpressions)}%</p>
                </div>
              )}
              {purchases > 0 && purchaseValue > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[9px] text-emerald-400/70 uppercase tracking-widest mb-0.5">Faturado</p>
                  <p className="text-sm font-black text-emerald-400">{formatCurrency(purchaseValue)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
