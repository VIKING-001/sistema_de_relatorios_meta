import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, BarChart3, Zap, TrendingUp, DollarSign,
  MousePointerClick, Eye, Users, RefreshCw, ArrowUpRight,
  FileText, CheckCircle2,
} from "lucide-react";
import { useLocation } from "wouter";

function StatCard({
  label, value, sub, icon: Icon, color, onClick,
}: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; onClick?: () => void;
}) {
  return (
    <Card
      className={`glass-card border-white/10 transition-all ${onClick ? "cursor-pointer hover:border-white/20" : ""}`}
      onClick={onClick}
    >
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

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: companies, isLoading, refetch } = trpc.company.list.useQuery();

  const totalCompanies = companies?.length ?? 0;
  const connectedMeta = companies?.filter((c: any) => c.metaAccessToken).length ?? 0;
  const allReports = companies?.flatMap((c: any) => c.reports || []) ?? [];
  const totalReports = allReports.length;

  const totalSpent = allReports.reduce((s, r: any) => s + parseFloat(r.totalSpent || "0"), 0);
  const totalClicks = allReports.reduce((s, r: any) => s + (r.totalClicks || 0), 0);
  const totalImpressions = allReports.reduce((s, r: any) => s + (r.totalImpressions || 0), 0);
  const totalReach = allReports.reduce((s, r: any) => s + (r.totalReach || 0), 0);

  const fmt = (n: number) => n.toLocaleString("pt-BR");
  const fmtR = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Latest reports (last 5)
  const recentReports = [...allReports]
    .sort((a: any, b: any) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 5);

  const companyMap = Object.fromEntries(
    (companies ?? []).map((c: any) => [c.id, c.name])
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Olá, {user?.name?.split(" ")[0] ?? "Viking"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aqui está o resumo geral de todas as suas campanhas
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {/* Row 1 — Business stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Empresas"
          value={totalCompanies}
          sub={`${connectedMeta} com Meta ativo`}
          icon={Building2}
          color="text-blue-400"
          onClick={() => setLocation("/relatorios")}
        />
        <StatCard
          label="Relatórios"
          value={totalReports}
          sub="no total"
          icon={FileText}
          color="text-cyan-400"
          onClick={() => setLocation("/relatorios")}
        />
        <StatCard
          label="Meta conectado"
          value={connectedMeta}
          sub={totalCompanies > 0 ? `de ${totalCompanies} empresa${totalCompanies !== 1 ? "s" : ""}` : "—"}
          icon={CheckCircle2}
          color="text-emerald-400"
          onClick={() => setLocation("/contas")}
        />
        <StatCard
          label="Investimento total"
          value={fmtR(totalSpent)}
          sub="todos os relatórios"
          icon={DollarSign}
          color="text-yellow-400"
        />
      </div>

      {/* Row 2 — Campaign metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Cliques totais"
          value={fmt(totalClicks)}
          icon={MousePointerClick}
          color="text-purple-400"
        />
        <StatCard
          label="Impressões"
          value={fmt(totalImpressions)}
          icon={Eye}
          color="text-pink-400"
        />
        <StatCard
          label="Alcance"
          value={fmt(totalReach)}
          icon={TrendingUp}
          color="text-orange-400"
        />
        <StatCard
          label="CPC médio"
          value={totalClicks > 0 ? fmtR(totalSpent / totalClicks) : "—"}
          icon={BarChart3}
          color="text-indigo-400"
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent reports */}
        <Card className="glass-card border-white/10">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Relatórios Recentes</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setLocation("/relatorios")}>
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentReports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum relatório ainda.</p>
            ) : (
              recentReports.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium truncate max-w-[160px]">{r.title}</p>
                      <p className="text-[10px] text-muted-foreground">{companyMap[r.companyId] ?? "—"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                    {fmtR(parseFloat(r.totalSpent || "0"))}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="glass-card border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: "Nova Empresa", icon: Building2, path: "/relatorios", color: "text-blue-400" },
              { label: "Conectar Meta", icon: Zap, path: "/contas", color: "text-[#1877F2]" },
              { label: "Ver Campanhas", icon: BarChart3, path: "/campanhas", color: "text-cyan-400" },
              { label: "Gerador de URL", icon: TrendingUp, path: "/gerador-url", color: "text-emerald-400" },
            ].map(action => (
              <button
                key={action.path}
                onClick={() => setLocation(action.path)}
                className="flex items-center gap-2.5 p-3.5 rounded-xl bg-white/3 border border-white/8 hover:bg-white/8 hover:border-white/15 transition-all text-left"
              >
                <action.icon className={`h-4 w-4 ${action.color}`} />
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
