import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatNumber, formatPercentage, deriveMetrics } from "@shared/metrics";
import { displayDate } from "@shared/dateParser";
import { BarChart3, Loader2, TrendingDown, TrendingUp } from "lucide-react";

type PortalReport = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  description: string | null;
  trackedSales: { count: number; revenue: number };
  metrics: {
    totalSpent: number;
    totalReach: number;
    totalImpressions: number;
    instagramProfileVisits: number;
    newInstagramFollowers: number;
    messagesInitiated: number;
    totalClicks: number;
    costPerClick: number;
    videoRetentionRate: number;
    profileVisitsThroughCampaigns: number;
    costPerProfileVisit: number;
    cpm: number;
    ctr: number;
    purchases: number;
    purchaseValue: number;
    costPerPurchase: number;
    costPerMessage: number;
  } | null;
};

function reportLabel(report: PortalReport) {
  return `${report.title} · ${displayDate(report.startDate)} a ${displayDate(report.endDate)}`;
}

function metricsFor(report: PortalReport) {
  const m = report.metrics;
  const tracked = report.trackedSales.count > 0 || report.trackedSales.revenue > 0;
  const purchases = tracked ? report.trackedSales.count : (m?.purchases ?? 0);
  const revenue = tracked ? report.trackedSales.revenue : (m?.purchaseValue ?? 0);
  const derived = deriveMetrics({
    totalSpent: m?.totalSpent ?? 0,
    totalImpressions: m?.totalImpressions ?? 0,
    totalClicks: m?.totalClicks ?? 0,
    instagramProfileVisits: m?.instagramProfileVisits ?? 0,
    messagesInitiated: m?.messagesInitiated ?? 0,
    purchases,
    cpm: m?.cpm ?? 0,
    ctr: m?.ctr ?? 0,
    costPerClick: m?.costPerClick ?? 0,
    costPerProfileVisit: m?.costPerProfileVisit ?? 0,
    costPerMessage: m?.costPerMessage ?? 0,
    costPerPurchase: m?.costPerPurchase ?? 0,
  });

  return {
    spend: m?.totalSpent ?? 0,
    reach: m?.totalReach ?? 0,
    impressions: m?.totalImpressions ?? 0,
    visits: m?.instagramProfileVisits ?? 0,
    followers: m?.newInstagramFollowers ?? 0,
    clicks: m?.totalClicks ?? 0,
    messages: m?.messagesInitiated ?? 0,
    purchases,
    revenue,
    roas: m && m.totalSpent > 0 ? revenue / m.totalSpent : 0,
    cpa: purchases > 0 ? (m?.totalSpent ?? 0) / purchases : 0,
    costPerVisit: derived.costPerProfileVisit ?? 0,
    cpm: derived.cpm ?? 0,
    ctr: derived.ctr ?? 0,
    cpc: derived.costPerClick ?? 0,
    costPerMessage: derived.costPerMessage ?? 0,
    videoRetention: m?.videoRetentionRate ?? 0,
  };
}

const rows: Array<{ label: string; key: keyof ReturnType<typeof metricsFor>; format: (v: number) => string }> = [
  { label: "Investimento", key: "spend", format: formatCurrency },
  { label: "Faturamento", key: "revenue", format: formatCurrency },
  { label: "Compras", key: "purchases", format: formatNumber },
  { label: "ROAS", key: "roas", format: (v) => `${v.toFixed(2)}x` },
  { label: "Custo por compra", key: "cpa", format: (v) => v > 0 ? formatCurrency(v) : "—" },
  { label: "Alcance", key: "reach", format: formatNumber },
  { label: "Impressões", key: "impressions", format: formatNumber },
  { label: "Cliques", key: "clicks", format: formatNumber },
  { label: "CTR", key: "ctr", format: formatPercentage },
  { label: "CPC", key: "cpc", format: (v) => v > 0 ? formatCurrency(v) : "—" },
  { label: "Visitas ao perfil", key: "visits", format: formatNumber },
  { label: "Custo por visita", key: "costPerVisit", format: (v) => v > 0 ? formatCurrency(v) : "—" },
  { label: "Mensagens", key: "messages", format: formatNumber },
  { label: "Custo por mensagem", key: "costPerMessage", format: (v) => v > 0 ? formatCurrency(v) : "—" },
  { label: "Novos seguidores", key: "followers", format: formatNumber },
  { label: "CPM", key: "cpm", format: (v) => v > 0 ? formatCurrency(v) : "—" },
  { label: "Retenção de vídeo", key: "videoRetention", format: formatPercentage },
];

