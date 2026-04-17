import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Building2, Zap, RefreshCw, AlertCircle, Link2 } from "lucide-react";
import { useLocation } from "wouter";

export default function ContasAnuncio() {
  const { data: companies, isLoading, refetch } = trpc.company.list.useQuery();
  const [, setLocation] = useLocation();

  const connectedCount = companies?.filter((c: any) => c.metaAccessToken).length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contas de Anúncio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as conexões Meta Ads de cada empresa
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10">
            {connectedCount} conectada{connectedCount !== 1 ? "s" : ""}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : !companies?.length ? (
        <div className="text-center py-20 space-y-4">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">Nenhuma empresa cadastrada ainda.</p>
          <Button onClick={() => setLocation("/relatorios")} variant="outline">
            Ir para Relatórios
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {companies.map((company: any) => {
            const isConnected = !!company.metaAccessToken;
            const isExpired = company.metaTokenExpiresAt
              ? new Date(company.metaTokenExpiresAt) < new Date()
              : false;

            return (
              <Card key={company.id} className="glass-card border-white/10 hover:border-white/20 transition-all">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{company.name}</p>
                        <p className="text-xs text-muted-foreground">{company.description || "Sem descrição"}</p>
                      </div>
                    </div>
                    {isConnected && !isExpired ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : isExpired ? (
                      <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                    ) : null}
                  </div>

                  {isConnected && !isExpired ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <Zap className="h-3 w-3" />
                        <span className="font-medium">Meta Ads conectado</span>
                      </div>
                      {company.metaAdAccountId && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                          <Link2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-mono text-muted-foreground truncate">{company.metaAdAccountId}</span>
                        </div>
                      )}
                      {company.metaTokenExpiresAt && (
                        <p className="text-[10px] text-muted-foreground">
                          Token expira em: {new Date(company.metaTokenExpiresAt).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {isExpired && (
                        <p className="text-xs text-amber-400">Token expirado. Reconecte para continuar.</p>
                      )}
                      <Button
                        size="sm"
                        className="w-full rounded-xl bg-[#1877F2] hover:bg-[#1466d8] text-white text-xs font-bold"
                        onClick={() => { window.location.href = `/api/meta/connect?companyId=${company.id}`; }}
                      >
                        <Zap className="h-3 w-3 mr-1.5" />
                        {isExpired ? "Reconectar com Meta" : "Conectar com Meta"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
