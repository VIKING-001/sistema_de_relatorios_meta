import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, Copy, Download } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from "@shared/metrics";
import { displayDate } from "@shared/dateParser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ConsultiveReport from "@/components/ConsultiveReport";
import FunnelChart from "@/components/FunnelChart";

export default function PublicReport() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = trpc.report.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-orange-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-orange-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Relatório não encontrado</h1>
          <p className="text-gray-400">O relatório que você está procurando não existe ou não está publicado.</p>
        </div>
      </div>
    );
  }

  const { report, metrics, company } = data;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado!");
  };

  const handleDownload = () => {
    toast.info("Download em PDF em breve!");
  };

  const m = metrics as any;
  const purchases = parseInt(m?.purchases ?? "0", 10) || 0;
  const purchaseValue = parseFloat(m?.purchaseValue ?? "0") || 0;
  const costPerPurchase = parseFloat(m?.costPerPurchase ?? "0") || 0;
  const costPerMessage = parseFloat(m?.costPerMessage ?? "0") || 0;
  const hasPurchases = purchases > 0 || purchaseValue > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-orange-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" />
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{company?.name}</h1>
            <p className="text-sm text-cyan-300 mt-0.5">{report.title}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCopyUrl} variant="outline" size="sm"
              className="border-white/20 text-white hover:bg-white/10">
              <Copy className="h-4 w-4 mr-2" />Copiar Link
            </Button>
            <Button onClick={handleDownload} size="sm"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
              <Download className="h-4 w-4 mr-2" />Baixar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        {/* Período */}
        <div className="mb-10 text-center">
          <p className="text-lg text-cyan-300 font-bold">
            Período: {displayDate(report.startDate)} a{" "}
            {displayDate(report.endDate)}
          </p>
          {report.description && <p className="text-gray-400 mt-2">{report.description}</p>}
        </div>

        {metrics && (
          <>
            {/* Alcance e Impressões */}
            <SectionTitle>📊 Alcance e Impressões</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <MetricCard label="Alcance Instagram" value={formatNumber(metrics.instagramReach)} icon="📱" />
              <MetricCard label="Alcance Total" value={formatNumber(metrics.totalReach)} icon="🌍" />
              <MetricCard label="Impressões" value={formatNumber(metrics.totalImpressions)} icon="👁️" />
              <MetricCard label="Visitas Perfil IG" value={formatNumber(metrics.instagramProfileVisits)} icon="🏠" />
            </div>

            {/* Engajamento */}
            <SectionTitle>⭐ Engajamento</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <MetricCard label="Novos Seguidores" value={formatNumber(metrics.newInstagramFollowers)} icon="⭐" />
              <MetricCard label="Visitas via Campanhas" value={formatNumber(metrics.profileVisitsThroughCampaigns)} icon="🔗" />
              <MetricCard label="Retenção de Vídeo" value={formatPercentage(parseFloat(metrics.videoRetentionRate))} icon="🎬" />
              <MetricCard label="CTR (Taxa de Cliques)" value={formatPercentage(parseFloat(metrics.ctr))} icon="📈" />
            </div>

            {/* Mensagens */}
            <SectionTitle>💬 Mensagens</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <MetricCard label="Mensagens Iniciadas" value={formatNumber(metrics.messagesInitiated)} icon="💬" />
              <MetricCard
                label="Custo por Mensagem"
                value={costPerMessage > 0 ? formatCurrency(costPerMessage) : "—"}
                icon="💵"
              />
            </div>

            {/* Investimento */}
            <SectionTitle>💰 Investimento</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <MetricCard label="Valor Investido" value={formatCurrency(parseFloat(metrics.totalSpent))} icon="💰" highlight />
              <MetricCard label="Cliques Totais" value={formatNumber(metrics.totalClicks)} icon="🖱️" />
              <MetricCard label="CPC" value={formatCurrency(parseFloat(metrics.costPerClick))} icon="💵" />
              <MetricCard label="CPM" value={formatCurrency(parseFloat(metrics.cpm))} icon="📊" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <MetricCard label="Custo por Visita" value={formatCurrency(parseFloat(metrics.costPerProfileVisit))} icon="💳" />
            </div>

            {/* Conversões — só mostra se tiver dados */}
            {hasPurchases && (
              <>
                <SectionTitle color="text-emerald-300">🛒 Conversões e Compras</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                  <MetricCard
                    label="Nº de Compras"
                    value={formatNumber(purchases)}
                    icon="🛒"
                    highlight
                    highlightColor="from-emerald-500/20 to-teal-600/20 border-emerald-500/50 hover:border-emerald-400"
                  />
                  <MetricCard
                    label="Valor Faturado (Conversões)"
                    value={formatCurrency(purchaseValue)}
                    icon="💎"
                    highlight
                    highlightColor="from-emerald-500/20 to-teal-600/20 border-emerald-500/50 hover:border-emerald-400"
                  />
                  <MetricCard
                    label="Custo por Compra"
                    value={costPerPurchase > 0 ? formatCurrency(costPerPurchase) : "—"}
                    icon="🏷️"
                  />
                </div>
              </>
            )}

            {/* Funil de Marketing */}
            <div className="mt-10 bg-white/5 border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-2">🔻 Funil de Marketing</h2>
              <p className="text-sm text-gray-400 mb-6">Jornada completa do usuário — desde a impressão até a conversão</p>
              <FunnelChart
                dark
                totalImpressions={metrics.totalImpressions}
                totalReach={metrics.totalReach}
                totalClicks={metrics.totalClicks}
                instagramProfileVisits={metrics.instagramProfileVisits}
                messagesInitiated={metrics.messagesInitiated}
                purchases={purchases}
                totalSpent={parseFloat(metrics.totalSpent)}
                costPerClick={parseFloat(metrics.costPerClick)}
                costPerProfileVisit={parseFloat(metrics.costPerProfileVisit)}
                costPerMessage={costPerMessage}
                costPerPurchase={costPerPurchase}
                purchaseValue={purchaseValue}
              />
            </div>

            {/* Resumo Executivo */}
            <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Resumo Executivo</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-white/10">
                    <TableRow label="Período"
                      value={`${displayDate(report.startDate)} a ${displayDate(report.endDate)}`} />
                    <TableRow label="Alcance Total" value={formatNumber(metrics.totalReach)} />
                    <TableRow label="Impressões" value={formatNumber(metrics.totalImpressions)} />
                    <TableRow label="Investimento Total" value={formatCurrency(parseFloat(metrics.totalSpent))} />
                    <TableRow label="Cliques" value={formatNumber(metrics.totalClicks)} />
                    <TableRow label="CPC" value={formatCurrency(parseFloat(metrics.costPerClick))} />
                    <TableRow label="CPM" value={formatCurrency(parseFloat(metrics.cpm))} />
                    <TableRow label="CTR" value={formatPercentage(parseFloat(metrics.ctr))} />
                    <TableRow label="Mensagens Iniciadas" value={formatNumber(metrics.messagesInitiated)} />
                    {costPerMessage > 0 && <TableRow label="Custo por Mensagem" value={formatCurrency(costPerMessage)} />}
                    {hasPurchases && (
                      <>
                        <TableRow label="Compras / Conversões" value={formatNumber(purchases)} />
                        <TableRow label="Valor Faturado (Conversões)" value={formatCurrency(purchaseValue)} />
                        {costPerPurchase > 0 && <TableRow label="Custo por Compra" value={formatCurrency(costPerPurchase)} />}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Relatório Consultivo */}
            <ConsultiveReport
              metrics={{
                ctr: parseFloat(metrics.ctr),
                cpm: parseFloat(metrics.cpm),
                totalReach: metrics.totalReach,
                totalImpressions: metrics.totalImpressions,
                totalSpent: parseFloat(metrics.totalSpent),
                totalClicks: metrics.totalClicks,
                costPerClick: parseFloat(metrics.costPerClick),
                videoRetentionRate: parseFloat(metrics.videoRetentionRate),
                newInstagramFollowers: metrics.newInstagramFollowers,
                messagesInitiated: metrics.messagesInitiated,
                instagramProfileVisits: metrics.instagramProfileVisits,
                costPerProfileVisit: parseFloat(metrics.costPerProfileVisit),
              }}
            />
          </>
        )}
      </main>

      <footer className="border-t border-white/10 bg-black/30 backdrop-blur-md mt-16 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-400 text-sm">
          <p>Relatório gerado em {new Date().toLocaleDateString("pt-BR")}</p>
        </div>
      </footer>
    </div>
  );
}

// ── Componentes auxiliares ─────────────────────────────────────────────────────

function SectionTitle({ children, color = "text-white" }: { children: React.ReactNode; color?: string }) {
  return (
    <h2 className={`text-sm font-bold uppercase tracking-widest ${color} mb-4 mt-8 first:mt-0 flex items-center gap-2`}>
      {children}
    </h2>
  );
}

function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-3 text-gray-400">{label}</td>
      <td className="py-3 text-white font-semibold">{value}</td>
    </tr>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
  highlightColor?: string;
}

function MetricCard({ label, value, icon, highlight, highlightColor }: MetricCardProps) {
  const defaultHighlight = "from-cyan-500/20 to-blue-600/20 border-cyan-500/50 hover:border-cyan-400";
  return (
    <div
      className={`rounded-xl p-5 backdrop-blur-sm border transition-all ${
        highlight
          ? `bg-gradient-to-br ${highlightColor || defaultHighlight}`
          : "bg-white/5 border-white/10 hover:border-cyan-500/30"
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <p className="text-gray-400 text-xs mt-3 mb-1 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}