function Variation({ before, after, lowerIsBetter = false }: { before: number; after: number; lowerIsBetter?: boolean }) {
  if (before === 0) return <span className="text-white/30">—</span>;
  const change = ((after - before) / Math.abs(before)) * 100;
  if (change === 0) return <span className="text-white/45">0,0%</span>;
  const favorable = lowerIsBetter ? change < 0 : change > 0;
  const Icon = change > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${favorable ? "text-emerald-400" : "text-rose-400"}`}>
      <Icon className="h-3.5 w-3.5" /> {Math.abs(change).toFixed(1)}%
    </span>
  );
}

export default function ClientPortal() {
  const [location] = useLocation();
  const token = location.match(/^\/portal\/([A-Za-z0-9_-]{40})\/?$/)?.[1] ?? "";
  const { data, isLoading, error } = trpc.clientPortal.get.useQuery(
    { token },
    { enabled: token.length === 40 }
  );
  const reports = data?.reports ?? [];
  const [previousId, setPreviousId] = useState("");
  const [currentId, setCurrentId] = useState("");

  useEffect(() => {
    if (!reports.length) return;
    setCurrentId((current) => reports.some((report) => String(report.id) === current) ? current : String(reports[0].id));
    setPreviousId((previous) => reports.some((report) => String(report.id) === previous)
      ? previous
      : reports.length > 1 ? String(reports[1].id) : "");
  }, [reports]);

  const previous = useMemo(() => reports.find((report) => String(report.id) === previousId), [reports, previousId]);
  const current = useMemo(() => reports.find((report) => String(report.id) === currentId), [reports, currentId]);
  const previousMetrics = previous ? metricsFor(previous) : null;
  const currentMetrics = current ? metricsFor(current) : null;

  if (isLoading) {
    return <div className="min-h-screen bg-[#030509] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!data || error || !token) {
    return (
      <main className="min-h-screen bg-[#030509] text-white flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <BarChart3 className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold">Portal indisponível</h1>
          <p className="text-sm text-white/50 mt-2">Este link é inválido ou foi desativado. Peça um novo link ao responsável pela conta.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#030509] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 sm:py-12 space-y-8">
        <header className="border-b border-white/10 pb-6">
          <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">Portal de resultados</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">{data.companyName}</h1>
          <p className="text-sm text-white/45 mt-2">Relatórios publicados e comparação de períodos.</p>
        </header>

        {reports.length === 0 ? (
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="font-semibold">Ainda não há relatórios publicados.</p>
            <p className="text-sm text-white/45 mt-2">Quando um relatório for publicado, ele aparecerá aqui.</p>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-white/60">
                Período anterior
                <select value={previousId} onChange={(event) => setPreviousId(event.target.value)} className="mt-2 w-full h-11 rounded-lg border border-white/10 bg-[#101722] px-3 text-white outline-none focus:border-primary/60">
                  <option value="">Selecione um período</option>
                  {reports.map((report) => <option key={report.id} value={report.id}>{reportLabel(report)}</option>)}
                </select>
              </label>
              <label className="text-sm text-white/60">
                Período atual
                <select value={currentId} onChange={(event) => setCurrentId(event.target.value)} className="mt-2 w-full h-11 rounded-lg border border-white/10 bg-[#101722] px-3 text-white outline-none focus:border-primary/60">
                  <option value="">Selecione um período</option>
                  {reports.map((report) => <option key={report.id} value={report.id}>{reportLabel(report)}</option>)}
                </select>
              </label>
            </section>

            {current && (
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs text-white/45">Investimento no período atual</p>
                  <p className="text-xl font-bold mt-2">{formatCurrency(currentMetrics?.spend ?? 0)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs text-white/45">Vendas registradas</p>
                  <p className="text-xl font-bold mt-2">{formatNumber(currentMetrics?.purchases ?? 0)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs text-white/45">Faturamento registrado</p>
                  <p className="text-xl font-bold mt-2">{formatCurrency(currentMetrics?.revenue ?? 0)}</p>
                </div>
              </section>
            )}

            <section className="rounded-xl border border-white/10 overflow-hidden">
              <div className="px-4 py-4 border-b border-white/10">
                <h2 className="font-semibold">Comparativo de desempenho</h2>
                <p className="text-xs text-white/40 mt-1">A variação compara o período atual com o anterior.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="bg-white/[0.03] text-xs text-white/45">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Indicador</th>
                      <th className="text-right font-medium px-4 py-3">Anterior</th>
                      <th className="text-right font-medium px-4 py-3">Atual</th>
                      <th className="text-right font-medium px-4 py-3">Variação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rows.map((row) => {
                      const before = previousMetrics?.[row.key] ?? 0;
                      const after = currentMetrics?.[row.key] ?? 0;
                      return (
                        <tr key={row.key}>
                          <th className="text-left font-medium text-white/70 px-4 py-3">{row.label}</th>
                          <td className="text-right text-white/60 px-4 py-3">{previous ? row.format(before) : "—"}</td>
                          <td className="text-right font-semibold px-4 py-3">{current ? row.format(after) : "—"}</td>
                      <td className="text-right px-4 py-3">{previous && current ? <Variation before={before} after={after} lowerIsBetter={["spend", "cpa", "cpc", "costPerVisit", "costPerMessage", "cpm"].includes(row.key)} /> : <span className="text-white/30">—</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-semibold mb-3">Relatórios disponíveis</h2>
              <div className="divide-y divide-white/5 border-y border-white/10">
                {reports.map((report) => (
                  <article key={report.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{report.title}</h3>
                      <p className="text-xs text-white/45 mt-1">{displayDate(report.startDate)} a {displayDate(report.endDate)}</p>
                    </div>
                    {report.description && <p className="text-sm text-white/55 sm:max-w-md">{report.description}</p>}
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
        <footer className="text-center text-[11px] text-white/25 pt-3">Dados dos relatórios publicados por {data.companyName}</footer>
      </div>
    </main>
  );
}
