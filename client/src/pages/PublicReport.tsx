import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, Copy, Download } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from "@shared/metrics";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
    // Implementar download em PDF futuramente
    toast.info("Download em PDF em breve!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-orange-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{company?.name}</h1>
            <p className="text-sm text-cyan-300 mt-1">{report.title}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCopyUrl}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
            <Button
              onClick={handleDownload}
              size="sm"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* Period Info */}
        <div className="mb-12 text-center">
          <p className="text-lg text-cyan-300 font-bold">
            Período: {new Date(report.startDate).toLocaleDateString("pt-BR")} a{" "}
            {new Date(report.endDate).toLocaleDateString("pt-BR")}
          </p>
          {report.description && (
            <p className="text-gray-400 mt-2">{report.description}</p>
          )}
        </div>

        {/* Metrics Grid */}
        {metrics && (
          <>
            {/* Row 1: Alcance e Impressões */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                label="Alcance Instagram"
                value={formatNumber(metrics.instagramReach)}
                icon="📱"
              />
              <MetricCard
                label="Alcance Total"
                value={formatNumber(metrics.totalReach)}
                icon="🌍"
              />
              <MetricCard
                label="Total de Impressões"
                value={formatNumber(metrics.totalImpressions)}
                icon="👁️"
              />
              <MetricCard
                label="Visitas Perfil Instagram"
                value={formatNumber(metrics.instagramProfileVisits)}
                icon="🏠"
              />
            </div>

            {/* Row 2: Engajamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                label="Novos Seguidores"
                value={formatNumber(metrics.newInstagramFollowers)}
                icon="⭐"
              />
              <MetricCard
                label="Mensagens Iniciadas"
                value={formatNumber(metrics.messagesInitiated)}
                icon="💬"
              />
              <MetricCard
                label="Visitas através Campanhas"
                value={formatNumber(metrics.profileVisitsThroughCampaigns)}
                icon="🔗"
              />
              <MetricCard
                label="Retenção de Vídeo"
                value={formatPercentage(parseFloat(metrics.videoRetentionRate))}
                icon="🎬"
              />
            </div>

            {/* Row 3: Investimento */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                label="Valor Gasto"
                value={formatCurrency(parseFloat(metrics.totalSpent))}
                icon="💰"
                highlight
              />
              <MetricCard
                label="Total de Cliques"
                value={formatNumber(metrics.totalClicks)}
                icon="🖱️"
              />
              <MetricCard
                label="Custo por Clique"
                value={formatCurrency(parseFloat(metrics.costPerClick))}
                icon="💵"
              />
              <MetricCard
                label="CPM"
                value={formatCurrency(parseFloat(metrics.cpm))}
                icon="📊"
              />
            </div>

            {/* Row 4: Métricas Calculadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <MetricCard
                label="CTR (Taxa de Cliques)"
                value={formatPercentage(parseFloat(metrics.ctr))}
                icon="📈"
              />
              <MetricCard
                label="Custo por Visita"
                value={formatCurrency(parseFloat(metrics.costPerProfileVisit))}
                icon="💳"
              />
            </div>

            {/* Summary Table */}
            <div className="mt-12 bg-white/5 border border-white/10 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Resumo Executivo</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-white/10">
                    <tr className="border-b border-white/10">
                      <td className="py-3 text-gray-400">Período</td>
                      <td className="py-3 text-white font-semibold">
                        {new Date(report.startDate).toLocaleDateString("pt-BR")} a{" "}
                        {new Date(report.endDate).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 text-gray-400">Alcance Total</td>
                      <td className="py-3 text-white font-semibold">{formatNumber(metrics.totalReach)}</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 text-gray-400">Impressões</td>
                      <td className="py-3 text-white font-semibold">{formatNumber(metrics.totalImpressions)}</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 text-gray-400">Investimento Total</td>
                      <td className="py-3 text-white font-semibold">{formatCurrency(parseFloat(metrics.totalSpent))}</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 text-gray-400">Cliques</td>
                      <td className="py-3 text-white font-semibold">{formatNumber(metrics.totalClicks)}</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 text-gray-400">CPM (Custo por 1000 impressões)</td>
                      <td className="py-3 text-white font-semibold">{formatCurrency(parseFloat(metrics.cpm))}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-400">CTR (Taxa de Cliques)</td>
                      <td className="py-3 text-white font-semibold">{formatPercentage(parseFloat(metrics.ctr))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/30 backdrop-blur-md mt-16 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-400 text-sm">
          <p>Relatório gerado em {new Date().toLocaleDateString("pt-BR")}</p>
        </div>
      </footer>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}

function MetricCard({ label, value, icon, highlight }: MetricCardProps) {
  return (
    <div
      className={`rounded-lg p-6 backdrop-blur-sm border transition-all ${
        highlight
          ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/50 hover:border-cyan-400"
          : "bg-white/5 border-white/10 hover:border-cyan-500/50"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
