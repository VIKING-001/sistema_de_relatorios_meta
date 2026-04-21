import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Loader2, Copy, Download,
  Eye, Users, MousePointerClick, MessageCircle,
  DollarSign, TrendingUp, BarChart3, ShoppingBag,
  Star, Link, Video, Target,
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from "@shared/metrics";
import { displayDate } from "@shared/dateParser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ConsultiveReport from "@/components/ConsultiveReport";
import FunnelChart from "@/components/FunnelChart";
import type { LucideIcon } from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// TIPOS DE ACENTO (paleta por seção)
// ══════════════════════════════════════════════════════════════════

type Accent = "blue" | "violet" | "amber" | "pink" | "emerald" | "cyan";

const ACCENTS: Record<Accent, {
  text: string; bg: string; border: string;
  sectionBg: string; sectionBorder: string; iconBg: string; bar: string;
}> = {
  blue:    { text: "text-blue-300",    bg: "bg-blue-500/10",    border: "border-blue-500/25",    sectionBg: "from-blue-900/40 to-blue-950/20",    sectionBorder: "border-blue-500/15",    iconBg: "bg-blue-500/20",    bar: "bg-blue-400" },
  violet:  { text: "text-violet-300",  bg: "bg-violet-500/10",  border: "border-violet-500/25",  sectionBg: "from-violet-900/40 to-violet-950/20",  sectionBorder: "border-violet-500/15",  iconBg: "bg-violet-500/20",  bar: "bg-violet-400" },
  amber:   { text: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/25",   sectionBg: "from-amber-900/30 to-amber-950/20",   sectionBorder: "border-amber-500/15",   iconBg: "bg-amber-500/20",   bar: "bg-amber-400" },
  pink:    { text: "text-pink-300",    bg: "bg-pink-500/10",    border: "border-pink-500/25",    sectionBg: "from-pink-900/30 to-pink-950/20",    sectionBorder: "border-pink-500/15",    iconBg: "bg-pink-500/20",    bar: "bg-pink-400" },
  emerald: { text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/25", sectionBg: "from-emerald-900/30 to-emerald-950/20", sectionBorder: "border-emerald-500/15", iconBg: "bg-emerald-500/20", bar: "bg-emerald-400" },
  cyan:    { text: "text-cyan-300",    bg: "bg-cyan-500/10",    border: "border-cyan-500/25",    sectionBg: "from-cyan-900/30 to-cyan-950/20",    sectionBorder: "border-cyan-500/15",    iconBg: "bg-cyan-500/20",    bar: "bg-cyan-400" },
};

// ══════════════════════════════════════════════════════════════════
// COMPONENTES PREMIUM
// ══════════════════════════════════════════════════════════════════

// KPI hero — números grandes no topo
function HeroKPI({ label, value, sub, accent, icon: Icon }: {
  label: string; value: string; sub?: string;
  accent: Accent; icon: LucideIcon;
}) {
  const a = ACCENTS[accent];
  return (
    <div className={`relative rounded-2xl p-5 sm:p-6 border ${a.border} ${a.bg} backdrop-blur-sm overflow-hidden`}>
      {/* Barra de acento superior */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${a.bar} opacity-60`} />
      {/* Ícone */}
      <div className={`w-9 h-9 rounded-xl ${a.iconBg} flex items-center justify-center mb-4`}>
        <Icon className={`h-4.5 w-4.5 ${a.text}`} style={{ width: 18, height: 18 }} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-1">{label}</p>
      <p className="text-2xl sm:text-3xl font-black text-white leading-none tracking-tight">{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1.5">{sub}</p>}
    </div>
  );
}

// Card de métrica padrão
function MetricCard({ label, value, sub, accent, large }: {
  label: string; value: string; sub?: string;
  accent: Accent; large?: boolean;
}) {
  const a = ACCENTS[accent];
  return (
    <div className={`relative rounded-2xl p-4 sm:p-5 border border-white/8 bg-white/[0.04] backdrop-blur-sm overflow-hidden group hover:border-white/15 transition-colors`}>
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${a.bar} opacity-50 group-hover:opacity-80 transition-opacity rounded-l-2xl`} />
      <p className="text-[10px] font-medium uppercase tracking-widest text-white/35 mb-2 pl-1">{label}</p>
      <p className={`font-black text-white leading-none tracking-tight pl-1 ${large ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-white/30 mt-1.5 pl-1">{sub}</p>}
    </div>
  );
}

// Card de destaque (conversões, investimento principal)
function HighlightCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent: Accent;
}) {
  const a = ACCENTS[accent];
  return (
    <div className={`relative rounded-2xl p-5 sm:p-6 border ${a.border} ${a.bg} backdrop-blur-sm overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${a.bar} opacity-70`} />
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 mb-2">{label}</p>
      <p className={`text-2xl sm:text-3xl font-black ${a.text} leading-none tracking-tight`}>{value}</p>
      {sub && <p className="text-xs text-white/40 mt-1.5">{sub}</p>}
    </div>
  );
}

// Header de seção
function SectionHeader({ icon: Icon, title, accent }: {
  icon: LucideIcon; title: string; accent: Accent;
}) {
  const a = ACCENTS[accent];
  return (
    <div className={`flex items-center gap-3 mb-4 sm:mb-5 px-4 py-3 rounded-2xl bg-gradient-to-r ${a.sectionBg} border ${a.sectionBorder}`}>
      <div className={`w-8 h-8 rounded-xl ${a.iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`${a.text}`} style={{ width: 16, height: 16 }} />
      </div>
      <h2 className={`text-xs font-black uppercase tracking-[0.2em] ${a.text}`}>{title}</h2>
    </div>
  );
}

// Divisor entre seções
function Divider() {
  return <div className="my-8 sm:my-10 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />;
}

// ══════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════

export default function PublicReport() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = trpc.report.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030509] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
          <p className="text-white/30 text-sm">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#030509] flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-5xl mb-6">📭</p>
          <h1 className="text-2xl font-bold text-white mb-3">Relatório não encontrado</h1>
          <p className="text-white/40 text-sm">Este link pode ter expirado ou não estar publicado.</p>
        </div>
      </div>
    );
  }

  const { report, metrics, company } = data;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado!");
  };

  const m              = metrics as any;
  const purchases      = parseInt(m?.purchases ?? "0", 10)    || 0;
  const purchaseValue  = parseFloat(m?.purchaseValue ?? "0")  || 0;
  const costPerPurchase= parseFloat(m?.costPerPurchase ?? "0")|| 0;
  const costPerMessage = parseFloat(m?.costPerMessage ?? "0") || 0;
  const hasPurchases   = purchases > 0 || purchaseValue > 0;
  const totalSpent     = parseFloat(metrics?.totalSpent ?? "0");
  const roas           = totalSpent > 0 && purchaseValue > 0 ? (purchaseValue / totalSpent).toFixed(2) : null;

  return (
    <div className="min-h-screen relative" style={{ background: "linear-gradient(135deg, #030509 0%, #0B0F19 50%, #030509 100%)" }}>

      {/* Glows de fundo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #FFB81A, transparent)" }} />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #C9A24D, transparent)" }} />
      </div>

      {/* ── Header sticky ── */}
      <header className="sticky top-0 z-50 border-b border-white/6 bg-black/50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-white truncate leading-tight">
              {company?.name}
            </h1>
            <p className="text-[10px] sm:text-xs text-white/35 mt-0.5 truncate">
              {report.title} · {displayDate(report.startDate)} — {displayDate(report.endDate)}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              onClick={handleCopyUrl}
              variant="outline"
              size="sm"
              className="border-white/15 text-white/70 hover:bg-white/8 hover:text-white h-8 text-xs gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Copiar Link</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10 space-y-0">

        {/* ── Título do período ── */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs text-white/50 font-medium">
              {displayDate(report.startDate)} a {displayDate(report.endDate)}
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            Relatório de Performance
          </h2>
          <p className="text-white/30 text-sm mt-2">{company?.name}</p>
          {report.description && (
            <p className="text-white/40 text-sm mt-3 max-w-lg mx-auto">{report.description}</p>
          )}
        </div>

        {metrics && (
          <>
            {/* ── Hero KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-14">
              <HeroKPI
                label="Investimento"
                value={formatCurrency(totalSpent)}
                accent="amber"
                icon={DollarSign}
              />
              <HeroKPI
                label="Alcance"
                value={formatNumber(metrics.totalReach)}
                sub={`${formatNumber(metrics.totalImpressions)} impressões`}
                accent="blue"
                icon={Users}
              />
              <HeroKPI
                label="Cliques"
                value={formatNumber(metrics.totalClicks)}
                sub={`CTR ${formatPercentage(parseFloat(metrics.ctr))}`}
                accent="violet"
                icon={MousePointerClick}
              />
              {hasPurchases ? (
                <HeroKPI
                  label="Faturado"
                  value={formatCurrency(purchaseValue)}
                  sub={roas ? `ROAS ${roas}x` : undefined}
                  accent="emerald"
                  icon={TrendingUp}
                />
              ) : (
                <HeroKPI
                  label="Mensagens"
                  value={formatNumber(metrics.messagesInitiated)}
                  sub={costPerMessage > 0 ? `${formatCurrency(costPerMessage)} cada` : undefined}
                  accent="pink"
                  icon={MessageCircle}
                />
              )}
            </div>

            {/* ── SEÇÃO: Alcance & Visibilidade ── */}
            <SectionHeader icon={Eye} title="Alcance e Visibilidade" accent="blue" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
              <MetricCard label="Alcance Instagram"  value={formatNumber(metrics.instagramReach)}          accent="blue" />
              <MetricCard label="Alcance Total"      value={formatNumber(metrics.totalReach)}              accent="blue" large />
              <MetricCard label="Impressões"         value={formatNumber(metrics.totalImpressions)}        accent="blue" />
              <MetricCard label="Visitas ao Perfil"  value={formatNumber(metrics.instagramProfileVisits)}  accent="blue" />
            </div>

            <Divider />

            {/* ── SEÇÃO: Performance de Anúncios ── */}
            <SectionHeader icon={BarChart3} title="Performance dos Anúncios" accent="violet" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
              <MetricCard label="Cliques Totais"  value={formatNumber(metrics.totalClicks)}                           accent="violet" large />
              <MetricCard label="CTR"             value={formatPercentage(parseFloat(metrics.ctr))}                   accent="violet" />
              <MetricCard label="Novos Seguidores"value={formatNumber(metrics.newInstagramFollowers)}                  accent="violet" />
              <MetricCard label="Retenção de Vídeo" value={formatPercentage(parseFloat(metrics.videoRetentionRate))} accent="violet" />
            </div>

            <Divider />

            {/* ── SEÇÃO: Investimento ── */}
            <SectionHeader icon={DollarSign} title="Eficiência do Investimento" accent="amber" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
              <HighlightCard
                label="Total Investido"
                value={formatCurrency(totalSpent)}
                accent="amber"
              />
              <MetricCard label="CPC" value={formatCurrency(parseFloat(metrics.costPerClick))}       accent="amber" />
              <MetricCard label="CPM" value={formatCurrency(parseFloat(metrics.cpm))}                accent="amber" />
              <MetricCard label="Custo por Visita" value={formatCurrency(parseFloat(metrics.costPerProfileVisit))} accent="amber" />
            </div>

            {/* ── SEÇÃO: Mensagens ── */}
            {metrics.messagesInitiated > 0 && (
              <>
                <Divider />
                <SectionHeader icon={MessageCircle} title="Mensagens e Conversas" accent="pink" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-10">
                  <HighlightCard
                    label="Mensagens Iniciadas"
                    value={formatNumber(metrics.messagesInitiated)}
                    sub="pessoas que enviaram mensagem"
                    accent="pink"
                  />
                  <MetricCard
                    label="Custo por Mensagem"
                    value={costPerMessage > 0 ? formatCurrency(costPerMessage) : "—"}
                    accent="pink"
                    large
                  />
                </div>
              </>
            )}

            {/* ── SEÇÃO: Conversões ── */}
            {hasPurchases && (
              <>
                <Divider />
                <SectionHeader icon={ShoppingBag} title="Conversões e Vendas" accent="emerald" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
                  <HighlightCard
                    label="Total Faturado"
                    value={formatCurrency(purchaseValue)}
                    sub={roas ? `ROAS de ${roas}x` : undefined}
                    accent="emerald"
                  />
                  <HighlightCard
                    label="Nº de Compras"
                    value={formatNumber(purchases)}
                    sub="conversões rastreadas"
                    accent="emerald"
                  />
                  <MetricCard
                    label="Custo por Compra"
                    value={costPerPurchase > 0 ? formatCurrency(costPerPurchase) : "—"}
                    accent="emerald"
                  />
                  <MetricCard
                    label="Retorno sobre Investimento"
                    value={roas ? `${roas}x` : "—"}
                    sub="ROAS"
                    accent="emerald"
                    large
                  />
                </div>
              </>
            )}

            {/* ── Funil de Marketing ── */}
            <Divider />
            <div className="mb-3 sm:mb-5">
              <SectionHeader icon={Target} title="Funil de Marketing" accent="cyan" />
            </div>
            <FunnelChart
              dark
              totalImpressions={metrics.totalImpressions}
              totalReach={metrics.totalReach}
              totalClicks={metrics.totalClicks}
              instagramProfileVisits={metrics.instagramProfileVisits}
              messagesInitiated={metrics.messagesInitiated}
              purchases={purchases}
              totalSpent={totalSpent}
              costPerClick={parseFloat(metrics.costPerClick)}
              costPerProfileVisit={parseFloat(metrics.costPerProfileVisit)}
              costPerMessage={costPerMessage}
              costPerPurchase={costPerPurchase}
              purchaseValue={purchaseValue}
            />

            {/* ── Análise de Performance (simplificada para o cliente) ── */}
            <Divider />
            <ConsultiveReport
              metrics={{
                ctr:                    parseFloat(metrics.ctr),
                cpm:                    parseFloat(metrics.cpm),
                totalReach:             metrics.totalReach,
                totalImpressions:       metrics.totalImpressions,
                totalSpent:             totalSpent,
                totalClicks:            metrics.totalClicks,
                costPerClick:           parseFloat(metrics.costPerClick),
                videoRetentionRate:     parseFloat(metrics.videoRetentionRate),
                newInstagramFollowers:  metrics.newInstagramFollowers,
                messagesInitiated:      metrics.messagesInitiated,
                instagramProfileVisits: metrics.instagramProfileVisits,
                costPerProfileVisit:    parseFloat(metrics.costPerProfileVisit),
              }}
            />
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/6 bg-black/30 backdrop-blur-md mt-16 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/25 text-xs">
          <p>Relatório gerado em {new Date().toLocaleDateString("pt-BR")}</p>
          <p>{company?.name} · {report.title}</p>
        </div>
      </footer>
    </div>
  );
}
