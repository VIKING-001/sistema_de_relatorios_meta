import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, BarChart3, Zap, TrendingUp, DollarSign,
  MousePointerClick, Eye, Users, RefreshCw, ArrowUpRight,
  FileText, CheckCircle2, Loader2, MessageCircle, ShoppingBag,
  Target, Star, Activity, TrendingDown, Calendar, Filter, X,
} from "lucide-react";
import FunnelChart from "@/components/FunnelChart";
import { useLocation } from "wouter";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from "recharts";

// ─── Tipos ─────────────────────────────────────────────────────────────────
interface FilterState {
  startDate: string;
  endDate: string;
  companyId: string | null;
  minSpent: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmtR = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
const fmt  = (n: number) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n >= 1_000 ? (n / 1_000).toFixed(1) + "K" : n.toLocaleString("pt-BR");
const fmtPct = (n: number) => (n * 100).toFixed(1) + "%";

// ─── Tooltip personalizado ──────────────────────────────────────────────────
function GoldTooltip({ active, payload, label, currency = false }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B0F19] border border-yellow-500/20 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold text-yellow-400">
          {currency ? fmtR(p.value) : fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Card KPI grande ───────────────────────────────────────────────────────
function BigKPI({
  label, value, sub, icon: Icon, color, bg, onClick, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; bg: string; onClick?: () => void; trend?: number;
}) {
  return (
    <Card
      className={`relative overflow-hidden border-white/8 transition-all ${onClick ? "cursor-pointer hover:border-white/20 hover:scale-[1.01]" : ""}`}
      style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}
      onClick={onClick}
    >
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${bg}`} />
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</p>
            <p className="text-2xl sm:text-3xl font-black text-white leading-none tracking-tight truncate">
              {value}
            </p>
            {sub && <p className="text-[10px] text-white/30 mt-1">{sub}</p>}
            {trend != null && (
              <div className={`flex items-center gap-1 mt-1 ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span className="text-[10px] font-bold">{Math.abs(trend).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg} bg-opacity-15 border border-white/10`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Card KPI pequeno ──────────────────────────────────────────────────────
function SmallKPI({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string;
}) {
  return (
    <div className="relative rounded-2xl p-3.5 sm:p-4 border border-white/8 overflow-hidden"
      style={{ background: "rgba(11,15,25,0.6)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/35">{label}</p>
      </div>
      <p className="text-lg sm:text-xl font-black text-white leading-none">{value}</p>
      {sub && <p className="text-[9px] text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Gráfico de barras genérico ────────────────────────────────────────────
function BarSection({ title, data, dataKey, color, currency = false, icon: Icon }: {
  title: string; data: any[]; dataKey: string; color: string;
  currency?: boolean; icon: any;
}) {
  if (!data.length) return null;
  return (
    <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
      <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
        <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-white/70">
          <Icon className={`h-3.5 w-3.5 ${color}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => currency ? fmtR(v) : fmt(v)} width={55} />
            <Tooltip content={<GoldTooltip currency={currency} />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} fill="#FFB81A" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Gráfico de linha ──────────────────────────────────────────────────────
function LineSection({ title, data, lines, icon: Icon }: {
  title: string; data: any[]; lines: Array<{ key: string; color: string; label: string }>;
  icon: any;
}) {
  if (!data.length) return null;
  return (
    <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
      <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
        <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-white/70">
          <Icon className={`h-3.5 w-3.5 text-cyan-400`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 8 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} width={50} />
            <Tooltip content={<GoldTooltip />} />
            <Legend wrapperStyle={{ paddingTop: "15px" }} />
            {lines.map(l => (
              <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} name={l.label} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Gráfico de pizza ──────────────────────────────────────────────────────
function PieSection({ title, data, icon: Icon }: {
  title: string; data: any[]; icon: any;
}) {
  if (!data.length) return null;
  const COLORS = ["#FFB81A", "#C9A24D", "#FFC84D", "#FFD966", "#FFE699"];
  return (
    <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
      <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
        <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-white/70">
          <Icon className={`h-3.5 w-3.5 text-yellow-400`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={60} fill="#FFB81A" dataKey="value">
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<GoldTooltip currency />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard Principal ────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    companyId: null,
    minSpent: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: companies, isLoading: loadingCompanies, refetch: refetchCompanies } = trpc.company.list.useQuery();
  const { data: allReportsRaw, isLoading: loadingReports, refetch: refetchReports } = trpc.report.listAll.useQuery();

  const isLoading = loadingCompanies || loadingReports;

  const refetchCompaniesRef = useRef(refetchCompanies);
  const refetchReportsRef   = useRef(refetchReports);
  useEffect(() => { refetchCompaniesRef.current = refetchCompanies; }, [refetchCompanies]);
  useEffect(() => { refetchReportsRef.current   = refetchReports;   }, [refetchReports]);

  const manualRefetch = async () => {
    setIsManualRefreshing(true);
    await Promise.all([refetchCompanies(), refetchReports()]);
    setLastUpdated(new Date());
    setIsManualRefreshing(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refetchCompaniesRef.current();
      refetchReportsRef.current();
      setLastUpdated(new Date());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // ─── Filtragem de dados ────────────────────────────────────────────────
  const companyMap = Object.fromEntries((companies ?? []).map((c: any) => [c.id, c.name]));

  const filteredReports = useMemo(() => {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);

    return (allReportsRaw ?? []).filter((r: any) => {
      const reportDate = new Date(r.createdAt ?? r.startDate);
      const spent = parseFloat(r.metrics?.totalSpent || r.totalSpent || "0");
      const matchesDate = reportDate >= start && reportDate <= end;
      const matchesCompany = !filters.companyId || r.companyId === parseInt(filters.companyId);
      const matchesSpent = spent >= filters.minSpent;
      return matchesDate && matchesCompany && matchesSpent;
    });
  }, [allReportsRaw, filters]);

  // ─── Métricas agregadas filtradas ──────────────────────────────────────
  const totalCompanies    = companies?.length ?? 0;
  const connectedMeta     = companies?.filter((c: any) => c.metaAccessToken).length ?? 0;
  const totalReports      = filteredReports.length;
  const totalSpent        = filteredReports.reduce((s: number, r: any) => s + parseFloat(r.metrics?.totalSpent || "0"), 0);
  const totalClicks       = filteredReports.reduce((s: number, r: any) => s + (r.metrics?.totalClicks ?? 0), 0);
  const totalImpressions  = filteredReports.reduce((s: number, r: any) => s + (r.metrics?.totalImpressions ?? 0), 0);
  const totalReach        = filteredReports.reduce((s: number, r: any) => s + (r.metrics?.totalReach ?? 0), 0);
  const totalMessages     = filteredReports.reduce((s: number, r: any) => s + (r.metrics?.messagesInitiated ?? 0), 0);
  const totalVisits       = filteredReports.reduce((s: number, r: any) => s + (r.metrics?.instagramProfileVisits ?? 0), 0);
  const totalPurchases    = filteredReports.reduce((s: number, r: any) => s + (parseInt(r.metrics?.purchases ?? "0") || 0), 0);
  const totalPurchaseVal  = filteredReports.reduce((s: number, r: any) => s + parseFloat(r.metrics?.purchaseValue || "0"), 0);
  const totalFollowers    = filteredReports.reduce((s: number, r: any) => s + (r.metrics?.newInstagramFollowers ?? 0), 0);

  const cpcMedio  = totalClicks > 0       ? totalSpent / totalClicks   : 0;
  const cpmMedio  = totalImpressions > 0  ? (totalSpent / totalImpressions) * 1000 : 0;
  const ctrMedio  = totalImpressions > 0  ? (totalClicks / totalImpressions) * 100 : 0;
  const roas      = totalSpent > 0 && totalPurchaseVal > 0 ? totalPurchaseVal / totalSpent : 0;
  const cpMsg     = totalMessages > 0     ? totalSpent / totalMessages  : 0;

  // ─── Dados para gráficos ───────────────────────────────────────────────

  // Gráfico: Investimento por dia
  const dailyData = useMemo(() => {
    const map: Record<string, { invested: number; clicks: number; impressions: number }> = {};
    for (const r of filteredReports) {
      const date = new Date(r.createdAt ?? r.startDate).toLocaleDateString("pt-BR");
      if (!map[date]) map[date] = { invested: 0, clicks: 0, impressions: 0 };
      map[date].invested += parseFloat(r.metrics?.totalSpent || "0");
      map[date].clicks += r.metrics?.totalClicks ?? 0;
      map[date].impressions += r.metrics?.totalImpressions ?? 0;
    }
    return Object.entries(map).map(([date, v]) => ({ date, ...v })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredReports]);

  // Gráfico: Desempenho por empresa
  const byCompanyPerf = useMemo(() => {
    const map: Record<string, { spent: number; clicks: number; purchases: number }> = {};
    for (const r of filteredReports) {
      const name = companyMap[r.companyId] ?? `Empresa ${r.companyId}`;
      if (!map[name]) map[name] = { spent: 0, clicks: 0, purchases: 0 };
      map[name].spent += parseFloat(r.metrics?.totalSpent || "0");
      map[name].clicks += r.metrics?.totalClicks ?? 0;
      map[name].purchases += parseInt(r.metrics?.purchases ?? "0") || 0;
    }
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.spent - a.spent).slice(0, 8);
  }, [filteredReports, companyMap]);

  // Gráfico: Distribuição de gastos por empresa
  const byCompanyPie = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of filteredReports) {
      const name = companyMap[r.companyId] ?? `Empresa ${r.companyId}`;
      map[name] = (map[name] ?? 0) + parseFloat(r.metrics?.totalSpent || "0");
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredReports, companyMap]);

  // Gráfico: Funnel conversion rate
  const conversionFunnel = useMemo(() => {
    if (totalImpressions === 0) return [];
    return [
      { name: "Impressões",     value: totalImpressions },
      { name: "Cliques",        value: totalClicks },
      { name: "Visitas Perfil", value: totalVisits },
      { name: "Mensagens",      value: totalMessages },
      { name: "Compras",        value: totalPurchases },
    ].filter(s => s.value > 0);
  }, [totalImpressions, totalClicks, totalVisits, totalMessages, totalPurchases]);

  // ─── Período comparativo (últimos 30 vs anteriores 30) ───────────────────
  const periodComparison = useMemo(() => {
    const allReports = allReportsRaw ?? [];
    const now = new Date();
    const current30start = new Date(now);
    current30start.setDate(now.getDate() - 30);
    const previous30start = new Date(current30start);
    previous30start.setDate(current30start.getDate() - 30);

    const current = allReports.filter(r => {
      const d = new Date(r.createdAt ?? r.startDate);
      return d >= current30start && d <= now;
    });
    const previous = allReports.filter(r => {
      const d = new Date(r.createdAt ?? r.startDate);
      return d >= previous30start && d < current30start;
    });

    const currentSpent = current.reduce((s, r) => s + parseFloat(r.metrics?.totalSpent || "0"), 0);
    const currentClicks = current.reduce((s, r) => s + (r.metrics?.totalClicks ?? 0), 0);
    const previousSpent = previous.reduce((s, r) => s + parseFloat(r.metrics?.totalSpent || "0"), 0);
    const previousClicks = previous.reduce((s, r) => s + (r.metrics?.totalClicks ?? 0), 0);

    const spentTrend = previousSpent > 0 ? ((currentSpent - previousSpent) / previousSpent) * 100 : 0;
    const clicksTrend = previousClicks > 0 ? ((currentClicks - previousClicks) / previousClicks) * 100 : 0;

    return { spentTrend, clicksTrend };
  }, [allReportsRaw]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Olá, {user?.name?.split(" ")[0] ?? "Viking"} 👋
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] sm:text-xs text-white/40">
            <span>Dashboard avançado com análises</span>
            {lastUpdated && <span>• Atualizado {lastUpdated.toLocaleTimeString("pt-BR")}</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={manualRefetch}
            disabled={isManualRefreshing}
            className="gap-2 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
          >
            {isManualRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="hidden sm:inline">{isManualRefreshing ? "Atualizando…" : "Atualizar"}</span>
          </Button>
        </div>
      </div>

      {/* ── Painel de Filtros ── */}
      {showFilters && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-white/60 mb-1 block">Data Inicial</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:border-white/20 focus:border-yellow-500/50 outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/60 mb-1 block">Data Final</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:border-white/20 focus:border-yellow-500/50 outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/60 mb-1 block">Empresa</label>
                <select
                  value={filters.companyId ?? ""}
                  onChange={(e) => setFilters({ ...filters, companyId: e.target.value || null })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:border-white/20 focus:border-yellow-500/50 outline-none transition"
                >
                  <option value="">Todas</option>
                  {(companies ?? []).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-white/60 mb-1 block">Gasto Mínimo</label>
                <input
                  type="number"
                  value={filters.minSpent}
                  onChange={(e) => setFilters({ ...filters, minSpent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:border-white/20 focus:border-yellow-500/50 outline-none transition"
                  placeholder="0"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0], companyId: null, minSpent: 0 })}
              className="text-white/50 hover:text-white text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Row 1: KPIs principais + Tendências ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <BigKPI
          label="Investimento Total"
          value={fmtR(totalSpent)}
          sub={`${totalReports} relatórios`}
          icon={DollarSign}
          color="text-yellow-400"
          bg="bg-yellow-500"
          trend={periodComparison.spentTrend}
        />
        <BigKPI
          label="Cliques Totais"
          value={fmt(totalClicks)}
          sub={`CPC ${fmtR(cpcMedio)}`}
          icon={MousePointerClick}
          color="text-blue-400"
          bg="bg-blue-500"
          trend={periodComparison.clicksTrend}
        />
        <BigKPI
          label="Alcance"
          value={fmt(totalReach)}
          sub={`${fmt(totalImpressions)} impressões`}
          icon={Users}
          color="text-violet-400"
          bg="bg-violet-500"
        />
        {roas > 0 ? (
          <BigKPI
            label="ROAS"
            value={`${roas.toFixed(2)}x`}
            sub={`Faturado ${fmtR(totalPurchaseVal)}`}
            icon={TrendingUp}
            color="text-emerald-400"
            bg="bg-emerald-500"
          />
        ) : (
          <BigKPI
            label="Meta Conectado"
            value={connectedMeta}
            sub={`de ${totalCompanies} empresa${totalCompanies !== 1 ? "s" : ""}`}
            icon={CheckCircle2}
            color="text-cyan-400"
            bg="bg-cyan-500"
          />
        )}
      </div>

      {/* ── Row 2: KPIs secundários ── */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <SmallKPI label="CTR Médio"      value={`${ctrMedio.toFixed(2)}%`}         sub="conversão"         icon={Activity}         color="text-yellow-400" />
        <SmallKPI label="CPM Médio"      value={cpmMedio > 0 ? fmtR(cpmMedio) : "—"} sub="custo por mil"   icon={Eye}              color="text-violet-400" />
        <SmallKPI label="Seguidores"     value={fmt(totalFollowers)}               sub="novos"             icon={Star}             color="text-pink-400" />
        <SmallKPI label="Visitas"        value={fmt(totalVisits)}                  sub="ao perfil"         icon={Target}           color="text-emerald-400" />
        <SmallKPI label="Mensagens"      value={fmt(totalMessages)}                sub={`R$ ${fmtR(cpMsg).replace("R$ ", "")}/msg`}  icon={MessageCircle}   color="text-cyan-400" />
        <SmallKPI label="Compras"        value={fmt(totalPurchases)}               sub="conversões"        icon={ShoppingBag}      color="text-pink-400" />
      </div>

      {/* ── Row 3: Gráficos de Linha ── */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        <LineSection
          title="Evolução de Investimento e Cliques"
          data={dailyData}
          lines={[
            { key: "invested", color: "#FFB81A", label: "Investimento (R$)" },
            { key: "clicks", color: "#3B82F6", label: "Cliques" },
          ]}
          icon={TrendingUp}
        />
      </div>

      {/* ── Row 4: Gráficos de Barras ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <BarSection
          title="Desempenho por Empresa"
          data={byCompanyPerf}
          dataKey="spent"
          color="text-yellow-400"
          currency
          icon={Building2}
        />
        <BarSection
          title="Cliques por Empresa"
          data={byCompanyPerf}
          dataKey="clicks"
          color="text-blue-400"
          icon={MousePointerClick}
        />
      </div>

      {/* ── Row 5: Gráficos de Pizza + Funil ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <PieSection
          title="Distribuição de Gastos por Empresa"
          data={byCompanyPie}
          icon={DollarSign}
        />
        <BarSection
          title="Funil de Conversão"
          data={conversionFunnel}
          dataKey="value"
          color="text-yellow-400"
          icon={Target}
        />
      </div>

      {/* ── Row 6: Funil Agregado ── */}
      {totalImpressions > 0 && (
        <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
          <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
            <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-white/70">
              <Target className="h-3.5 w-3.5 text-yellow-400" />
              Funil de Marketing Detalhado
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-5 pb-5">
            <FunnelChart
              totalImpressions={totalImpressions}
              totalReach={totalReach}
              totalClicks={totalClicks}
              instagramProfileVisits={totalVisits}
              messagesInitiated={totalMessages}
              purchases={totalPurchases}
              totalSpent={totalSpent}
              costPerClick={cpcMedio}
              costPerProfileVisit={totalVisits > 0 ? totalSpent / totalVisits : 0}
              costPerMessage={cpMsg}
              costPerPurchase={totalPurchases > 0 ? totalSpent / totalPurchases : 0}
              purchaseValue={totalPurchaseVal}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Row 7: Relatórios recentes ── */}
      <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
        <CardHeader className="pb-2 pt-4 px-4 sm:px-5 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-white/70 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-yellow-400" />
            Últimos Relatórios ({filteredReports.length})
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-white/40 hover:text-white"
            onClick={() => setLocation("/relatorios")}>
            Ver todos <ArrowUpRight className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="px-4 sm:px-5 pb-4 space-y-1.5">
          {filteredReports.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-8">Nenhum relatório neste período.</p>
          ) : filteredReports.slice(0, 8).map((r: any) => {
            const spent = parseFloat(r.metrics?.totalSpent || r.totalSpent || "0");
            const clicks = r.metrics?.totalClicks ?? 0;
            return (
              <div key={r.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/4 transition-colors border border-transparent hover:border-white/6">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <FileText className="h-3.5 w-3.5 text-yellow-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate text-white">{r.title}</p>
                    <p className="text-[10px] text-white/30">{companyMap[r.companyId] ?? "—"}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs font-bold text-yellow-400">{fmtR(spent)}</p>
                  {clicks > 0 && <p className="text-[10px] text-white/30">{fmt(clicks)} cliques</p>}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
