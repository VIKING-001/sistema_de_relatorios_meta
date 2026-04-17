import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Megaphone, RefreshCw, Building2, Zap, ChevronDown, ChevronUp,
  Link2, Copy, Check, Search, AlertCircle, Loader2, ExternalLink,
  Play, Pause, Archive, CircleDot,
} from "lucide-react";
import { useLocation } from "wouter";

// ─── UTM Builder inline ────────────────────────────────────────────────────
const UTM_PLATFORMS = [
  { id: "facebook", label: "Facebook", utm_source: "facebook", utm_medium: "cpc" },
  { id: "instagram", label: "Instagram", utm_source: "instagram", utm_medium: "cpc" },
  { id: "google", label: "Google", utm_source: "google", utm_medium: "cpc" },
];

function UtmBuilder({ campaignName, onClose }: { campaignName: string; onClose: () => void }) {
  const [baseUrl, setBaseUrl] = useState("");
  const [platform, setPlatform] = useState(UTM_PLATFORMS[0]);
  const [utmCampaign, setUtmCampaign] = useState(
    campaignName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "")
  );
  const [utmContent, setUtmContent] = useState("{{ad.name}}");
  const [utmTerm, setUtmTerm] = useState("{{adset.name}}");
  const [copied, setCopied] = useState(false);

  const buildUrl = () => {
    if (!baseUrl) return "";
    try {
      const url = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
      url.searchParams.set("utm_source", platform.utm_source);
      url.searchParams.set("utm_medium", platform.utm_medium);
      if (utmCampaign) url.searchParams.set("utm_campaign", utmCampaign);
      if (utmContent) url.searchParams.set("utm_content", utmContent);
      if (utmTerm) url.searchParams.set("utm_term", utmTerm);
      return url.toString();
    } catch { return ""; }
  };

  const finalUrl = buildUrl();

  const handleCopy = async () => {
    if (!finalUrl) { toast.error("Preencha a URL base."); return; }
    await navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    toast.success("URL copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 p-4 rounded-xl bg-white/3 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" /> Gerador de UTM — {campaignName}
        </p>
        <button onClick={onClose} className="text-[10px] text-muted-foreground hover:text-foreground">Fechar ✕</button>
      </div>

      {/* Platform */}
      <div className="flex gap-1.5">
        {UTM_PLATFORMS.map(p => (
          <button key={p.id} onClick={() => setPlatform(p)}
            className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
              platform.id === p.id ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* URL base */}
      <div>
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">URL do site *</Label>
        <Input value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
          placeholder="https://seusite.com.br/pagina"
          className="h-8 text-xs bg-white/5 border-white/10 rounded-lg" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">utm_campaign</Label>
          <Input value={utmCampaign} onChange={e => setUtmCampaign(e.target.value)}
            className="h-8 text-xs bg-white/5 border-white/10 rounded-lg font-mono" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">utm_content</Label>
          <Input value={utmContent} onChange={e => setUtmContent(e.target.value)}
            className="h-8 text-xs bg-white/5 border-white/10 rounded-lg font-mono" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">utm_term</Label>
          <Input value={utmTerm} onChange={e => setUtmTerm(e.target.value)}
            className="h-8 text-xs bg-white/5 border-white/10 rounded-lg font-mono" />
        </div>
      </div>

      {/* Preview */}
      {finalUrl && (
        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 break-all text-[10px] font-mono text-muted-foreground">
          {finalUrl.split("?")[0]}
          <span className="text-white/30">?</span>
          {finalUrl.split("?")[1]?.split("&").map((param, i) => (
            <span key={i}>
              {i > 0 && <span className="text-white/20">&</span>}
              <span className="text-primary/80">{param.split("=")[0]}</span>
              <span className="text-white/20">=</span>
              <span className="text-emerald-400/80">{param.split("=").slice(1).join("=")}</span>
            </span>
          ))}
        </div>
      )}

      <Button onClick={handleCopy} size="sm" className="w-full h-8 rounded-lg text-xs gap-1.5">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copiado!" : "Copiar URL com UTM"}
      </Button>
    </div>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE") return (
    <Badge variant="outline" className="text-[10px] h-5 text-emerald-400 border-emerald-400/30 bg-emerald-400/10 gap-1">
      <Play className="h-2.5 w-2.5" /> Ativa
    </Badge>
  );
  if (s === "PAUSED") return (
    <Badge variant="outline" className="text-[10px] h-5 text-amber-400 border-amber-400/30 bg-amber-400/10 gap-1">
      <Pause className="h-2.5 w-2.5" /> Pausada
    </Badge>
  );
  if (s === "ARCHIVED") return (
    <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground border-white/10 gap-1">
      <Archive className="h-2.5 w-2.5" /> Arquivada
    </Badge>
  );
  return (
    <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground border-white/10 gap-1">
      <CircleDot className="h-2.5 w-2.5" /> {status}
    </Badge>
  );
}

// ─── Single company campaigns block ───────────────────────────────────────
function CompanyCampaigns({ company, search }: { company: any; search: string }) {
  const [expanded, setExpanded] = useState(true);
  const [openUtm, setOpenUtm] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = trpc.meta.listCampaigns.useQuery(
    { companyId: company.id },
    { enabled: !!company.metaAccessToken && !!company.metaAdAccountId }
  );

  const campaigns = (data?.campaigns ?? []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const isConnected = !!company.metaAccessToken;
  const hasAccount = !!company.metaAdAccountId;

  return (
    <Card className="glass-card border-white/10">
      {/* Company header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left"
      >
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{company.name}</p>
                  {isConnected && hasAccount && (
                    <Badge variant="outline" className="text-[10px] h-4 text-emerald-400 border-emerald-400/30 bg-emerald-400/10">
                      <Zap className="h-2.5 w-2.5 mr-0.5" /> Meta
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {company.metaAdAccountId ? `act_${company.metaAdAccountId.replace("act_", "")}` : "Sem conta selecionada"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isLoading && data && (
                <span className="text-xs text-muted-foreground">{campaigns.length} campanha{campaigns.length !== 1 ? "s" : ""}</span>
              )}
              {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
      </button>

      {expanded && (
        <CardContent className="px-5 pb-4 pt-0 space-y-2">
          {/* Not connected */}
          {!isConnected && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Meta Ads não conectado para esta empresa.
            </div>
          )}

          {/* No account */}
          {isConnected && !hasAccount && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Conta de anúncio não selecionada. Vá em Contas de Anúncio para configurar.
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center gap-2 py-4 text-muted-foreground text-xs">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando campanhas no Meta...
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error.message}
            </div>
          )}

          {/* Campaign list */}
          {!isLoading && !error && campaigns.length === 0 && isConnected && hasAccount && (
            <p className="text-xs text-muted-foreground py-3 text-center">
              {search ? "Nenhuma campanha encontrada com esse nome." : "Nenhuma campanha encontrada nesta conta."}
            </p>
          )}

          {campaigns.map(campaign => (
            <div key={campaign.id} className="rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{campaign.name}</p>
                    <StatusBadge status={campaign.effective_status || campaign.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {campaign.objective && (
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {campaign.objective.replace(/_/g, " ")}
                      </span>
                    )}
                    {campaign.daily_budget && (
                      <span className="text-[10px] text-muted-foreground">
                        Orçamento diário: R$ {(parseInt(campaign.daily_budget) / 100).toFixed(2)}
                      </span>
                    )}
                    {campaign.lifetime_budget && !campaign.daily_budget && (
                      <span className="text-[10px] text-muted-foreground">
                        Orçamento total: R$ {(parseInt(campaign.lifetime_budget) / 100).toFixed(2)}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-mono">ID: {campaign.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-7 rounded-lg text-[11px] gap-1 border-white/15 transition-colors ${
                      openUtm === campaign.id ? "bg-primary/10 border-primary/30 text-primary" : "hover:bg-white/10"
                    }`}
                    onClick={() => setOpenUtm(openUtm === campaign.id ? null : campaign.id)}
                  >
                    <Link2 className="h-3 w-3" />
                    UTM
                  </Button>
                  <a
                    href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${company.metaAdAccountId?.replace("act_", "")}&selected_campaign_ids=${campaign.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="h-7 rounded-lg text-[11px] gap-1 border-white/15 hover:bg-white/10">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </div>

              {/* UTM builder inline */}
              {openUtm === campaign.id && (
                <div className="px-3 pb-3">
                  <UtmBuilder
                    campaignName={campaign.name}
                    onClose={() => setOpenUtm(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function Campanhas() {
  const { data: companies, isLoading, refetch } = trpc.company.list.useQuery();
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const companiesWithMeta = companies?.filter((c: any) => c.metaAccessToken && c.metaAdAccountId) ?? [];
  const companiesWithoutMeta = companies?.filter((c: any) => !c.metaAccessToken || !c.metaAdAccountId) ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campanhas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Campanhas reais do Meta Ads — por conta de anúncio
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar campanha por nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-white/5 border-white/10 rounded-xl"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : !companies?.length ? (
        <div className="text-center py-20 space-y-4">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">Nenhuma empresa cadastrada.</p>
          <Button onClick={() => setLocation("/relatorios")} variant="outline">Ir para Relatórios</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Companies with Meta connected */}
          {companiesWithMeta.map((company: any) => (
            <CompanyCampaigns key={company.id} company={company} search={search} />
          ))}

          {/* Companies without Meta — show warning */}
          {companiesWithoutMeta.length > 0 && (
            <Card className="glass-card border-white/10 border-dashed opacity-60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium mb-2">
                  Empresas sem Meta configurado ({companiesWithoutMeta.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {companiesWithoutMeta.map((c: any) => (
                    <Badge key={c.id} variant="outline" className="text-[11px] border-white/10 text-muted-foreground gap-1">
                      <Building2 className="h-3 w-3" /> {c.name}
                    </Badge>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="mt-3 text-xs rounded-xl h-8 gap-1.5"
                  onClick={() => setLocation("/contas")}>
                  <Zap className="h-3.5 w-3.5" /> Conectar Meta Ads
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
