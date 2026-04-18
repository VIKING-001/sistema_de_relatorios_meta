import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Building2, Zap, RefreshCw, AlertCircle,
  Link2, DollarSign, Eye, TrendingUp, MousePointerClick,
  BarChart3, AlertTriangle,
} from "lucide-react";
import { useLocation } from "wouter";

const DATE_PRESETS = [
  { label: "7 dias", value: 7 },
  { label: "14 dias", value: 14 },
  { label: "30 dias", value: 30 },
  { label: "60 dias", value: 60 },
  { label: "90 dias", value: 90 },
];

function MetricCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: any; color: string;
}) {
  return (
    <Card className="glass-card border-white/10">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContasAnuncio() {
  const [, setLocation] = useLocation();
  const [days, setDays] = useState(30);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined);

  const { data: companies, isLoading: loadingCompanies, refetch: refetchCompanies } = trpc.company.list.useQuery();

  const { data: insightsData, isLoading: loadingInsights, refetch: refetchInsights, isFetching } =
    trpc.meta.getAllAccountsInsights.useQuery(
      { days, companyId: selectedCompanyId },
      { refetchInterval: 5 * 60 * 1000 } // atualiza a cada 5 min
    );

  const connectedCompanies = useMemo(
    () => (companies ?? []).filter((c: any) => c.metaAccessToken && c.metaAdAccountId),
    [companies]
  );

  const fmt = (n: number) => n.toLocaleString("pt-BR");
  const fmtR = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const totals = insightsData?.totals;
  const cpcMedio = totals && totals.totalClicks > 0 ? totals.totalSpent / totals.totalClicks : 0;

  const refetch = () => { refetchCompanies(); refetchInsights(); };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contas de Anúncio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas em tempo real de todas as contas Meta Ads conectadas
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10">
            {connectedCompanies.length} conectada{connectedCompanies.length !== 1 ? "s" : ""}
          </Badge>
          <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Filtro de período */}
        <div className="flex gap-1.5 flex-wrap">
          {DATE_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                days === p.value
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Filtro por empresa */}
        {connectedCompanies.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedCompanyId(undefined)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                !selectedCompanyId
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              Todas as empresas
            </button>
            {connectedCompanies.map((c: any) => (
              <button
                key={c.id}
                onClick={() => setSelectedCompanyId(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all max-w-[140px] truncate ${
                  selectedCompanyId === c.id
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cards de totais */}
      {loadingInsights ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : totals ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard label="Investimento total" value={fmtR(totals.totalSpent)} sub={`últimos ${days} dias`} icon={DollarSign} color="text-yellow-400" />
          <MetricCard label="Impressões" value={fmt(totals.totalImpressions)} icon={Eye} color="text-purple-400" />
          <MetricCard label="Alcance" value={fmt(totals.totalReach)} icon={TrendingUp} color="text-blue-400" />
          <MetricCard label="Cliques" value={fmt(totals.totalClicks)} icon={MousePointerClick} color="text-pink-400" />
          <MetricCard label="CPC médio" value={totals.totalClicks > 0 ? fmtR(cpcMedio) : "—"} icon={BarChart3} color="text-emerald-400" />
        </div>
      ) : null}

      {/* Erros de contas */}
      {insightsData?.failed && insightsData.failed.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Erro ao carregar: {insightsData.failed.map((f: any) => f.companyName).join(", ")}</span>
        </div>
      )}

      {/* Breakdown por conta */}
      {insightsData?.accounts && insightsData.accounts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Detalhes por conta</h2>
          <div className="space-y-3">
            {insightsData.accounts.map((acc: any) => (
              <Card key={acc.companyId} className="glass-card border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{acc.companyName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{acc.adAccountId}</p>
                    </div>
                    <div className="ml-auto">
                      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        <Zap className="h-2.5 w-2.5 mr-1" /> Ativo
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { label: "Investido", value: fmtR(acc.metrics.totalSpent ?? 0), color: "text-yellow-400" },
                      { label: "Impressões", value: fmt(acc.metrics.totalImpressions ?? 0), color: "text-purple-400" },
                      { label: "Alcance", value: fmt(acc.metrics.totalReach ?? 0), color: "text-blue-400" },
                      { label: "Cliques", value: fmt(acc.metrics.totalClicks ?? 0), color: "text-pink-400" },
                      {
                        label: "CPC médio",
                        value: (acc.metrics.totalClicks ?? 0) > 0
                          ? fmtR((acc.metrics.totalSpent ?? 0) / acc.metrics.totalClicks)
                          : "—",
                        color: "text-emerald-400"
                      },
                    ].map(m => (
                      <div key={m.label} className="p-2.5 rounded-xl bg-white/3 border border-white/5 space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
                        <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                  {acc.metrics._warning && (
                    <p className="text-[10px] text-amber-400/70 mt-2">{acc.metrics._warning}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Lista de empresas não conectadas */}
      {(() => {
        const notConnected = (companies ?? []).filter((c: any) => !c.metaAccessToken || !c.metaAdAccountId);
        if (!notConnected.length) return null;
        return (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Não conectadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {notConnected.map((company: any) => (
                <Card key={company.id} className="glass-card border-white/10">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{company.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {company.metaAccessToken && !company.metaAdAccountId ? "Sem conta de anúncio" : "Sem conexão Meta"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0 rounded-xl bg-[#1877F2] hover:bg-[#1466d8] text-white text-xs"
                      onClick={() => setLocation("/relatorios")}
                    >
                      Conectar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Estado vazio */}
      {!loadingCompanies && !companies?.length && (
        <div className="text-center py-20 space-y-4">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">Nenhuma empresa cadastrada ainda.</p>
          <Button onClick={() => setLocation("/relatorios")} variant="outline">Ir para Relatórios</Button>
        </div>
      )}
    </div>
  );
}
