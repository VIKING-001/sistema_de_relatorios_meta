import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Megaphone, TrendingUp, MousePointerClick, Eye, DollarSign,
  RefreshCw, Search, Building2, BarChart3, Zap, ShoppingCart,
} from "lucide-react";
import { useLocation } from "wouter";

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <Card className="glass-card border-white/10">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-bold text-sm">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Campanhas() {
  const { data: companies, isLoading, refetch } = trpc.company.list.useQuery();
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const filtered = companies?.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  // Aggregate totals across all companies/reports
  const totals = companies?.reduce((acc: any, c: any) => {
    (c.reports || []).forEach((r: any) => {
      acc.spent += parseFloat(r.totalSpent || "0");
      acc.clicks += r.totalClicks || 0;
      acc.impressions += r.totalImpressions || 0;
      acc.reach += r.totalReach || 0;
    });
    return acc;
  }, { spent: 0, clicks: 0, impressions: 0, reach: 0 });

  const fmt = (n: number) => n.toLocaleString("pt-BR");
  const fmtR = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campanhas</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral de performance de todos os relatórios</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Investimento total" value={fmtR(totals?.spent ?? 0)} icon={DollarSign} color="text-emerald-400" />
        <MetricCard label="Cliques totais" value={fmt(totals?.clicks ?? 0)} icon={MousePointerClick} color="text-blue-400" />
        <MetricCard label="Impressões" value={fmt(totals?.impressions ?? 0)} icon={Eye} color="text-purple-400" />
        <MetricCard label="Alcance total" value={fmt(totals?.reach ?? 0)} icon={TrendingUp} color="text-orange-400" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar empresa..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-white/5 border-white/10 rounded-xl"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : !filtered.length ? (
        <div className="text-center py-20 space-y-4">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">
            {search ? "Nenhuma empresa encontrada." : "Nenhuma empresa cadastrada ainda."}
          </p>
          {!search && (
            <Button onClick={() => setLocation("/relatorios")} variant="outline">
              Ir para Relatórios
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((company: any) => {
            const reports = company.reports || [];
            const companySpent = reports.reduce((s: number, r: any) => s + parseFloat(r.totalSpent || "0"), 0);
            const companyClicks = reports.reduce((s: number, r: any) => s + (r.totalClicks || 0), 0);
            const companyImpressions = reports.reduce((s: number, r: any) => s + (r.totalImpressions || 0), 0);
            const isConnected = !!company.metaAccessToken;

            return (
              <Card key={company.id} className="glass-card border-white/10 hover:border-white/20 transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Company info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{company.name}</p>
                          {isConnected && (
                            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-400/30 bg-emerald-400/10 h-4">
                              <Zap className="h-2.5 w-2.5 mr-1" />Meta
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {reports.length} relatório{reports.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4 text-center sm:text-right">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Investido</p>
                        <p className="text-sm font-bold text-emerald-400">{fmtR(companySpent)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cliques</p>
                        <p className="text-sm font-bold text-blue-400">{fmt(companyClicks)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Impressões</p>
                        <p className="text-sm font-bold text-purple-400">{fmt(companyImpressions)}</p>
                      </div>
                    </div>

                    {/* Reports mini list */}
                    {reports.length > 0 && (
                      <div className="hidden xl:flex items-center gap-1">
                        {reports.slice(0, 3).map((r: any) => (
                          <Badge key={r.id} variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                            {r.title.length > 12 ? r.title.slice(0, 12) + "…" : r.title}
                          </Badge>
                        ))}
                        {reports.length > 3 && (
                          <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                            +{reports.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
