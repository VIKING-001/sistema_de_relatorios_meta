import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Eye,
  Gauge,
  MessageCircle,
  MousePointerClick,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  deriveMetrics,
  formatCurrency,
  formatNumber,
  formatPercentage,
} from "@shared/metrics";
import { displayDate } from "@shared/dateParser";
import ConsultiveReport from "@/components/ConsultiveReport";
import FunnelChart from "@/components/FunnelChart";

type ReportMetrics = {
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
  sitePurchases: number | null;
  whatsappPurchases: number | null;
  purchaseValue: number;
  costPerPurchase: number;
  costPerMessage: number;
};

type PortalReport = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  description: string | null;
  aiAnalysis: string | null;
  trackedSales: { count: number; revenue: number };
  metrics: ReportMetrics | null;
};

type MetricValue = {
  spend: number;
  reach: number;
  impressions: number;
  visits: number;
  followers: number;
  clicks: number;
  messages: number;
  purchases: number;
  sitePurchases: number | null;
  whatsappPurchases: number | null;
  revenue: number;
  roas: number;
  cpa: number;
  costPerVisit: number;
  cpm: number;
  ctr: number;
  cpc: number;
  costPerMessage: number;
  videoRetention: number;
  trackedSales: boolean;
};

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
  tone?: "gold" | "green" | "blue" | "pink";
  compact?: boolean;
};

const toneStyles = {
  gold: "bg-[#ffb81a]/10 text-[#ffcf62]",
  green: "bg-emerald-400/10 text-emerald-300",
  blue: "bg-sky-400/10 text-sky-300",
  pink: "bg-pink-400/10 text-pink-300",
};

function reportLabel(report: PortalReport) {
  return `${report.title} · ${displayDate(report.startDate)} a ${displayDate(report.endDate)}`;
}

