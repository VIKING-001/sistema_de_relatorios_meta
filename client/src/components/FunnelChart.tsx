/**
 * FunnelChart — Funil de Marketing com trapézios reais
 * Trapézios são puramente visuais; dados ficam em linha horizontal abaixo de cada etapa.
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

function getWPct(val: number, maxVal: number): number {
  return Math.max(20, (val / maxVal) * 100);
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
    },
    {
      key: "reach",
      label: "Alcance",
      value: totalReach,
      colorFrom: "#06B6D4",
      colorTo: "#0891B2",
    },
    {
      key: "clicks",
      label: "Cliques",
      value: totalClicks,
      cost: costPerClick,
      costLabel: "CPC",
      colorFrom: "#8B5CF6",
      colorTo: "#6D28D9",
    },
    {
      key: "visits",
      label: "Visitas ao Perfil",
      value: instagramProfileVisits,
      cost: costPerProfileVisit,
      costLabel: "Custo/Visita",
      colorFrom: "#F59E0B",
      colorTo: "#D97706",
    },
    {
      key: "messages",
      label: "Mensagens",
      value: messagesInitiated,
      cost: costPerMessage,
      costLabel: "Custo/Msg",
      colorFrom: "#EC4899",
      colorTo: "#BE185D",
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

        {/* ── Funil visual ── */}
        <div className="flex-1 px-4 sm:px-8 py-5 sm:py-7">
          {allSteps.map((step, i) => {
            const topPct  = getWPct(step.value, maxVal);
            const nextPct = i < allSteps.length - 1
              ? getWPct(allSteps[i + 1].value, maxVal)
              : Math.max(14, topPct * 0.72);

            const tl = (100 - topPct)  / 2;
            const tr = 100 - tl;
            const bl = (100 - nextPct) / 2;
            const br = 100 - bl;
            const clipPath = `polygon(${tl}% 0%, ${tr}% 0%, ${br}% 100%, ${bl}% 100%)`;

            const rate = i > 0 ? pct(step.value, allSteps[i - 1].value) : null;

            return (
              <div key={step.key}>

                {/* Conector entre passos */}
                {i > 0 && (
                  <div className="flex justify-center items-center" style={{ height: 22 }}>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/30 border border-white/8">
                      <span className="text-[10px] text-white/40">↓</span>
                      <span className="text-[10px] font-bold text-white/70">{rate}%</span>
                      <span className="text-[10px] text-white/30">({fmt(step.value)})</span>
                    </div>
                  </div>
                )}

                {/* Trapézio — apenas visual, sem texto dentro */}
                <div className="relative" style={{ height: 44 }}>
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${step.colorFrom}, ${step.colorTo})`,
                      clipPath,
                      boxShadow: `0 4px 20px ${step.colorFrom}33`,
                    }}
                  />
                  {/* Brilho */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      clipPath,
                      background: "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 60%)",
                    }}
                  />
                </div>

                {/* ── Linha de dados: número do passo + label + valor + custo ── */}
                <div className="flex items-center gap-2 sm:gap-3 px-1 pt-2 pb-1">

                  {/* Número do passo */}
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border border-white/15"
                    style={{ background: step.colorFrom + "33" }}
                  >
                    <span className="text-[9px] font-black" style={{ color: step.colorFrom }}>{i + 1}</span>
                  </div>

                  {/* Label */}
                  <span
                    className="text-[10px] sm:text-xs font-bold uppercase tracking-widest shrink-0"
                    style={{ color: step.colorFrom }}
                  >
                    {step.label}
                  </span>

                  {/* Separador */}
                  <div className="flex-1 h-px bg-white/5" />

                  {/* Valor principal */}
                  <span className="text-base sm:text-xl font-black text-white tracking-tight shrink-0">
                    {fmt(step.value)}
                  </span>

                  {/* Custo (badge à direita) */}
                  {step.cost != null && step.cost > 0 && (
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded-lg shrink-0"
                      style={{ background: step.colorFrom + "22", border: `1px solid ${step.colorFrom}44` }}
                    >
                      <span className="text-[9px] font-semibold text-white/50">{step.costLabel}</span>
                      <span className="text-[11px] sm:text-xs font-black text-white">{formatCurrency(step.cost)}</span>
                    </div>
                  )}
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
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: step.colorFrom }} />
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
