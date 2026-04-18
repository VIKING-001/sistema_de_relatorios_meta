/**
 * FunnelChart — Funil de Marketing Visual
 * Mostra o caminho do usuário desde a impressão até a conversão
 * com taxas de conversão entre cada etapa e custo por etapa.
 */

import { formatCurrency, formatNumber } from "@shared/metrics";

interface FunnelStep {
  label: string;
  value: number;
  color: string;
  bg: string;
  icon: string;
  cost?: number;
  costLabel?: string;
}

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
  /** true = tema escuro (relatório público), false = painel admin */
  dark?: boolean;
}

function convRate(a: number, b: number): string {
  if (!b || !a) return "—";
  return ((a / b) * 100).toFixed(1) + "%";
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
  const steps: FunnelStep[] = [
    {
      label: "Impressões",
      value: totalImpressions,
      color: dark ? "text-blue-300" : "text-blue-400",
      bg: dark ? "from-blue-600/30 to-blue-800/20 border-blue-500/40" : "from-blue-500/20 to-blue-600/10 border-blue-500/30",
      icon: "👁️",
    },
    {
      label: "Alcance",
      value: totalReach,
      color: dark ? "text-cyan-300" : "text-cyan-400",
      bg: dark ? "from-cyan-600/30 to-cyan-800/20 border-cyan-500/40" : "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
      icon: "📡",
    },
    {
      label: "Cliques",
      value: totalClicks,
      color: dark ? "text-purple-300" : "text-purple-400",
      bg: dark ? "from-purple-600/30 to-purple-800/20 border-purple-500/40" : "from-purple-500/20 to-purple-600/10 border-purple-500/30",
      icon: "🖱️",
      cost: costPerClick,
      costLabel: "CPC",
    },
    {
      label: "Visitas ao Perfil",
      value: instagramProfileVisits,
      color: dark ? "text-orange-300" : "text-orange-400",
      bg: dark ? "from-orange-600/30 to-orange-800/20 border-orange-500/40" : "from-orange-500/20 to-orange-600/10 border-orange-500/30",
      icon: "🏠",
      cost: costPerProfileVisit,
      costLabel: "Custo/Visita",
    },
    {
      label: "Mensagens",
      value: messagesInitiated,
      color: dark ? "text-yellow-300" : "text-yellow-400",
      bg: dark ? "from-yellow-600/30 to-yellow-800/20 border-yellow-500/40" : "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
      icon: "💬",
      cost: costPerMessage,
      costLabel: "Custo/Mensagem",
    },
    ...(purchases > 0
      ? [
          {
            label: "Compras",
            value: purchases,
            color: dark ? "text-emerald-300" : "text-emerald-400",
            bg: dark
              ? "from-emerald-600/30 to-emerald-800/20 border-emerald-500/40"
              : "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
            icon: "🛒",
            cost: costPerPurchase,
            costLabel: "Custo/Compra",
          },
        ]
      : []),
  ].filter((s) => s.value > 0);

  if (steps.length < 2) return null;

  const maxVal = steps[0].value;

  // Largura do funil: 100% para o topo, decresce proporcionalmente
  const getWidth = (val: number) => {
    const pct = (val / maxVal) * 100;
    // Mínimo 28% para que os últimos steps ainda apareçam bem
    return Math.max(28, pct);
  };

  const textColor = dark ? "text-white/70" : "text-muted-foreground";
  const dividerColor = dark ? "border-white/10" : "border-white/10";
  const arrowColor = dark ? "text-white/20" : "text-white/20";

  return (
    <div className="w-full space-y-1.5">
      {steps.map((step, i) => {
        const prevVal = i > 0 ? steps[i - 1].value : step.value;
        const rate = i > 0 ? convRate(step.value, prevVal) : null;

        return (
          <div key={step.label}>
            {/* Seta de conversão */}
            {i > 0 && (
              <div className={`flex items-center justify-center gap-2 text-xs ${arrowColor} py-0.5`}>
                <div className={`h-px flex-1 max-w-[80px] ${dividerColor} border-b`} />
                <span className="font-mono text-[11px] font-bold text-white/40">
                  ↓ {rate} ({formatNumber(step.value)})
                </span>
                <div className={`h-px flex-1 max-w-[80px] ${dividerColor} border-b`} />
              </div>
            )}

            {/* Barra do funil */}
            <div className="flex justify-center">
              <div
                style={{ width: `${getWidth(step.value)}%` }}
                className={`relative bg-gradient-to-r ${step.bg} border rounded-xl px-4 py-3 transition-all duration-500`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">{step.icon}</span>
                    <div className="min-w-0">
                      <p className={`text-[11px] font-bold uppercase tracking-wider ${step.color} truncate`}>
                        {step.label}
                      </p>
                      <p className={`text-lg font-bold text-white leading-tight`}>
                        {formatNumber(step.value)}
                      </p>
                    </div>
                  </div>
                  {step.cost != null && step.cost > 0 && (
                    <div className="text-right shrink-0">
                      <p className={`text-[10px] ${textColor} uppercase tracking-wide`}>{step.costLabel}</p>
                      <p className={`text-sm font-bold ${step.color}`}>{formatCurrency(step.cost)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Rodapé: investimento total e ROAS */}
      <div className={`mt-4 pt-4 border-t ${dividerColor} grid grid-cols-2 sm:grid-cols-${purchaseValue > 0 ? "4" : "3"} gap-3`}>
        <div className="text-center">
          <p className={`text-[10px] uppercase tracking-wider ${textColor}`}>Investimento</p>
          <p className="text-base font-bold text-white">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="text-center">
          <p className={`text-[10px] uppercase tracking-wider ${textColor}`}>CTR (Imp→Clique)</p>
          <p className="text-base font-bold text-white">{convRate(totalClicks, totalImpressions)}</p>
        </div>
        {messagesInitiated > 0 && (
          <div className="text-center">
            <p className={`text-[10px] uppercase tracking-wider ${textColor}`}>Conv. para Mensagem</p>
            <p className="text-base font-bold text-white">{convRate(messagesInitiated, totalClicks)}</p>
          </div>
        )}
        {purchaseValue > 0 && (
          <div className="text-center">
            <p className={`text-[10px] uppercase tracking-wider ${textColor}`}>Valor Faturado</p>
            <p className="text-base font-bold text-emerald-400">{formatCurrency(purchaseValue)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
