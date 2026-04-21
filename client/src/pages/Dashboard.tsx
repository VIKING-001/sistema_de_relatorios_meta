import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, BarChart3, Zap, TrendingUp, DollarSign,
  MousePointerClick, Eye, Users, RefreshCw, ArrowUpRight,
  FileText, CheckCircle2, Loader2, MessageCircle, ShoppingBag,
  Target, Star, Activity, TrendingDown,
} from "lucide-react";
import FunnelChart from "@/components/FunnelChart";
import { useLocation } from "wouter";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from "recharts";

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmtR = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
const fmt  = (n: number) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n >= 1_000 ? (n / 1_000).toFixed(1) + "K" : n.toLocaleString("pt-BR");

// ─── Tooltip personalizado para gráficos ───────────────────────────────────
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

// ─── Card KPI grande (top row) ─────────────────────────────────────────────
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
      {/* acento superior */}
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

// ─── Card KPI pequeno (segunda row) ─────────────────────────────────────────
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

// ─── Gráfico de barras ──────────────────────────────────────────────────────
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
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => currency ? fmtR(v) : fmt(v)}
              width={55}
            />
            <Tooltip content={<GoldTooltip currency={currency} />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
              {data.map((_: any, i: number) => (
                <Cell key={i} fill={i === 0 ? "#FFB81A" : `rgba(255,184,26,${0.8 - i * 0.12})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard principal ─────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { data: companies, isLoading: loadingCompanies, refetch: refetchCompanies } = trpc.company.list.useQuery();
  const { data: allReportsRaw, isLoading: loadingReports, refetch: refetchReports } = trpc.report.listAll.useQuery();

  const isLoading = loadingCompanies || loadingReports;

  // ── Corrige loop infinito: usa refs para evitar re-criar o interval ──
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

  // Auto-refresh a cada 60s usando refs estáveis
  useEffect(() => {
    const interval = setInterval(() => {
      refetchCompaniesRef.current();
      refetchReportsRef.current();
      setLastUpdated(new Date());
    }, 60_000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Métricas agregadas ───────────────────────────────────────────────────
  const allReports = allReportsRaw ?? [];

  const totalCompanies    = companies?.length ?? 0;
  const connectedMeta     = companies?.filter((c: any) => c.metaAccessToken).length ?? 0;
  const totalReports      = allReports.length;
  const totalSpent        = allReports.reduce((s: number, r: any) => s + parseFloat(r.metrics?.totalSpent || "0"), 0);
  const totalClicks       = allReports.reduce((s: number, r: any) => s + (r.metrics?.totalClicks ?? 0), 0);
  const totalImpressions  = allReports.reduce((s: number, r: any) => s + (r.metrics?.totalImpressions ?? 0), 0);
  const totalReach        = allReports.reduce((s: number, r: any) => s + (r.metrics?.totalReach ?? 0), 0);
  const totalMessages     = allReports.reduce((s: number, r: any) => s + (r.metrics?.messagesInitiated ?? 0), 0);
  const totalVisits       = allReports.reduce((s: number, r: any) => s + (r.metrics?.instagramProfileVisits ?? 0), 0);
  const totalPurchases    = allReports.reduce((s: number, r: any) => s + (parseInt(r.metrics?.purchases ?? "0") || 0), 0);
  const totalPurchaseVal  = allReports.reduce((s: number, r: any) => s + parseFloat(r.metrics?.purchaseValue || "0"), 0);
  const totalFollowers    = allReports.reduce((s: number, r: any) => s + (r.metrics?.newInstagramFollowers ?? 0), 0);

  const cpcMedio  = totalClicks > 0       ? totalSpent / totalClicks   : 0;
  const cpmMedio  = totalImpressions > 0  ? (totalSpent / totalImpressions) * 1000 : 0;
  const ctrMedio  = totalImpressions > 0  ? (totalClicks / totalImpressions) * 100 : 0;
  const roas      = totalSpent > 0 && totalPurchaseVal > 0 ? totalPurchaseVal / totalSpent : 0;
  const cpMsg     = totalMessages > 0     ? totalSpent / totalMessages  : 0;

  // ── Gráficos por empresa ─────────────────────────────────────────────────
  const companyMap = Object.fromEntries((companies ?? []).map((c: any) => [c.id, c.name]));

  const byCompanySpent = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of allReports) {
      const name = companyMap[r.companyId] ?? `Empresa ${r.companyId}`;
      map[name] = (map[name] ?? 0) + parseFloat(r.metrics?.totalSpent || "0");
    }
    return Object.entries(map)
      .map(([name, v]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, value: v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [allReports, companyMap]);

  const byCompanyClicks = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of allReports) {
      const name = companyMap[r.companyId] ?? `Empresa ${r.companyId}`;
      map[name] = (map[name] ?? 0) + (r.metrics?.totalClicks ?? 0);
    }
    return Object.entries(map)
      .map(([name, v]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, value: v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [allReports, companyMap]);

  const byCompanyMessages = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of allReports) {
      const name = companyMap[r.companyId] ?? `Empresa ${r.companyId}`;
      const msgs = r.metrics?.messagesInitiated ?? 0;
      if (msgs > 0) map[name] = (map[name] ?? 0) + msgs;
    }
    return Object.entries(map)
      .map(([name, v]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, value: v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [allReports, companyMap]);

  // Relatórios recentes
  const recentReports = useMemo(() =>
    [...allReports]
      .sort((a: any, b: any) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, 6),
    [allReports]
  );

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1,2].map(i => <div key={i} className="h-56 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Olá, {user?.name?.split(" ")[0] ?? "Viking"} 👋
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-xs text-white/40">Dashboard geral · todos os relatórios</p>
            {lastUpdated && (
              <span className="text-[10px] text-white/25">
                Atualizado {lastUpdated.toLocaleTimeString("pt-BR")}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={manualRefetch}
          disabled={isManualRefreshing}
          className="gap-2 shrink-0 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
        >
          {isManualRefreshing
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <RefreshCw className="h-4 w-4" />}
          <span className="hidden sm:inline">{isManualRefreshing ? "Atualizando…" : "Atualizar"}</span>
        </Button>
      </div>

      {/* ── Row 1: KPIs principais ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <BigKPI
          label="Investimento Total"
          value={fmtR(totalSpent)}
          sub="todos os relatórios"
          icon={DollarSign}
          color="text-yellow-400"
          bg="bg-yellow-500"
          onClick={() => setLocation("/relatorios")}
        />
        <BigKPI
          label="Cliques Totais"
          value={fmt(totalClicks)}
          sub={cpcMedio > 0 ? `CPC médio ${fmtR(cpcMedio)}` : "todos os anúncios"}
          icon={MousePointerClick}
          color="text-blue-400"
          bg="bg-blue-500"
        />
        <BigKPI
          label="Alcance Total"
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
        ) : totalMessages > 0 ? (
          <BigKPI
            label="Mensagens"
            value={fmt(totalMessages)}
            sub={cpMsg > 0 ? `Custo/msg ${fmtR(cpMsg)}` : "iniciadas via anúncios"}
            icon={MessageCircle}
            color="text-pink-400"
            bg="bg-pink-500"
          />
        ) : (
          <BigKPI
            label="Empresas Ativas"
            value={connectedMeta}
            sub={`de ${totalCompanies} cadastradas`}
            icon={Building2}
            color="text-cyan-400"
            bg="bg-cyan-500"
            onClick={() => setLocation("/contas")}
          />
        )}
      </div>

      {/* ── Row 2: KPIs secundários ── */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <SmallKPI label="Empresas"       value={totalCompanies}                    sub={`${connectedMeta} c/ Meta`}         icon={Building2}        color="text-blue-400" />
        <SmallKPI label="Relatórios"     value={totalReports}                      sub="no total"                          icon={FileText}         color="text-cyan-400" />
        <SmallKPI label="CTR Médio"      value={`${ctrMedio.toFixed(2)}%`}         sub="cliques/impressões"                icon={Activity}         color="text-yellow-400" />
        <SmallKPI label="CPM Médio"      value={cpmMedio > 0 ? fmtR(cpmMedio) : "—"} sub="custo por mil"                  icon={Eye}              color="text-violet-400" />
        <SmallKPI label="Seguidores"     value={fmt(totalFollowers)}               sub="novos no período"                  icon={Star}             color="text-pink-400" />
        <SmallKPI label="Visitas Perfil" value={fmt(totalVisits)}                  sub="Instagram"                         icon={Target}           color="text-emerald-400" />
      </div>

      {/* ── Row 3: Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <BarSection
          title="Investimento por Empresa"
          data={byCompanySpent}
          dataKey="value"
          color="text-yellow-400"
          currency
          icon={DollarSign}
        />
        <BarSection
          title="Cliques por Empresa"
          data={byCompanyClicks}
          dataKey="value"
          color="text-blue-400"
          icon={MousePointerClick}
        />
      </div>

      {/* ── Row 4: Mensagens + Funil ── */}
      {byCompanyMessages.length > 0 && (
        <BarSection
          title="Mensagens por Empresa"
          data={byCompanyMessages}
          dataKey="value"
          color="text-pink-400"
          icon={MessageCircle}
        />
      )}

      {/* ── Funil Agregado ── */}
      {totalImpressions > 0 && (
        <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
          <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
            <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-white/70">
              <Target className="h-3.5 w-3.5 text-yellow-400" />
              Funil de Marketing — Todos os Relatórios
            </CardTitle>
            <p className="text-[10px] text-white/30">Acumulado de todos os relatórios cadastrados</p>
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

      {/* ── Row 5: Relatórios recentes + Ações rápidas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">

        {/* Relatórios recentes */}
        <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
          <CardHeader className="pb-2 pt-4 px-4 sm:px-5 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-white/70 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-yellow-400" />
              Relatórios Recentes
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-white/40 hover:text-white"
              onClick={() => setLocation("/relatorios")}>
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="px-4 sm:px-5 pb-4 space-y-1.5">
            {recentReports.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-8">Nenhum relatório cadastrado.</p>
            ) : recentReports.map((r: any) => {
              const spent = parseFloat(r.metrics?.totalSpent || r.totalSpent || "0");
              const clicks = r.metrics?.totalClicks ?? 0;
              return (
                <div key={r.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/4 transition-colors border border-transparent hover:border-white/6">
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

        {/* Ações rápidas + status */}
        <div className="space-y-3">
          <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
            <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-white/70 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-yellow-400" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-5 pb-4 grid grid-cols-2 gap-2">
              {[
                { label: "Nova Empresa",    icon: Building2,        path: "/relatorios",  color: "text-blue-400",    border: "border-blue-500/20",    bg: "hover:bg-blue-500/8"    },
                { label: "Conectar Meta",   icon: Zap,              path: "/contas",      color: "text-yellow-400",  border: "border-yellow-500/20",  bg: "hover:bg-yellow-500/8" },
                { label: "Ver Campanhas",   icon: BarChart3,        path: "/campanhas",   color: "text-cyan-400",    border: "border-cyan-500/20",    bg: "hover:bg-cyan-500/8"    },
                { label: "Gerador de URL",  icon: TrendingUp,       path: "/gerador-url", color: "text-emerald-400", border: "border-emerald-500/20", bg: "hover:bg-emerald-500/8" },
              ].map(a => (
                <button
                  key={a.path}
                  onClick={() => setLocation(a.path)}
                  className={`flex items-center gap-2 p-3 rounded-xl border ${a.border} ${a.bg} transition-all text-left`}
                >
                  <a.icon className={`h-4 w-4 ${a.color} shrink-0`} />
                  <span className="text-xs font-medium text-white/70">{a.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Status geral */}
          <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
            <CardContent className="p-4 sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Status Geral</p>
              <div className="space-y-2.5">
                {[
                  { label: "Empresas cadastradas",  value: totalCompanies, total: totalCompanies, color: "bg-blue-500" },
                  { label: "Meta conectado",         value: connectedMeta,  total: totalCompanies, color: "bg-yellow-500" },
                  { label: "Relatórios publicados",  value: totalReports,   total: Math.max(totalReports, 1), color: "bg-emerald-500" },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-white/40">{s.label}</span>
                      <span className="text-[10px] font-bold text-white">{s.value}</span>
                    </div>
                    <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${s.color} rounded-full transition-all`}
                        style={{ width: s.total > 0 ? `${(s.value / s.total) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
