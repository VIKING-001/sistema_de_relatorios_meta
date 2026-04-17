import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, CheckCircle2, AlertCircle, Zap, ExternalLink, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

const INTEGRATIONS = [
  {
    id: "meta",
    name: "Meta Ads",
    description: "Facebook & Instagram Ads — importe dados de campanha automaticamente",
    logo: "f",
    logoColor: "bg-[#1877F2]",
    docsUrl: "https://developers.facebook.com/docs/marketing-api",
    category: "Anúncios",
  },
  {
    id: "google",
    name: "Google Ads",
    description: "Google Ads — em breve",
    logo: "G",
    logoColor: "bg-red-500",
    docsUrl: "https://developers.google.com/google-ads/api/docs/start",
    category: "Anúncios",
    comingSoon: true,
  },
  {
    id: "tiktok",
    name: "TikTok Ads",
    description: "TikTok for Business — em breve",
    logo: "tt",
    logoColor: "bg-black border border-white/20",
    docsUrl: "https://ads.tiktok.com/marketing_api/docs",
    category: "Anúncios",
    comingSoon: true,
  },
  {
    id: "ga4",
    name: "Google Analytics 4",
    description: "Importe sessões, conversões e dados de tráfego — em breve",
    logo: "GA",
    logoColor: "bg-orange-500",
    docsUrl: "https://developers.google.com/analytics",
    category: "Analytics",
    comingSoon: true,
  },
  {
    id: "sheets",
    name: "Google Sheets",
    description: "Exporte relatórios direto para planilhas — em breve",
    logo: "GS",
    logoColor: "bg-emerald-600",
    docsUrl: "https://developers.google.com/sheets/api",
    category: "Exportação",
    comingSoon: true,
  },
  {
    id: "webhook",
    name: "Webhooks",
    description: "Envie dados para qualquer sistema via HTTP — em breve",
    logo: "WH",
    logoColor: "bg-purple-600",
    docsUrl: "#",
    category: "Automação",
    comingSoon: true,
  },
];

export default function Integracoes() {
  const { data: companies } = trpc.company.list.useQuery();
  const [, setLocation] = useLocation();

  const connectedMeta = companies?.filter((c: any) => c.metaAccessToken).length ?? 0;
  const totalCompanies = companies?.length ?? 0;

  const categories = [...new Set(INTEGRATIONS.map(i => i.category))];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrações</h1>
        <p className="text-sm text-muted-foreground mt-1">Conecte plataformas para importar dados automaticamente</p>
      </div>

      {/* Meta status banner */}
      <Card className="glass-card border-white/10 bg-[#1877F2]/5 border-[#1877F2]/20">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center text-white text-sm font-bold shrink-0">
              f
            </div>
            <div>
              <p className="font-semibold text-sm">Meta Ads</p>
              <p className="text-xs text-muted-foreground">
                {connectedMeta} de {totalCompanies} empresa{totalCompanies !== 1 ? "s" : ""} conectada{connectedMeta !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connectedMeta > 0 ? (
              <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Ativo
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10">
                <AlertCircle className="h-3 w-3 mr-1" /> Não conectado
              </Badge>
            )}
            <Button size="sm" onClick={() => setLocation("/contas")} className="rounded-xl gap-1.5 text-xs">
              <Zap className="h-3 w-3" />
              {connectedMeta > 0 ? "Gerenciar" : "Conectar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integrations by category */}
      {categories.map(category => (
        <div key={category} className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {INTEGRATIONS.filter(i => i.category === category).map(integration => {
              const isActive = integration.id === "meta" && connectedMeta > 0;

              return (
                <Card
                  key={integration.id}
                  className={`glass-card border-white/10 transition-all ${integration.comingSoon ? "opacity-60" : "hover:border-white/20"}`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${integration.logoColor}`}>
                          {integration.logo}
                        </div>
                        <div>
                          <p className="font-semibold text-sm flex items-center gap-1.5">
                            {integration.name}
                            {integration.comingSoon && (
                              <Badge variant="outline" className="text-[9px] h-4 border-white/20 text-muted-foreground">
                                Em breve
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>
                      {isActive && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">{integration.description}</p>

                    <div className="flex items-center gap-2">
                      {!integration.comingSoon && (
                        <Button
                          size="sm"
                          variant={isActive ? "outline" : "default"}
                          className="rounded-lg text-xs h-7 flex-1"
                          onClick={() => setLocation("/contas")}
                        >
                          {isActive ? "Gerenciar" : "Conectar"}
                        </Button>
                      )}
                      {integration.docsUrl !== "#" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-xs h-7 gap-1"
                          onClick={() => window.open(integration.docsUrl, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" /> Docs
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
