import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  RefreshCw, Building2, Zap, Link2, Copy, Check,
  Search, AlertCircle, Loader2, ExternalLink,
  Play, Pause, Archive, CircleDot, Filter, CalendarDays,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { useLocation } from "wouter";

// ─── Date presets ─────────────────────────────────────────────────────────────
const DATE_PRESETS = [
  { label: "Hoje",      days: 0 },
  { label: "7 dias",    days: 7 },
  { label: "14 dias",   days: 14 },
  { label: "30 dias",   days: 30 },
  { label: "60 dias",   days: 60 },
  { label: "90 dias",   days: 90 },
];

function getDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  if (days > 0) start.setDate(start.getDate() - days);
  return {
    since: start.toISOString().split("T")[0],
    until: end.toISOString().split("T")[0],
  };
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE") return (
    <Badge variant="outline" className="text-[10px] h-5 text-emerald-400 border-emerald-400/30 bg-emerald-400/10 gap-1 shrink-0">
      <Play className="h-2.5 w-2.5" /> Ativa
    </Badge>
  );
  if (s === "PAUSED") return (
    <Badge variant="outline" className="text-[10px] h-5 text-amber-400 border-amber-400/30 bg-amber-400/10 gap-1 shrink-0">
      <Pause className="h-2.5 w-2.5" /> Pausada
    </Badge>
  );
  if (s === "ARCHIVED") return (
    <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground border-white/10 gap-1 shrink-0">
      <Archive className="h-2.5 w-2.5" /> Arquivada
    </Badge>
  );
  return (
    <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground border-white/10 gap-1 shrink-0">
      <CircleDot className="h-2.5 w-2.5" /> {status}
    </Badge>
  );
}

