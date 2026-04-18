/**
 * FunnelChart — Funil de Marketing Premium
 * Design profissional com trapézios reais, gradientes e métricas limpas
 */

import { formatCurrency, formatNumber } from "@shared/metrics";

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
  gradient: string;
  glow: string;
  dot: string;
}

function pct(a: number, b: number) {
  if (!b || !a) return null;
  return ((a / b) * 100).toFixed(1);
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString("pt-BR");
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
      gradient: "from-[#3B82F6] to-[#1D4ED8]",
      glow: "shadow-blue-500/30",
      dot: "bg-blue-400",
    },
    {
      key: "reach",
      label: "Alcance",
      value: totalReach,
      gradient: "from-[#06B6D4] to-[#0891B2]",
      glow: "shadow-cyan-500/30",
      dot: "bg-cyan-400",
    },
    {
      key: "clicks",
      label: "Cliques",
      value: totalClicks,
      cost: costPerClick,
      costLabel: "CPC",
      gradient: "from-[#8B5CF6] to-[#6D28D9]",
      glow: "shadow-violet-500/30",
      dot: "bg-violet-400",
    },
    {
      key: "visits",
      label: "Visitas ao Perfil",
      value: instagramProfileVisits,
      cost: costPerProfileVisit,
      costLabel: "Custo/Visita",
      gradient: "from-[#F59E0B] to-[#D97706]",
      glow: "shadow-amber-500/30",
      dot: "bg-amber-400",
    },
    {
      key: "messages",
      label: "Mensagens",
      value: messagesInitiated,
      cost: costPerMessage,
      costLabel: "Custo/Mensagem",
      gradient: "from-[#EC4899] to-[#BE185D]",
      glow: "shadow-pink-500/30",
      dot: "bg-pink-400",
    },
    ...(purchases > 0
      ? [{
          key: "purchases",
          label: "Compras",
          value: purchases,
          cost: costPerPurchase,
          costLabel: "Custo/Compra",
          gradient: "from-[#10B981] to-[#047857]",
          glow: "shadow-emerald-500/30",
          dot: "bg-emerald-400",
        }]
      : []),
  ].filter(s => s.value > 0);

  if (allSteps.length < 2) return null;

  const maxVal = allSteps[0].value;

  // Largura do trapézio: 100% no topo, decresce. Mínimo 30%
  const getW = (val: number) => Math.max(30, (val / maxVal) * 100);

  const bg = dark
    ? "bg-gradient-to-br from-[#070d1a] to-[#0d1628]"
    : "bg-gradient-to-br from-white/3 to-white/[0.02]";

  const border = dark ? "border-white/8" : "border-white/10";

  return (
    <div className={`rounded-2xl ${bg} border ${border} overflow-hidden`}>

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Funil de Conversão</h3>
            <p className="text-xs text-white/40 mt-0.5">Jornada completa do usuário</p>
          </div>
          {/* KPIs topo */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Investimento</p>
              <p className="text-sm font-bold text-white">{formatCurrency(totalSpent)}</p>
            </div>
            {purchases > 0 && purchaseValue > 0 && (
              <>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-right">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Faturado</p>
                  <p className="text-sm font-bold text-emerald-400">{formatCurrency(purchaseValue)}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-right">
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

      {/* ── Funil + Métricas lado a lado ── */}
      <div className="flex flex-col lg:flex-row gap-0">

        {/* Funil visual */}
        <div className="flex-1 px-6 py-6 space-y-0">
          {allSteps.map((step, i) => {
            const w = getW(step.value);
            const prevVal = i > 0 ? allSteps[i - 1].value : step.value;
            const rate = i > 0 ? pct(step.value, prevVal) : null;
            const dropPct = rate ? (100 - parseFloat(rate)).toFixed(1) : null;

            return (
              <div key={step.key}>
                {/* Conector entre steps */}
                {i > 0 && (
                  <div className="flex justify-center items-center h-8 relative">
                    {/* Linha conectora */}
                    <div
                      style={{ width: `${Math.min(getW(allSteps[i - 1].value), w)}%` }}
                      className="h-full flex flex-col items-center justify-center relative"
                    >
                      <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col items-center justify-center gap-0.5">
                        <div className="w-px flex-1 bg-gradient-to-b from-white/10 to-white/5" />
                        {/* Badge de taxa */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 shrink-0">
                          <span className="text-[10px] font-bold text-white/50">↓</span>
                          <span className="text-[10px] font-bold text-white/70">
                            {rate}%
                          </span>
                          <span className="text-[10px] text-white/30">({fmt(step.value)})</span>
                        </div>
                        <div className="w-px flex-1 bg-gradient-to-b from-white/5 to-transparent" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Barra do step */}
                <div className="flex justify-center">
                  <div
                    style={{ width: `${w}%` }}
                    className="relative group transition-all duration-700"
                  >
                    {/* Trapézio via clip-path */}
                    <div
                      className={`
                        relative bg-gradient-to-r ${step.gradient}
                        rounded-xl px-5 py-4 shadow-xl ${step.glow}
                        border border-white/10
                        hover:brightness-110 transition-all duration-300
                      `}
                    >
                      {/* Número do passo */}
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white/70">{i + 1}</span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60 mb-0.5">
                            {step.label}
                          </p>
                          <p className="text-2xl font-black text-white leading-none tracking-tight">
                            {fmt(step.value)}
                          </p>
                        </div>

                        {step.cost != null && step.cost > 0 && (
                          <div className="text-right shrink-0 bg-black/20 rounded-lg px-3 py-1.5">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">
                              {step.costLabel}
                            </p>
                            <p className="text-sm font-black text-white leading-tight">
                              {formatCurrency(step.cost)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Barra de progresso interna */}
                      {i > 0 && (
                        <div className="mt-2.5 h-0.5 bg-black/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white/30 rounded-full transition-all duration-1000"
                            style={{ width: `${pct(step.value, maxVal)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Painel lateral de métricas ── */}
        <div className="lg:w-56 border-t lg:border-t-0 lg:border-l border-white/5 bg-white/[0.02]">
          <div className="p-5 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Taxas de Conversão</p>

            {allSteps.map((step, i) => {
              if (i === 0) return null;
              const prev = allSteps[i - 1];
              const rate = pct(step.value, prev.value);
              const vsTop = pct(step.value, allSteps[0].value);

              return (
                <div key={step.key} className="py-2.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${step.dot} shrink-0`} />
                    <p className="text-[10px] font-semibold text-white/60 truncate">{step.label}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 pl-3.5">
                    <div>
                      <p className="text-xs font-bold text-white">{rate}%</p>
                      <p className="text-[9px] text-white/30">do passo anterior</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-white/50">{vsTop}%</p>
                      <p className="text-[9px] text-white/30">do topo</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Gasto total */}
            <div className="pt-3 space-y-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/8">
                <p className="text-[9px] text-white/40 uppercase tracking-widest mb-0.5">Investimento Total</p>
                <p className="text-sm font-black text-white">{formatCurrency(totalSpent)}</p>
              </div>
              {totalClicks > 0 && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/8">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-0.5">CTR Geral</p>
                  <p className="text-sm font-black text-white">{pct(totalClicks, totalImpressions)}%</p>
                </div>
              )}
              {purchases > 0 && purchaseValue > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[9px] text-emerald-400/70 uppercase tracking-widest mb-0.5">Valor Faturado</p>
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
