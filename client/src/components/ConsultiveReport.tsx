import { analyzeMetrics, MetricsAnalysis } from "@shared/analytics";
import { AlertCircle, TrendingUp, TrendingDown, CheckCircle, AlertTriangle } from "lucide-react";

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
  };
}

export default function ConsultiveReport({ metrics }: ConsultiveReportProps) {
  const analysis = analyzeMetrics(metrics);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excelente":
        return "bg-green-500/20 border-green-500/50 text-green-300";
      case "bom":
        return "bg-blue-500/20 border-blue-500/50 text-blue-300";
      case "aceitavel":
        return "bg-yellow-500/20 border-yellow-500/50 text-yellow-300";
      case "ruim":
        return "bg-red-500/20 border-red-500/50 text-red-300";
      default:
        return "bg-white/5 border-white/10 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excelente":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "bom":
        return <TrendingUp className="h-5 w-5 text-blue-400" />;
      case "aceitavel":
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case "ruim":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="mt-12 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">📋 Relatório Consultivo</h2>
        <p className="text-gray-400">Análise detalhada de performance e recomendações personalizadas</p>
      </div>

      {/* Resumo Geral */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-8">
        <h3 className="text-2xl font-bold text-white mb-6">Visão Geral</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pontos Fortes */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <h4 className="text-xl font-bold text-green-300">Pontos Fortes</h4>
            </div>
            <ul className="space-y-2">
              {analysis.resumoGeral.pontosFortesTexto.length > 0 ? (
                analysis.resumoGeral.pontosFortesTexto.map((ponto, idx) => (
                  <li key={idx} className="text-green-200 flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>{ponto}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-400">Nenhum ponto forte identificado no momento</li>
              )}
            </ul>
          </div>

          {/* Pontos a Melhorar */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <h4 className="text-xl font-bold text-red-300">Oportunidades de Melhoria</h4>
            </div>
            <ul className="space-y-2">
              {analysis.resumoGeral.pontosFracosTexto.length > 0 ? (
                analysis.resumoGeral.pontosFracosTexto.map((ponto, idx) => (
                  <li key={idx} className="text-red-200 flex items-start gap-2">
                    <span className="text-red-400 mt-1">!</span>
                    <span>{ponto}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-400">Nenhuma oportunidade identificada</li>
              )}
            </ul>
          </div>
        </div>

        {/* Recomendação Principal */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/50 rounded-lg p-6">
          <h4 className="text-lg font-bold text-cyan-300 mb-2">💡 Recomendação Principal</h4>
          <p className="text-white">{analysis.resumoGeral.recomendacaoPrincipal}</p>
        </div>
      </div>

      {/* Análise Detalhada por Métrica */}
      <div className="space-y-6">
        {/* CTR */}
        <MetricAnalysisCard
          title="Taxa de Cliques (CTR)"
          icon="📊"
          value={`${analysis.ctr.value.toFixed(2)}%`}
          benchmark={`Benchmark: ${analysis.ctr.benchmark}%`}
          status={analysis.ctr.status}
          insight={analysis.ctr.insight}
          recomendacao={analysis.ctr.recomendacao}
          statusIcon={getStatusIcon(analysis.ctr.status)}
          statusColor={getStatusColor(analysis.ctr.status)}
        />

        {/* CPM */}
        <MetricAnalysisCard
          title="Custo por 1000 Impressões (CPM)"
          icon="💰"
          value={`R$ ${analysis.cpm.value.toFixed(2)}`}
          benchmark={`Benchmark: R$ ${analysis.cpm.benchmark.toFixed(2)}`}
          status={analysis.cpm.status}
          insight={analysis.cpm.insight}
          recomendacao={analysis.cpm.recomendacao}
          statusIcon={getStatusIcon(analysis.cpm.status)}
          statusColor={getStatusColor(analysis.cpm.status)}
        />

        {/* Alcance */}
        <MetricAnalysisCard
          title="Alcance e Frequência"
          icon="🌍"
          value={`${analysis.alcance.value.toLocaleString("pt-BR")} pessoas`}
          benchmark={`Frequência: ${analysis.alcance.frequencia.toFixed(2)}x`}
          status={analysis.alcance.status}
          insight={analysis.alcance.insight}
          recomendacao={analysis.alcance.recomendacao}
          statusIcon={getStatusIcon(analysis.alcance.status)}
          statusColor={getStatusColor(analysis.alcance.status)}
        />

        {/* Engajamento */}
        <MetricAnalysisCard
          title="Engajamento"
          icon="💬"
          value={`${analysis.engajamento.seguidores} seguidores`}
          benchmark={`${analysis.engajamento.mensagens} mensagens • ${analysis.engajamento.visitasProfile.toLocaleString("pt-BR")} visitas`}
          status={analysis.engajamento.status}
          insight={analysis.engajamento.insight}
          recomendacao={analysis.engajamento.recomendacao}
          statusIcon={getStatusIcon(analysis.engajamento.status)}
          statusColor={getStatusColor(analysis.engajamento.status)}
        />

        {/* Vídeo */}
        <MetricAnalysisCard
          title="Retenção de Vídeo"
          icon="🎬"
          value={`${analysis.video.retencao.toFixed(2)}%`}
          benchmark="Métrica de qualidade de conteúdo"
          status={analysis.video.status}
          insight={analysis.video.insight}
          recomendacao={analysis.video.recomendacao}
          statusIcon={getStatusIcon(analysis.video.status)}
          statusColor={getStatusColor(analysis.video.status)}
        />

        {/* Investimento */}
        <MetricAnalysisCard
          title="Eficiência de Investimento"
          icon="📈"
          value={`R$ ${analysis.investimento.gasto.toFixed(2)} investidos`}
          benchmark={`CPC: R$ ${analysis.investimento.custoPorClique.toFixed(2)} • CPV: R$ ${analysis.investimento.custoPorVisita.toFixed(2)}`}
          status={analysis.investimento.status}
          insight={analysis.investimento.insight}
          recomendacao={analysis.investimento.recomendacao}
          statusIcon={getStatusIcon(analysis.investimento.status)}
          statusColor={getStatusColor(analysis.investimento.status)}
        />
      </div>

      {/* Conclusão */}
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-lg p-8">
        <h3 className="text-2xl font-bold text-white mb-4">🎯 Próximos Passos</h3>
        <ol className="space-y-3 text-gray-300">
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold">1.</span>
            <span>Priorize as oportunidades de melhoria identificadas acima</span>
          </li>
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold">2.</span>
            <span>Teste novos criativos e públicos-alvo para otimizar performance</span>
          </li>
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold">3.</span>
            <span>Monitore as métricas semanalmente para acompanhar progresso</span>
          </li>
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold">4.</span>
            <span>Aloque mais orçamento para campanhas com melhor performance</span>
          </li>
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold">5.</span>
            <span>Pause ou otimize campanhas com baixo desempenho</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

interface MetricAnalysisCardProps {
  title: string;
  icon: string;
  value: string;
  benchmark: string;
  status: string;
  insight: string;
  recomendacao: string;
  statusIcon: React.ReactNode;
  statusColor: string;
}

function MetricAnalysisCard({
  title,
  icon,
  value,
  benchmark,
  status,
  insight,
  recomendacao,
  statusIcon,
  statusColor,
}: MetricAnalysisCardProps) {
  return (
    <div className={`border rounded-lg p-6 ${statusColor}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h4 className="text-lg font-bold">{title}</h4>
            <p className="text-sm opacity-80">{benchmark}</p>
          </div>
        </div>
        {statusIcon}
      </div>

      <div className="mb-4 pb-4 border-b border-white/20">
        <p className="text-2xl font-bold">{value}</p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase opacity-75 mb-1">Análise</p>
          <p className="text-sm leading-relaxed">{insight}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase opacity-75 mb-1">Recomendação</p>
          <p className="text-sm leading-relaxed">{recomendacao}</p>
        </div>
      </div>
    </div>
  );
}