function metricsFor(report: PortalReport): MetricValue {
  const m = report.metrics;
  const trackedSales = report.trackedSales ?? { count: 0, revenue: 0 };
  const hasTrackedSales = trackedSales.count > 0 || trackedSales.revenue > 0;
  const purchases = hasTrackedSales ? trackedSales.count : (m?.purchases ?? 0);
  const revenue = hasTrackedSales
    ? trackedSales.revenue
    : (m?.purchaseValue ?? 0);
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
    sitePurchases: m?.sitePurchases == null ? null : Number(m.sitePurchases),
    whatsappPurchases:
      m?.whatsappPurchases == null ? null : Number(m.whatsappPurchases),
    revenue,
    roas: m && m.totalSpent > 0 ? revenue / m.totalSpent : 0,
    cpa: purchases > 0 ? (m?.totalSpent ?? 0) / purchases : 0,
    costPerVisit: derived.costPerProfileVisit ?? 0,
    cpm: derived.cpm ?? 0,
    ctr: derived.ctr ?? 0,
    cpc: derived.costPerClick ?? 0,
    costPerMessage: derived.costPerMessage ?? 0,
    videoRetention: m?.videoRetentionRate ?? 0,
    trackedSales: hasTrackedSales,
  };
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "gold",
  compact = false,
}: MetricCardProps) {
  return (
    <article
      className={`min-w-0 rounded-xl border border-white/8 bg-[#111820] ${compact ? "p-3" : "p-4 sm:p-5"}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${toneStyles[tone]}`}
        >
          <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-5 text-[#a4afbb]">
            {label}
          </p>
          <p
            className={`mt-1 break-words font-semibold tabular-nums text-white ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}
          >
            {value}
          </p>
          {detail && (
            <p className="mt-1 text-xs leading-5 text-[#a4afbb]">{detail}</p>
          )}
        </div>
      </div>
    </article>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
  id,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  id?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#ffb81a]/10 text-[#ffcf62]">
        <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
      </span>
      <div>
        <h3 id={id} className="text-base font-semibold text-white sm:text-lg">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-5 text-[#a4afbb]">{description}</p>
      </div>
    </div>
  );
}

function PeriodFunnel({
  report,
  compact = false,
}: {
  report: PortalReport;
  compact?: boolean;
}) {
  const values = metricsFor(report);
  const hasData =
    [
      values.impressions,
      values.reach,
      values.clicks,
      values.visits,
      values.messages,
      values.purchases,
    ].filter(value => value > 0).length >= 2;

  return (
    <section aria-labelledby={`funnel-${report.id}`}>
      <SectionHeading
        id={`funnel-${report.id}`}
        icon={Target}
        title="Funil de marketing"
        description="Acompanhe a jornada do público, das exibições até as conversas e compras registradas."
      />
      {hasData ? (
        <FunnelChart
          dark
          compact={compact}
          totalImpressions={values.impressions}
          totalReach={values.reach}
          totalClicks={values.clicks}
          instagramProfileVisits={values.visits}
          messagesInitiated={values.messages}
          purchases={values.purchases}
          totalSpent={values.spend}
          costPerClick={values.cpc}
          costPerProfileVisit={values.costPerVisit}
          costPerMessage={values.costPerMessage}
          costPerPurchase={values.cpa}
          purchaseValue={values.revenue}
        />
      ) : (
        <div
          className="rounded-xl border border-white/10 bg-[#111820] p-4 text-sm leading-6 text-[#c4cbd2]"
          role="status"
        >
          Ainda não há dados suficientes para desenhar o funil deste período.
          Quando pelo menos duas etapas tiverem volume registrado, o gráfico
          aparecerá aqui.
        </div>
      )}
      <p className="mt-2 text-xs leading-5 text-[#a4afbb]">
        As etapas mostram os volumes registrados em cada indicador. Uma mesma
        pessoa pode aparecer em mais de uma etapa.
      </p>
    </section>
  );
}

function PeriodAnalysis({ report }: { report: PortalReport }) {
  const values = metricsFor(report);

  if (!report.metrics) {
    return (
      <section
        className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4"
        aria-label={`Análise de performance: ${report.title}`}
        role="status"
      >
        <h3 className="font-semibold text-white">
          Análise indisponível para este período
        </h3>
        <p className="mt-1 text-sm leading-6 text-[#c4cbd2]">
          Este relatório ainda não tem métricas registradas.
        </p>
      </section>
    );
  }

  return (
    <section aria-label={`Análise de performance: ${report.title}`}>
      <ConsultiveReport
        periodo={report.title}
        aiAnalysis={report.aiAnalysis}
        metrics={{
          ctr: values.ctr,
          cpm: values.cpm,
          totalReach: values.reach,
          totalImpressions: values.impressions,
          totalSpent: values.spend,
          totalClicks: values.clicks,
          costPerClick: values.cpc,
          videoRetentionRate: values.videoRetention,
          newInstagramFollowers: values.followers,
          messagesInitiated: values.messages,
          instagramProfileVisits: values.visits,
          costPerProfileVisit: values.costPerVisit,
          purchases: values.purchases,
          purchaseValue: values.revenue,
          costPerPurchase: values.cpa,
          costPerMessage: values.costPerMessage,
        }}
      />
    </section>
  );
}

function PeriodPerformance({
  report,
  compact = false,
}: {
  report: PortalReport;
  compact?: boolean;
}) {
  const values = metricsFor(report);
  const metrics = report.metrics;
  const hasSales = values.purchases > 0 || values.revenue > 0;
  const missing = !metrics;
  const sectionSpace = compact ? "space-y-6" : "space-y-9";

  return (
    <article className={sectionSpace}>
      <header
        className={`rounded-xl border border-white/10 bg-[#111820] ${compact ? "p-4" : "p-5 sm:p-6"}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              className={`${compact ? "text-lg" : "text-xl sm:text-2xl"} font-semibold text-white`}
            >
              {report.title}
            </h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-[#a4afbb]">
              <CalendarDays
                className="h-4 w-4 shrink-0 text-[#ffcf62]"
                aria-hidden="true"
              />
              {displayDate(report.startDate)} a {displayDate(report.endDate)}
            </p>
            {report.description && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#c4cbd2]">
                {report.description}
              </p>
            )}
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-1.5 text-xs font-medium text-emerald-200">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Publicado
          </span>
        </div>
      </header>

      {missing ? (
        <section
          className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-5"
          role="status"
        >
          <h3 className="font-semibold text-white">
            Este período ainda não tem métricas
          </h3>
          <p className="mt-1 text-sm leading-6 text-[#c4cbd2]">
            O relatório foi publicado, mas os indicadores não foram registrados.
            Peça ao responsável para revisar os dados deste período.
          </p>
        </section>
      ) : (
        <>
          <section aria-labelledby={`summary-${report.id}`}>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3
                  id={`summary-${report.id}`}
                  className="text-base font-semibold text-white"
                >
                  Resumo dos resultados
                </h3>
                <p className="mt-1 text-sm text-[#a4afbb]">
                  Os principais números do período, em linguagem direta.
                </p>
              </div>
              {values.trackedSales && (
                <span className="text-xs text-emerald-200">
                  Inclui vendas registradas no sistema
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <MetricCard
                icon={Wallet}
                label="Investimento em anúncios"
                value={formatCurrency(values.spend)}
                detail="Total aplicado no período"
                tone="gold"
                compact
              />
              <MetricCard
                icon={ShoppingBag}
                label="Compras registradas"
                value={formatNumber(values.purchases)}
                detail={
                  hasSales ? "Compras no período" : "Nenhuma compra registrada"
                }
                tone="green"
                compact
              />
              <MetricCard
                icon={Wallet}
                label="Faturamento"
                value={formatCurrency(values.revenue)}
                detail={
                  values.trackedSales
                    ? "Inclui vendas registradas no sistema"
                    : "Valor informado no relatório"
                }
                tone="green"
                compact
              />
              <MetricCard
                icon={Gauge}
                label="Retorno sobre anúncios"
                value={
                  values.roas > 0
                    ? `${values.roas.toFixed(2)}x`
                    : "Sem dados de venda"
                }
                detail={
                  values.roas > 0
                    ? "Faturamento para cada R$ 1 investido"
                    : "Aguardando faturamento registrado"
                }
                tone="blue"
                compact
              />
            </div>
          </section>

          {(values.sitePurchases !== null ||
            values.whatsappPurchases !== null) && (
            <section aria-label="Vendas por canal">
              <SectionHeading
                icon={ShoppingBag}
                title="De onde vieram as vendas"
                description="Separação informada no relatório; não altera o total de compras."
              />
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={ShoppingBag}
                  label="Vendas pelo site"
                  value={
                    values.sitePurchases === null
                      ? "Não informado"
                      : formatNumber(values.sitePurchases)
                  }
                  tone="blue"
                  compact
                />
                <MetricCard
                  icon={MessageCircle}
                  label="Vendas pelo WhatsApp"
                  value={
                    values.whatsappPurchases === null
                      ? "Não informado"
                      : formatNumber(values.whatsappPurchases)
                  }
                  tone="pink"
                  compact
                />
              </div>
            </section>
          )}

          <PeriodFunnel report={report} compact />
          <PeriodAnalysis report={report} />

          <details className="group mt-7 border-y border-white/10">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#dce2e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb81a]">
              Ver outras métricas do período
              <ChevronDown
                className="h-4 w-4 shrink-0 text-[#ffcf62] transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="space-y-8 pb-5 pt-2">
              <section aria-labelledby={`visibility-${report.id}`}>
                <SectionHeading
                  id={`visibility-${report.id}`}
                  icon={Eye}
                  title="Alcance e interesse"
                  description="Quantas pessoas foram alcançadas e como interagiram com os anúncios."
                />
                <div
                  className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${compact ? "2xl:grid-cols-2" : "xl:grid-cols-3"}`}
                >
                  <MetricCard
                    icon={Users}
                    label="Pessoas alcançadas"
                    value={formatNumber(values.reach)}
                    compact={compact}
                  />
                  <MetricCard
                    icon={Eye}
                    label="Exibições dos anúncios"
                    value={formatNumber(values.impressions)}
                    compact={compact}
                  />
                  <MetricCard
                    icon={MousePointerClick}
                    label="Cliques"
                    value={formatNumber(values.clicks)}
                    compact={compact}
                  />
                  <MetricCard
                    icon={Target}
                    label="Taxa de cliques (CTR)"
                    value={
                      values.ctr > 0
                        ? formatPercentage(values.ctr)
                        : "Sem referência"
                    }
                    detail="Percentual de impressões que geraram clique"
                    compact={compact}
                  />
                  <MetricCard
                    icon={Wallet}
                    label="Custo por clique (CPC)"
                    value={
                      values.cpc > 0
                        ? formatCurrency(values.cpc)
                        : "Sem referência"
                    }
                    detail="Calculado pelo investimento e cliques"
                    compact={compact}
                  />
                  <MetricCard
                    icon={BarChart3}
                    label="Custo por mil exibições (CPM)"
                    value={
                      values.cpm > 0
                        ? formatCurrency(values.cpm)
                        : "Sem referência"
                    }
                    detail="Calculado pelo investimento e impressões"
                    compact={compact}
                  />
                </div>
              </section>

              <section aria-labelledby={`conversations-${report.id}`}>
                <SectionHeading
                  id={`conversations-${report.id}`}
                  icon={MessageCircle}
                  title="Visitas e conversas"
                  description="Ações que aproximam o público da empresa e geram oportunidades."
                />
                <div
                  className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${compact ? "2xl:grid-cols-2" : "xl:grid-cols-3"}`}
                >
                  <MetricCard
                    icon={Eye}
                    label="Visitas ao perfil"
                    value={formatNumber(values.visits)}
                    compact={compact}
                  />
                  <MetricCard
                    icon={Wallet}
                    label="Custo por visita"
                    value={
                      values.costPerVisit > 0
                        ? formatCurrency(values.costPerVisit)
                        : "Sem referência"
                    }
                    detail="Calculado quando há visitas registradas"
                    compact={compact}
                  />
                  <MetricCard
                    icon={Users}
                    label="Novos seguidores"
                    value={formatNumber(values.followers)}
                    compact={compact}
                  />
                  <MetricCard
                    icon={MessageCircle}
                    label="Mensagens iniciadas"
                    value={formatNumber(values.messages)}
                    compact={compact}
                  />
                  <MetricCard
                    icon={Wallet}
                    label="Custo por mensagem"
                    value={
                      values.costPerMessage > 0
                        ? formatCurrency(values.costPerMessage)
                        : "Sem referência"
                    }
                    detail="Investimento dividido pelas conversas"
                    tone="pink"
                    compact={compact}
                  />
                  <MetricCard
                    icon={BarChart3}
                    label="Retenção de vídeo"
                    value={
                      values.videoRetention > 0
                        ? formatPercentage(values.videoRetention)
                        : "Sem dado"
                    }
                    compact={compact}
                  />
                </div>
              </section>

              <section aria-labelledby={`sales-${report.id}`}>
                <SectionHeading
                  id={`sales-${report.id}`}
                  icon={ShoppingBag}
                  title="Vendas e retorno"
                  description="Compras e faturamento associados a este relatório."
                />
                <div
                  className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${compact ? "2xl:grid-cols-2" : "xl:grid-cols-4"}`}
                >
                  <MetricCard
                    icon={ShoppingBag}
                    label="Compras"
                    value={formatNumber(values.purchases)}
                    detail={
                      values.trackedSales
                        ? "Registradas no sistema"
                        : "Conversões informadas no relatório"
                    }
                    tone="green"
                    compact={compact}
                  />
                  <MetricCard
                    icon={Wallet}
                    label="Faturamento"
                    value={formatCurrency(values.revenue)}
                    detail={
                      values.revenue > 0
                        ? "Valor total registrado"
                        : "Nenhum faturamento registrado"
                    }
                    tone="green"
                    compact={compact}
                  />
                  <MetricCard
                    icon={Target}
                    label="Custo médio por compra"
                    value={
                      values.cpa > 0
                        ? formatCurrency(values.cpa)
                        : "Sem referência"
                    }
                    detail="Investimento dividido pelas compras"
                    compact={compact}
                  />
                  <MetricCard
                    icon={Gauge}
                    label="Retorno sobre anúncios (ROAS)"
                    value={
                      values.roas > 0
                        ? `${values.roas.toFixed(2)}x`
                        : "Sem referência"
                    }
                    detail="Faturamento dividido pelo investimento"
                    tone="green"
                    compact={compact}
                  />
                </div>
              </section>
            </div>
          </details>
        </>
      )}
    </article>
  );
}

function Variation({
  before,
  after,
  direction = "higher",
}: {
  before: number;
  after: number;
  direction?: "higher" | "lower" | "neutral";
}) {
  if (before === 0 && after === 0)
    return <span className="text-[#a4afbb]">Sem variação</span>;
  if (before === 0)
    return <span className="font-medium text-sky-200">Novo no período</span>;
  const change = ((after - before) / Math.abs(before)) * 100;
  if (change === 0)
    return <span className="text-[#c4cbd2]">Sem alteração</span>;
  if (direction === "neutral") {
    return (
      <span className="text-[#c4cbd2]">
        {Math.abs(change).toFixed(1)}% {change > 0 ? "acima" : "abaixo"}
      </span>
    );
  }
  const favorable = direction === "lower" ? change < 0 : change > 0;
  const Icon = change > 0 ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${favorable ? "text-emerald-300" : "text-rose-300"}`}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />{" "}
      {Math.abs(change).toFixed(1)}% {favorable ? "favorável" : "desfavorável"}
    </span>
  );
}

type NumericMetricKey = Exclude<keyof MetricValue, "trackedSales">;

const comparisonRows: Array<{
  label: string;
  key: NumericMetricKey;
  format: (value: number) => string;
  direction?: "higher" | "lower" | "neutral";
}> = [
  {
    label: "Investimento em anúncios",
    key: "spend",
    format: formatCurrency,
    direction: "neutral",
  },
  { label: "Compras registradas", key: "purchases", format: formatNumber },
  {
    label: "Vendas pelo site",
    key: "sitePurchases",
    format: formatNumber,
  },
  {
    label: "Vendas pelo WhatsApp",
    key: "whatsappPurchases",
    format: formatNumber,
  },
  { label: "Faturamento", key: "revenue", format: formatCurrency },
  {
    label: "Retorno sobre anúncios",
    key: "roas",
    format: value => (value > 0 ? `${value.toFixed(2)}x` : "Sem referência"),
  },
  { label: "Pessoas alcançadas", key: "reach", format: formatNumber },
  { label: "Cliques", key: "clicks", format: formatNumber },
  { label: "Conversas iniciadas", key: "messages", format: formatNumber },
  {
    label: "Custo por conversa",
    key: "costPerMessage",
    format: value => (value > 0 ? formatCurrency(value) : "Sem referência"),
    direction: "lower",
  },
];

function CompareSummary({
  previous,
  current,
}: {
  previous: PortalReport;
  current: PortalReport;
}) {
  const before = metricsFor(previous);
  const after = metricsFor(current);
  const renderRows = (rows: typeof comparisonRows) =>
    rows.map(row => {
      const oldValue = before[row.key];
      const newValue = after[row.key];
      return (
        <div
          key={row.key}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(110px,auto)_minmax(110px,auto)_minmax(130px,auto)] sm:px-5"
        >
          <span className="text-sm text-[#c4cbd2]">{row.label}</span>
          <span className="text-right text-xs tabular-nums text-[#a4afbb] sm:text-sm">
            <span className="sm:hidden">Anterior · </span>
            {oldValue == null ? "Não informado" : row.format(oldValue)}
          </span>
          <span className="text-right text-sm font-semibold tabular-nums text-white">
            <span className="font-normal text-[#a4afbb] sm:hidden">
              Atual ·{" "}
            </span>
            {newValue == null ? "Não informado" : row.format(newValue)}
          </span>
          <span className="col-span-2 text-right text-xs sm:col-span-1">
            <span className="text-[#a4afbb] sm:hidden">Variação · </span>
            {oldValue == null || newValue == null ? (
              <span className="text-[#a4afbb]">Sem base de comparação</span>
            ) : (
              <Variation
                before={oldValue}
                after={newValue}
                direction={row.direction}
              />
            )}
          </span>
        </div>
      );
    });

  return (
    <section
      className="overflow-hidden rounded-xl border border-white/10 bg-[#111820]"
      aria-labelledby="comparison-summary-title"
    >
      <div className="border-b border-white/8 px-4 py-4 sm:px-5">
        <h3 id="comparison-summary-title" className="font-semibold text-white">
          Resumo da comparação
        </h3>
        <p className="mt-1 text-sm text-[#a4afbb]">
          Compare investimento, compras, faturamento e retorno. Os demais
          indicadores continuam disponíveis abaixo.
        </p>
        <div className="mt-4 hidden grid-cols-[minmax(0,1fr)_minmax(110px,auto)_minmax(110px,auto)_minmax(130px,auto)] gap-3 text-[11px] font-medium uppercase tracking-wide text-[#a4afbb] sm:grid">
          <span>Indicador</span>
          <span className="text-right">{previous.title}</span>
          <span className="text-right">{current.title}</span>
          <span className="text-right">Variação</span>
        </div>
      </div>
      <div className="divide-y divide-white/8">
        {renderRows(comparisonRows.slice(0, 6))}
      </div>
      <details className="group border-t border-white/8">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium text-[#c4cbd2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ffb81a] sm:px-5">
          Ver outras métricas da comparação
          <ChevronDown
            className="h-4 w-4 shrink-0 text-[#ffcf62] transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="divide-y divide-white/8 border-t border-white/8">
          {renderRows(comparisonRows.slice(6))}
        </div>
      </details>
    </section>
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
  const [view, setView] = useState<"report" | "compare">("report");

  useEffect(() => {
    if (!reports.length) return;
    setCurrentId(current =>
      reports.some(report => String(report.id) === current)
        ? current
        : String(reports[0].id)
    );
    setPreviousId(previous =>
      reports.some(report => String(report.id) === previous)
        ? previous
        : reports.length > 1
          ? String(reports[1].id)
          : ""
    );
  }, [reports]);

  const previous = useMemo(
    () => reports.find(report => String(report.id) === previousId),
    [reports, previousId]
  );
  const current = useMemo(
    () => reports.find(report => String(report.id) === currentId),
    [reports, currentId]
  );

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#090d12] text-white">
        <div className="flex items-center gap-3 text-sm text-[#c4cbd2]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#ffb81a]/30 border-t-[#ffb81a]" />
          Carregando seus resultados...
        </div>
      </main>
    );
  }

  if (!data || error || !token) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#090d12] px-5 text-white">
        <div className="max-w-md text-center">
          <BarChart3
            className="mx-auto mb-4 h-10 w-10 text-[#ffb81a]"
            aria-hidden="true"
          />
          <h1 className="text-xl font-semibold">Portal indisponível</h1>
          <p className="mt-2 text-sm leading-6 text-[#a4afbb]">
            Este link é inválido ou foi desativado. Peça um novo acesso ao
            responsável pela conta.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090d12] text-white">
      <div className="mx-auto max-w-[1440px] space-y-7 px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[#ffcf62]">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              <span>Portal de resultados</span>
            </div>
            <h1 className="break-words text-2xl font-semibold text-white sm:text-3xl">
              {data.companyName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a4afbb]">
              Acompanhe os resultados dos anúncios e compare períodos publicados
              pela sua equipe.
            </p>
          </div>
          <div className="text-sm text-[#a4afbb]">
            {reports.length} relatório
            {reports.length === 1 ? " publicado" : "s publicados"}
          </div>
        </header>

        {reports.length === 0 ? (
          <section className="rounded-xl border border-white/10 bg-[#111820] p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <CalendarDays
                className="mt-0.5 h-5 w-5 shrink-0 text-[#ffcf62]"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-semibold">
                  Ainda não há relatórios publicados
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#a4afbb]">
                  Quando a equipe publicar um relatório para esta empresa, os
                  resultados aparecerão aqui.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="space-y-4" aria-label="Escolha a visualização">
              <div className="flex w-full flex-col gap-2 rounded-xl border border-white/8 bg-[#111820] p-1.5 sm:w-fit sm:flex-row">
                <button
                  type="button"
                  aria-pressed={view === "report"}
                  onClick={() => setView("report")}
                  className={`min-h-11 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb81a] ${view === "report" ? "bg-[#ffb81a] text-[#17120a]" : "text-[#c4cbd2] hover:bg-white/5 hover:text-white"}`}
                >
                  Ver relatório completo
                </button>
                <button
                  type="button"
                  aria-pressed={view === "compare"}
                  onClick={() => setView("compare")}
                  disabled={reports.length < 2}
                  className={`min-h-11 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb81a] disabled:cursor-not-allowed disabled:opacity-40 ${view === "compare" ? "bg-[#ffb81a] text-[#17120a]" : "text-[#c4cbd2] hover:bg-white/5 hover:text-white"}`}
                >
                  Comparar períodos
                </button>
              </div>
              {reports.length < 2 && (
                <p className="text-xs text-[#a4afbb]">
                  A comparação fica disponível quando houver pelo menos dois
                  relatórios publicados.
                </p>
              )}
            </section>

            {view === "report" ? (
              <>
                <label
                  className="block max-w-xl text-sm font-medium text-[#c4cbd2]"
                  htmlFor="portal-report-select"
                >
                  Relatório que você quer ver
                </label>
                <div className="relative max-w-xl">
                  <select
                    id="portal-report-select"
                    value={currentId}
                    onChange={event => setCurrentId(event.target.value)}
                    className="h-12 w-full appearance-none rounded-lg border border-white/10 bg-[#111820] px-4 pr-11 text-sm text-white outline-none focus:border-[#ffb81a]/60 focus:ring-2 focus:ring-[#ffb81a]/20"
                  >
                    {reports.map(report => (
                      <option key={report.id} value={report.id}>
                        {reportLabel(report)}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-[#a4afbb]">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                {current && <PeriodPerformance report={current} />}
              </>
            ) : (
              <div className="space-y-6">
                <section className="rounded-xl border border-white/10 bg-[#111820] p-4 sm:p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#ffb81a]/10 text-[#ffcf62]">
                      <Sparkles
                        className="h-[18px] w-[18px]"
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <h2 className="font-semibold text-white">
                        Compare os períodos
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-[#a4afbb]">
                        Veja o que mudou entre os períodos, os funis e a análise
                        de desempenho de cada um.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label
                      className="text-sm font-medium text-[#c4cbd2]"
                      htmlFor="portal-previous-select"
                    >
                      Período anterior
                      <select
                        id="portal-previous-select"
                        value={previousId}
                        onChange={event => setPreviousId(event.target.value)}
                        className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-[#090d12] px-3 text-sm text-white outline-none focus:border-[#ffb81a]/60 focus:ring-2 focus:ring-[#ffb81a]/20"
                      >
                        <option value="">Selecione o período anterior</option>
                        {reports.map(report => (
                          <option key={report.id} value={report.id}>
                            {reportLabel(report)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label
                      className="text-sm font-medium text-[#c4cbd2]"
                      htmlFor="portal-current-select"
                    >
                      Período atual
                      <select
                        id="portal-current-select"
                        value={currentId}
                        onChange={event => setCurrentId(event.target.value)}
                        className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-[#090d12] px-3 text-sm text-white outline-none focus:border-[#ffb81a]/60 focus:ring-2 focus:ring-[#ffb81a]/20"
                      >
                        <option value="">Selecione o período atual</option>
                        {reports.map(report => (
                          <option key={report.id} value={report.id}>
                            {reportLabel(report)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>

                {previous && current && previous.id !== current.id ? (
                  <>
                    <CompareSummary previous={previous} current={current} />
                    <section aria-label="Funis dos períodos comparados">
                      <h2 className="mb-5 text-lg font-semibold text-white">
                        Funil de cada período
                      </h2>
                      <div className="grid grid-cols-1 items-start gap-7 xl:grid-cols-2">
                        {[previous, current].map(report => (
                          <article
                            key={report.id}
                            className="min-w-0 border-b border-white/10 pb-6 last:border-0 xl:border-b-0"
                          >
                            <header className="mb-5 border-b border-white/10 pb-3">
                              <h3 className="font-semibold text-white">
                                {report.title}
                              </h3>
                              <p className="mt-1 text-sm text-[#a4afbb]">
                                {displayDate(report.startDate)} a{" "}
                                {displayDate(report.endDate)}
                              </p>
                            </header>
                            <PeriodFunnel report={report} compact />
                          </article>
                        ))}
                      </div>
                    </section>
                    <section aria-label="Análises dos períodos comparados">
                      <h2 className="mb-5 text-lg font-semibold text-white">
                        Análise de performance de cada período
                      </h2>
                      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
                        {[previous, current].map(report => (
                          <PeriodAnalysis key={report.id} report={report} />
                        ))}
                      </div>
                    </section>
                  </>
                ) : (
                  <section
                    className="rounded-xl border border-white/10 bg-[#111820] p-5 text-sm leading-6 text-[#c4cbd2]"
                    role="status"
                  >
                    {previous && current
                      ? "Escolha dois períodos diferentes para comparar os resultados."
                      : "Selecione os dois períodos para ver os funis e análises lado a lado."}
                  </section>
                )}
              </div>
            )}
          </>
        )}

        <footer className="border-t border-white/8 pt-5 text-center text-xs text-[#a4afbb]">
          Relatórios publicados para {data.companyName}
        </footer>
      </div>
    </main>
  );
}