// ─── UTM Builder inline (estilo UTMify) ──────────────────────────────────────
function UtmBuilder({
  campaignName, campaignId, companyId, onClose,
}: { campaignName: string; campaignId: string; companyId: number; onClose: () => void }) {
  const [baseUrl, setBaseUrl] = useState("");
  const [utmSource, setUtmSource] = useState("facebook");
  const [utmMedium, setUtmMedium] = useState("cpc");
  const [utmCampaign, setUtmCampaign] = useState("{{campaign.name}}");
  const [utmContent, setUtmContent] = useState("{{ad.name}}");
  const [utmTerm, setUtmTerm] = useState("{{adset.name}}");
  const [activeTab, setActiveTab] = useState<"params" | "ads">("params");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: adsData, isLoading: loadingAds } = trpc.meta.listAds.useQuery(
    { companyId, campaignId },
    { enabled: activeTab === "ads" }
  );

  const paramsString = useMemo(() => {
    const parts: string[] = [];
    if (utmSource) parts.push(`utm_source=${encodeURIComponent(utmSource)}`);
    if (utmMedium) parts.push(`utm_medium=${encodeURIComponent(utmMedium)}`);
    if (utmCampaign) parts.push(`utm_campaign=${encodeURIComponent(utmCampaign)}`);
    if (utmContent) parts.push(`utm_content=${encodeURIComponent(utmContent)}`);
    if (utmTerm) parts.push(`utm_term=${encodeURIComponent(utmTerm)}`);
    return parts.join("&");
  }, [utmSource, utmMedium, utmCampaign, utmContent, utmTerm]);

  const buildUrl = (base: string) => {
    if (!base) return "";
    try {
      const url = new URL(base.startsWith("http") ? base : `https://${base}`);
      if (utmSource) url.searchParams.set("utm_source", utmSource);
      if (utmMedium) url.searchParams.set("utm_medium", utmMedium);
      if (utmCampaign) url.searchParams.set("utm_campaign", utmCampaign);
      if (utmContent) url.searchParams.set("utm_content", utmContent);
      if (utmTerm) url.searchParams.set("utm_term", utmTerm);
      return url.toString();
    } catch { return ""; }
  };

  const finalUrl = useMemo(() => buildUrl(baseUrl), [baseUrl, paramsString]);

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Gera URL para anúncio específico (substitui variáveis dinâmicas)
  const buildAdUrl = (adName: string, adsetName: string) => {
    const campaign = utmCampaign.replace("{{campaign.name}}", campaignName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, ""));
    const content = utmContent.replace("{{ad.name}}", adName).replace("{{adset.name}}", adsetName);
    const term = utmTerm.replace("{{adset.name}}", adsetName).replace("{{ad.name}}", adName);
    if (!baseUrl) {
      return `utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${encodeURIComponent(campaign)}&utm_content=${encodeURIComponent(content)}&utm_term=${encodeURIComponent(term)}`;
    }
    try {
      const url = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
      url.searchParams.set("utm_source", utmSource);
      url.searchParams.set("utm_medium", utmMedium);
      url.searchParams.set("utm_campaign", campaign);
      url.searchParams.set("utm_content", content);
      url.searchParams.set("utm_term", term);
      return url.toString();
    } catch { return ""; }
  };

  const DYNAMIC_TAGS = ["{{campaign.name}}", "{{campaign.id}}", "{{adset.name}}", "{{adset.id}}", "{{ad.name}}", "{{ad.id}}", "{{placement}}"];

  return (
    <div className="mt-2 rounded-xl bg-[#0d1422] border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1877F2]/10">
        <div className="flex items-center gap-2">
          <Link2 className="h-3.5 w-3.5 text-[#1877F2]" />
          <p className="text-xs font-bold text-white">UTM Builder</p>
          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">— {campaignName}</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
          <Check className="h-3.5 w-3.5 hidden" />
          <span className="text-xs">✕</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {[
          { id: "params", label: "⚙ Parâmetros" },
          { id: "ads", label: "📋 Por Anúncio" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id ? "text-[#1877F2] border-b-2 border-[#1877F2] bg-[#1877F2]/5" : "text-muted-foreground hover:text-white"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {activeTab === "params" && (
          <>
            {/* URL base */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">URL do Site (opcional)</Label>
              <Input value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://seusite.com.br/pagina"
                className="h-8 text-xs bg-white/5 border-white/10 rounded-lg" />
            </div>

            {/* Campos UTM */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "utm_source", val: utmSource, set: setUtmSource, color: "text-emerald-400" },
                { label: "utm_medium", val: utmMedium, set: setUtmMedium, color: "text-blue-400" },
                { label: "utm_campaign", val: utmCampaign, set: setUtmCampaign, color: "text-primary" },
                { label: "utm_content", val: utmContent, set: setUtmContent, color: "text-orange-400" },
                { label: "utm_term", val: utmTerm, set: setUtmTerm, color: "text-purple-400" },
              ].map(f => (
                <div key={f.label} className="col-span-2 sm:col-span-1">
                  <Label className={`text-[10px] uppercase mb-1 block font-bold ${f.color}`}>{f.label}</Label>
                  <Input value={f.val} onChange={e => f.set(e.target.value)}
                    className="h-8 text-xs bg-white/5 border-white/10 rounded-lg font-mono" />
                </div>
              ))}
            </div>

            {/* Tags dinâmicas */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Tags dinâmicas do Meta</p>
              <div className="flex flex-wrap gap-1">
                {DYNAMIC_TAGS.map(tag => (
                  <button key={tag} onClick={() => setUtmCampaign(tag)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors font-mono">
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {paramsString && (
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Preview dos parâmetros</p>
                <p className="text-[10px] font-mono text-cyan-300 break-all">{paramsString}</p>
              </div>
            )}
            {finalUrl && (
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">URL completa</p>
                <p className="text-[10px] font-mono text-white/70 break-all">{finalUrl}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" onClick={() => copy(paramsString, "params")}
                variant="outline" className="h-8 text-xs rounded-lg border-white/15 gap-1">
                {copiedId === "params" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copiar Parâmetros
              </Button>
              <Button size="sm" onClick={() => copy(finalUrl || paramsString, "url")}
                className="h-8 text-xs rounded-lg bg-[#1877F2] hover:bg-[#1466d8] gap-1">
                {copiedId === "url" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {finalUrl ? "Copiar URL" : "Copiar Params"}
              </Button>
            </div>

            <div className="text-[10px] text-muted-foreground bg-white/3 p-2.5 rounded-lg border border-white/8 leading-relaxed">
              💡 <strong className="text-white/70">Como usar:</strong> No Gerenciador de Anúncios do Meta, abra o anúncio → Editar → URL do site → cole os parâmetros UTM após o <code className="text-cyan-400">?</code> da URL.
            </div>
          </>
        )}

        {activeTab === "ads" && (
          <>
            <p className="text-[10px] text-muted-foreground">
              Configure a URL base na aba Parâmetros e depois copie a URL com UTMs para cada anúncio abaixo.
            </p>
            {!baseUrl && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300">
                ⚠ Preencha a URL base na aba Parâmetros para gerar URLs por anúncio.
              </div>
            )}
            {loadingAds ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando anúncios...
              </div>
            ) : adsData?.ads && adsData.ads.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Nenhum anúncio encontrado nesta campanha.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {adsData?.ads.map(ad => {
                  const adUrl = buildAdUrl(ad.name, ad.adsetName);
                  return (
                    <div key={ad.id} className="p-2.5 rounded-lg bg-white/3 border border-white/8 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">{ad.name}</p>
                          <p className="text-[10px] text-muted-foreground">{ad.adsetName}</p>
                        </div>
                        <Button size="sm" onClick={() => copy(adUrl, ad.id)}
                          className="h-6 text-[10px] rounded-lg bg-[#1877F2] hover:bg-[#1466d8] px-2 shrink-0">
                          {copiedId === ad.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      {adUrl && (
                        <p className="text-[9px] font-mono text-white/40 break-all line-clamp-2">{adUrl}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Status filters ───────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { id: "all",      label: "Todas" },
  { id: "ACTIVE",   label: "Ativas" },
  { id: "PAUSED",   label: "Pausadas" },
  { id: "ARCHIVED", label: "Arquivadas" },
];

// ─── Company campaigns block ──────────────────────────────────────────────────
function CompanyCampaigns({
  company, search, statusFilter,
}: { company: any; search: string; statusFilter: string }) {
  const [expanded, setExpanded] = useState(false); // fechado por padrão
  const [openUtm, setOpenUtm] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.meta.listCampaigns.useQuery(
    { companyId: company.id },
    { enabled: !!company.metaAccessToken && !!company.metaAdAccountId }
  );

  const campaigns = useMemo(() => {
    const all = data?.campaigns ?? [];
    return all.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || (c.effective_status || c.status).toUpperCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  const isConnected = !!company.metaAccessToken;
  const hasAccount = !!company.metaAdAccountId;
  const totalAll = data?.campaigns?.length ?? 0;
  const activeCount = data?.campaigns?.filter(c => (c.effective_status || c.status).toUpperCase() === "ACTIVE").length ?? 0;

  return (
    <Card className="glass-card border-white/10">
      <button onClick={() => setExpanded(v => !v)} className="w-full text-left p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm truncate">{company.name}</p>
                {isConnected && hasAccount && (
                  <Badge variant="outline" className="text-[10px] h-4 text-emerald-400 border-emerald-400/30 bg-emerald-400/10 shrink-0">
                    <Zap className="h-2.5 w-2.5 mr-0.5" /> Meta
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {isLoading ? "Carregando..." : isConnected && hasAccount
                  ? `${totalAll} campanhas · ${activeCount} ativas`
                  : "Sem Meta configurado"}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      {expanded && (
        <CardContent className="px-4 pb-4 pt-0 space-y-2 border-t border-white/5">
          {!isConnected && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mt-3">
              <AlertCircle className="h-4 w-4 shrink-0" /> Meta Ads não conectado.
            </div>
          )}
          {isConnected && !hasAccount && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mt-3">
              <AlertCircle className="h-4 w-4 shrink-0" /> Conta de anúncio não selecionada.
            </div>
          )}
          {isLoading && (
            <div className="flex items-center gap-2 py-4 text-muted-foreground text-xs mt-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Buscando campanhas no Meta...
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 mt-3">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error.message}
            </div>
          )}
          {!isLoading && !error && campaigns.length === 0 && isConnected && hasAccount && (
            <p className="text-xs text-muted-foreground py-4 text-center mt-2">
              Nenhuma campanha encontrada com os filtros aplicados.
            </p>
          )}
          {campaigns.map(campaign => (
            <div key={campaign.id} className="rounded-xl border border-white/8 bg-white/3">
              <div className="flex items-center gap-2 p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{campaign.name}</p>
                    <StatusBadge status={campaign.effective_status || campaign.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {campaign.objective && (
                      <span className="text-[10px] text-muted-foreground">{campaign.objective.replace(/_/g, " ")}</span>
                    )}
                    {campaign.daily_budget && (
                      <span className="text-[10px] text-muted-foreground">R$ {(parseInt(campaign.daily_budget) / 100).toFixed(2)}/dia</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="outline"
                    className={`h-7 rounded-lg text-[11px] gap-1 border-white/15 ${openUtm === campaign.id ? "bg-primary/10 border-primary/30 text-primary" : ""}`}
                    onClick={() => setOpenUtm(openUtm === campaign.id ? null : campaign.id)}>
                    <Link2 className="h-3 w-3" /> UTM
                  </Button>
                  <a href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${company.metaAdAccountId?.replace("act_", "")}&selected_campaign_ids=${campaign.id}`}
                    target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="h-7 w-7 rounded-lg border-white/15 p-0">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </div>
              {openUtm === campaign.id && (
                <div className="px-3 pb-3">
                  <UtmBuilder
                    campaignName={campaign.name}
                    campaignId={campaign.id}
                    companyId={company.id}
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Campanhas() {
  const { data: companies, isLoading, refetch } = trpc.company.list.useQuery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [datePreset, setDatePreset] = useState(30);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [, setLocation] = useLocation();

  const dateRange = useMemo(() => getDateRange(datePreset), [datePreset]);

  const companiesWithMeta = companies?.filter((c: any) => c.metaAccessToken && c.metaAdAccountId) ?? [];
  const companiesWithoutMeta = companies?.filter((c: any) => !c.metaAccessToken || !c.metaAdAccountId) ?? [];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Campanhas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Campanhas reais do Meta Ads</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 h-8 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar campanha..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 rounded-xl h-9 text-sm" />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {STATUS_FILTERS.map(f => (
            <button key={f.id} onClick={() => setStatusFilter(f.id)}
              className={`text-xs px-3 py-1 rounded-lg border font-medium transition-colors ${
                statusFilter === f.id ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {DATE_PRESETS.map(p => (
            <button key={p.days} onClick={() => setDatePreset(p.days)}
              className={`text-xs px-3 py-1 rounded-lg border font-medium transition-colors ${
                datePreset === p.days ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}>
              {p.label}
            </button>
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">
            {dateRange.since} → {dateRange.until}
          </span>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : !companies?.length ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-muted-foreground text-sm">Nenhuma empresa cadastrada.</p>
          <Button onClick={() => setLocation("/relatorios")} variant="outline" size="sm">Ir para Relatórios</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {companiesWithMeta.map((company: any) => (
            <CompanyCampaigns key={company.id} company={company} search={search} statusFilter={statusFilter} />
          ))}

          {companiesWithoutMeta.length > 0 && (
            <div className="p-3 rounded-xl border border-white/10 border-dashed opacity-50">
              <p className="text-xs text-muted-foreground mb-2">Sem Meta configurado ({companiesWithoutMeta.length}):</p>
              <div className="flex flex-wrap gap-1.5">
                {companiesWithoutMeta.map((c: any) => (
                  <Badge key={c.id} variant="outline" className="text-[11px] border-white/10 text-muted-foreground">
                    {c.name}
                  </Badge>
                ))}
              </div>
              <Button size="sm" variant="outline" className="mt-2 text-xs h-7 gap-1" onClick={() => setLocation("/contas")}>
                <Zap className="h-3 w-3" /> Conectar Meta
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
