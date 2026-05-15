import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  RefreshCw, Building2, Zap, Link2, Copy, Check,
  Search, AlertCircle, Loader2, ExternalLink,
  Play, Pause, Archive, Filter, CalendarDays,
  ChevronDown, ChevronRight, ArrowLeft, Layers, Megaphone,
  BarChart2, TrendingUp, Target, DollarSign,
} from "lucide-react";
import { useLocation } from "wouter";

// ─── Date helpers ─────────────────────────────────────────────────────────────
const DATE_PRESETS = [
  { label: "Hoje",    days: 0,  yesterday: false },
  { label: "Ontem",  days: 1,  yesterday: true  },
  { label: "7 dias", days: 7,  yesterday: false },
  { label: "14 dias",days: 14, yesterday: false },
  { label: "30 dias",days: 30, yesterday: false },
  { label: "60 dias",days: 60, yesterday: false },
  { label: "90 dias",days: 90, yesterday: false },
];

function localDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDateRange(preset: { days: number; yesterday: boolean }) {
  const end = new Date();
  const start = new Date();
  if (preset.yesterday) {
    end.setDate(end.getDate() - 1);
    start.setDate(start.getDate() - 1);
  } else if (preset.days > 0) {
    start.setDate(start.getDate() - preset.days);
  }
  return { since: localDateStr(start), until: localDateStr(end) };
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtBRLcents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtPct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 shrink-0">
      <Play className="h-2.5 w-2.5" /> Ativa
    </span>
  );
  if (s === "PAUSED") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/25 shrink-0">
      <Pause className="h-2.5 w-2.5" /> Pausada
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-zinc-400 bg-zinc-400/10 border border-zinc-400/20 shrink-0">
      <Archive className="h-2.5 w-2.5" /> {s === "ARCHIVED" ? "Arquivada" : (status || "—")}
    </span>
  );
}

// ─── Metric cell ──────────────────────────────────────────────────────────────
function MetricCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-right w-[90px] shrink-0">
      <p className="text-[9px] text-white/30 uppercase tracking-wider">{label}</p>
      <p className={`text-xs font-bold mt-0.5 tabular-nums ${color ?? "text-white/80"}`}>{value}</p>
    </div>
  );
}

function MetricsGroup({ spend, revenue, roi, cpa }: { spend: number; revenue: number; roi: number; cpa: number }) {
  const hasSpend = spend > 0;
  return (
    <div className="flex items-center gap-3 shrink-0 ml-3">
      <MetricCell label="Gasto"   value={hasSpend ? fmtBRL(spend) : "—"} color={hasSpend ? "text-white" : "text-white/20"} />
      <MetricCell label="Receita" value={revenue > 0 ? fmtBRL(revenue) : "—"} color={revenue > 0 ? "text-emerald-400" : "text-white/20"} />
      <MetricCell label="ROI"     value={hasSpend ? fmtPct(roi) : "—"} color={hasSpend ? (roi >= 0 ? "text-emerald-400" : "text-red-400") : "text-white/20"} />
      <MetricCell label="CPA"     value={cpa > 0 ? fmtBRL(cpa) : "—"} color={cpa > 0 ? "text-primary" : "text-white/20"} />
    </div>
  );
}

// ─── Ad Row ───────────────────────────────────────────────────────────────────
function AdRow({ ad }: { ad: any }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-black/20 last:border-0">
      <div className="w-5 shrink-0" /><div className="w-5 shrink-0" />
      <div className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0 ml-2" />
      <div className="flex-1 min-w-0 ml-2">
        <p className="text-xs text-white/70 truncate">{ad.name || "Anúncio sem nome"}</p>
      </div>
      <StatusBadge status={ad.status || ""} />
      <MetricsGroup spend={ad.spend ?? 0} revenue={ad.revenue ?? 0} roi={ad.roi ?? 0} cpa={ad.cpa ?? 0} />
    </div>
  );
}

// ─── Adset Row ────────────────────────────────────────────────────────────────
function AdsetRow({
  adset, companyId, startDate, endDate,
}: { adset: any; companyId: number; startDate: string; endDate: string }) {
  const [expanded, setExpanded] = useState(false);

  const { data: adsData, isLoading } = trpc.meta.adInsights.useQuery(
    { companyId, adsetId: adset.id, startDate, endDate },
    { enabled: expanded }
  );

  const ads: any[] = adsData ?? [];

  return (
    <>
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="w-5 shrink-0" />
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          {expanded
            ? <ChevronDown className="h-3 w-3 text-primary/70" />
            : <ChevronRight className="h-3 w-3 text-white/30" />}
        </div>
        <Layers className="h-3 w-3 text-primary/50 shrink-0" />
        <div className="flex-1 min-w-0 ml-1.5">
          <p className="text-xs font-medium text-white/80 truncate">{adset.name || "Conjunto sem nome"}</p>
          {!isLoading && <p className="text-[10px] text-white/30">{ads.length || "?"} anúncio{(ads.length || 0) !== 1 ? "s" : ""}</p>}
        </div>
        <StatusBadge status={adset.status || ""} />
        <MetricsGroup spend={adset.spend ?? 0} revenue={adset.revenue ?? 0} roi={adset.roi ?? 0} cpa={adset.cpa ?? 0} />
      </div>
      {expanded && (
        <>
          {isLoading && (
            <div className="flex items-center gap-2 px-14 py-2.5 text-xs text-white/30 bg-black/20 border-b border-white/5">
              <Loader2 className="h-3 w-3 animate-spin text-primary" /> Buscando anúncios no Meta...
            </div>
          )}
          {!isLoading && ads.length === 0 && (
            <div className="px-14 py-2.5 text-xs text-white/20 bg-black/20 border-b border-white/5">
              Sem anúncios com dados no período.
            </div>
          )}
          {ads.map((ad: any) => <AdRow key={ad.id} ad={ad} />)}
        </>
      )}
    </>
  );
}

// ─── Campaign Row ─────────────────────────────────────────────────────────────
function CampaignRow({
  campaign, metrics, companyId, metaAccountId, startDate, endDate, openUtm, setOpenUtm,
}: {
  campaign: any; metrics: any; companyId: number; metaAccountId: string;
  startDate: string; endDate: string; openUtm: string | null; setOpenUtm: (id: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data: adsetsData, isLoading: loadingAdsets } = trpc.meta.adsetInsights.useQuery(
    { companyId, campaignId: campaign.id, startDate, endDate },
    { enabled: expanded }
  );

  const adsets: any[] = adsetsData ?? [];

  return (
    <>
      <div
        className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer transition-all duration-200"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          {expanded
            ? <ChevronDown className="h-3.5 w-3.5 text-primary" />
            : <ChevronRight className="h-3.5 w-3.5 text-white/30" />}
        </div>
        <Megaphone className="h-3.5 w-3.5 text-primary/60 shrink-0" />
        <div className="flex-1 min-w-0 ml-1.5">
          <p className="text-sm font-semibold text-white truncate">{campaign.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {campaign.objective && (
              <span className="text-[10px] text-white/30">{campaign.objective.replace(/_/g, " ")}</span>
            )}
            {campaign.daily_budget && (
              <span className="text-[10px] text-white/20">{fmtBRLcents(parseInt(campaign.daily_budget))}/dia</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <StatusBadge status={campaign.effective_status || campaign.status || ""} />
          <button
            className={`px-2 py-1 rounded-lg border text-[10px] flex items-center gap-1 transition-all ${
              openUtm === campaign.id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-white/10 bg-white/5 text-white/40 hover:text-primary hover:border-primary/30"
            }`}
            onClick={() => setOpenUtm(openUtm === campaign.id ? null : campaign.id)}
          >
            <Link2 className="h-3 w-3" /> UTM
          </button>
          <a
            href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${metaAccountId?.replace("act_", "")}&selected_campaign_ids=${campaign.id}`}
            target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-primary hover:border-primary/30 transition-all"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <MetricsGroup
          spend={metrics?.spend ?? 0}
          revenue={metrics?.revenue ?? 0}
          roi={metrics?.roi ?? 0}
          cpa={metrics?.cpa ?? 0}
        />
      </div>

      {expanded && (
        <>
          {loadingAdsets && (
            <div className="flex items-center gap-2 px-12 py-3 text-xs text-white/30 bg-white/[0.02] border-b border-white/5">
              <Loader2 className="h-3 w-3 animate-spin text-primary" /> Buscando conjuntos no Meta...
            </div>
          )}
          {!loadingAdsets && adsets.length === 0 && (
            <div className="px-12 py-3 text-xs text-white/20 bg-white/[0.02] border-b border-white/5">
              Nenhum conjunto encontrado para este período.
            </div>
          )}
          {adsets.map((adset: any) => (
            <AdsetRow key={adset.id} adset={adset} companyId={companyId} startDate={startDate} endDate={endDate} />
          ))}
        </>
      )}

      {openUtm === campaign.id && (
        <div className="px-4 pb-3 pt-2 bg-black/20 border-b border-white/8">
          <UtmBuilder
            campaignName={campaign.name}
            campaignId={campaign.id}
            companyId={companyId}
            onClose={() => setOpenUtm(null)}
          />
        </div>
      )}
    </>
  );
}

// ─── UTM Builder ──────────────────────────────────────────────────────────────
function UtmBuilder({ campaignName, campaignId, companyId, onClose }:
  { campaignName: string; campaignId: string; companyId: number; onClose: () => void }) {
  const [baseUrl, setBaseUrl]         = useState("");
  const [utmSource, setUtmSource]     = useState("facebook");
  const [utmMedium, setUtmMedium]     = useState("cpc");
  const [utmCampaign, setUtmCampaign] = useState("{{campaign.name}}");
  const [utmContent, setUtmContent]   = useState("{{ad.name}}");
  const [utmTerm, setUtmTerm]         = useState("{{adset.name}}");
  const [activeTab, setActiveTab]     = useState<"params" | "ads">("params");
  const [copiedId, setCopiedId]       = useState<string | null>(null);

  const { data: adsData, isLoading: loadingAds } = trpc.meta.listAds.useQuery(
    { companyId, campaignId }, { enabled: activeTab === "ads" }
  );

  const paramsString = useMemo(() => {
    const p: string[] = [];
    if (utmSource)   p.push(`utm_source=${encodeURIComponent(utmSource)}`);
    if (utmMedium)   p.push(`utm_medium=${encodeURIComponent(utmMedium)}`);
    if (utmCampaign) p.push(`utm_campaign=${encodeURIComponent(utmCampaign)}`);
    if (utmContent)  p.push(`utm_content=${encodeURIComponent(utmContent)}`);
    if (utmTerm)     p.push(`utm_term=${encodeURIComponent(utmTerm)}`);
    return p.join("&");
  }, [utmSource, utmMedium, utmCampaign, utmContent, utmTerm]);

  const buildUrl = (base: string) => {
    if (!base) return "";
    try {
      const url = new URL(base.startsWith("http") ? base : `https://${base}`);
      if (utmSource)   url.searchParams.set("utm_source", utmSource);
      if (utmMedium)   url.searchParams.set("utm_medium", utmMedium);
      if (utmCampaign) url.searchParams.set("utm_campaign", utmCampaign);
      if (utmContent)  url.searchParams.set("utm_content", utmContent);
      if (utmTerm)     url.searchParams.set("utm_term", utmTerm);
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

  const buildAdUrl = (adName: string, adsetName: string) => {
    const c = utmCampaign.replace("{{campaign.name}}", campaignName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, ""));
    const content = utmContent.replace("{{ad.name}}", adName).replace("{{adset.name}}", adsetName);
    const term = utmTerm.replace("{{adset.name}}", adsetName).replace("{{ad.name}}", adName);
    if (!baseUrl) return `utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${encodeURIComponent(c)}&utm_content=${encodeURIComponent(content)}&utm_term=${encodeURIComponent(term)}`;
    try {
      const url = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
      url.searchParams.set("utm_source", utmSource);
      url.searchParams.set("utm_medium", utmMedium);
      url.searchParams.set("utm_campaign", c);
      url.searchParams.set("utm_content", content);
      url.searchParams.set("utm_term", term);
      return url.toString();
    } catch { return ""; }
  };

  const DYNAMIC_TAGS = ["{{campaign.name}}", "{{campaign.id}}", "{{adset.name}}", "{{adset.id}}", "{{ad.name}}", "{{ad.id}}"];

  return (
    <div className="rounded-xl bg-black/30 border border-primary/20 overflow-hidden text-xs">
      <div className="flex items-center justify-between px-3 py-2 border-b border-primary/20 bg-primary/5">
        <div className="flex items-center gap-1.5">
          <Link2 className="h-3 w-3 text-primary" />
          <span className="font-bold text-white">UTM Builder</span>
          <span className="text-white/40 truncate max-w-[200px]">— {campaignName}</span>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white px-1">✕</button>
      </div>
      <div className="flex border-b border-white/10">
        {[{ id: "params", label: "Parâmetros" }, { id: "ads", label: "Por Anúncio" }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id ? "text-primary border-b-2 border-primary bg-primary/5" : "text-white/40 hover:text-white"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-3 space-y-3">
        {activeTab === "params" && (
          <>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-white/30 mb-1 block">URL base</Label>
              <Input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://seusite.com.br"
                className="h-7 text-xs bg-white/5 border-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "utm_source", val: utmSource, set: setUtmSource },
                { label: "utm_medium", val: utmMedium, set: setUtmMedium },
                { label: "utm_campaign", val: utmCampaign, set: setUtmCampaign },
                { label: "utm_content", val: utmContent, set: setUtmContent },
                { label: "utm_term", val: utmTerm, set: setUtmTerm },
              ].map(f => (
                <div key={f.label} className="col-span-2 sm:col-span-1">
                  <Label className="text-[10px] uppercase text-white/30 mb-1 block">{f.label}</Label>
                  <Input value={f.val} onChange={e => f.set(e.target.value)} className="h-7 text-xs bg-white/5 border-white/10 font-mono" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {DYNAMIC_TAGS.map(tag => (
                <button key={tag} onClick={() => setUtmCampaign(tag)}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40 hover:text-primary hover:border-primary/30 font-mono transition-colors">
                  {tag}
                </button>
              ))}
            </div>
            {paramsString && (
              <div className="p-2 rounded bg-primary/5 border border-primary/20">
                <p className="text-[9px] text-white/30 mb-1">Preview</p>
                <p className="text-[10px] font-mono text-primary/80 break-all">{paramsString}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" onClick={() => copy(paramsString, "params")} variant="outline" className="h-7 text-xs gap-1 border-white/15">
                {copiedId === "params" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Parâmetros
              </Button>
              <Button size="sm" onClick={() => copy(finalUrl || paramsString, "url")} className="h-7 text-xs gap-1">
                {copiedId === "url" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {finalUrl ? "URL Completa" : "Params"}
              </Button>
            </div>
          </>
        )}
        {activeTab === "ads" && (
          <>
            {!baseUrl && <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300">Preencha a URL base primeiro.</div>}
            {loadingAds ? (
              <div className="flex items-center gap-1.5 text-white/30 py-2"><Loader2 className="h-3 w-3 animate-spin text-primary" /> Buscando anúncios...</div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {adsData?.ads.map(ad => {
                  const adUrl = buildAdUrl(ad.name, ad.adsetName);
                  return (
                    <div key={ad.id} className="flex items-center justify-between gap-2 p-2 rounded bg-white/3 border border-white/8">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{ad.name}</p>
                        <p className="text-[10px] text-white/40">{ad.adsetName}</p>
                      </div>
                      <Button size="sm" onClick={() => copy(adUrl, ad.id)} className="h-6 text-[10px] px-2 shrink-0">
                        {copiedId === ad.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
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

// ─── STATUS FILTERS ───────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { id: "all",      label: "Todas" },
  { id: "ACTIVE",   label: "Ativas" },
  { id: "PAUSED",   label: "Pausadas" },
  { id: "ARCHIVED", label: "Arquivadas" },
];

// ─── Company Detail View ──────────────────────────────────────────────────────
function CompanyDetailView({ company, onBack }: { company: any; onBack: () => void }) {
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [datePreset, setDatePreset]   = useState(DATE_PRESETS[4]); // 30 dias
  const [openUtm, setOpenUtm]         = useState<string | null>(null);

  const dateRange = useMemo(() => getDateRange(datePreset), [datePreset]);

  const { data: campaignsData, isLoading: loadingCampaigns, error, refetch } =
    trpc.meta.listCampaigns.useQuery({ companyId: company.id });

  const { data: insightsData, isLoading: loadingInsights, refetch: refetchInsights } =
    trpc.meta.campaignInsights.useQuery(
      { companyId: company.id, startDate: dateRange.since, endDate: dateRange.until },
      { enabled: !!company.metaAccessToken && !!company.metaAdAccountId }
    );

  const insightsMap = useMemo(() => {
    const map: Record<string, any> = {};
    (insightsData ?? []).forEach((m: any) => { map[m.id] = m; });
    return map;
  }, [insightsData]);

  const allCampaigns = campaignsData?.campaigns ?? [];
  const campaigns = useMemo(() => allCampaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || (c.effective_status || c.status).toUpperCase() === statusFilter;
    return matchSearch && matchStatus;
  }), [allCampaigns, search, statusFilter]);

  const totalAll    = allCampaigns.length;
  const activeCount = allCampaigns.filter(c => (c.effective_status || c.status).toUpperCase() === "ACTIVE").length;
  const totalSpend  = (insightsData ?? []).reduce((s: number, m: any) => s + (m.spend ?? 0), 0);
  const totalRev    = (insightsData ?? []).reduce((s: number, m: any) => s + (m.revenue ?? 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/40 hover:text-primary text-xs transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white uppercase tracking-wide">{company.name}</h1>
            <p className="text-[11px] text-white/40">
              {loadingCampaigns ? "Carregando..." : `${totalAll} campanhas · ${activeCount} ativas`}
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-white/15 shrink-0"
          disabled={loadingInsights} onClick={() => { refetch(); refetchInsights(); }}>
          <RefreshCw className={`h-3.5 w-3.5 ${loadingInsights ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Campanhas",     value: String(totalAll),                                  icon: Megaphone,  color: "text-primary" },
          { label: "Ativas",        value: String(activeCount),                               icon: Play,       color: "text-emerald-400" },
          { label: "Gasto Total",   value: loadingInsights ? "..." : fmtBRL(totalSpend),      icon: DollarSign, color: "text-white" },
          { label: "Receita Total", value: loadingInsights ? "..." : fmtBRL(totalRev),        icon: TrendingUp, color: "text-emerald-400" },
        ].map(card => (
          <div key={card.label} className="glass-card rounded-xl p-4 border border-white/10 hover:border-primary/30 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
              <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium">{card.label}</p>
            </div>
            <p className={`text-xl font-bold tabular-nums ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input placeholder="Buscar campanha..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 rounded-xl h-9 text-sm" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-white/30 shrink-0" />
          {STATUS_FILTERS.map(f => (
            <button key={f.id} onClick={() => setStatusFilter(f.id)}
              className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all ${
                statusFilter === f.id
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
              }`}>
              {f.label}
            </button>
          ))}
          <div className="mx-1 h-4 w-px bg-white/10" />
          <CalendarDays className="h-3.5 w-3.5 text-white/30 shrink-0" />
          {DATE_PRESETS.map(p => (
            <button key={p.label} onClick={() => setDatePreset(p)}
              className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all ${
                datePreset.label === p.label
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
              }`}>
              {p.label}
            </button>
          ))}
          <span className="text-[10px] text-white/20 ml-1 hidden sm:inline">
            {dateRange.since} → {dateRange.until}
          </span>
          {loadingInsights && (
            <span className="flex items-center gap-1 text-[10px] text-white/30 ml-2">
              <Loader2 className="h-3 w-3 animate-spin text-primary" /> Atualizando...
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
        {campaigns.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-black/30 border-b border-white/8 text-[10px] text-white/25 uppercase tracking-widest font-bold">
            <div className="w-5 shrink-0" />
            <div className="flex-1">Campanha / Conjunto / Anúncio</div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <div className="w-[90px] text-right">Gasto</div>
              <div className="w-[90px] text-right">Receita</div>
              <div className="w-[90px] text-right">ROI</div>
              <div className="w-[90px] text-right">CPA</div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 m-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error.message}
          </div>
        )}
        {loadingCampaigns && (
          <div className="flex items-center gap-2 px-4 py-10 text-white/30 text-xs">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Buscando campanhas no Meta...
          </div>
        )}
        {!loadingCampaigns && !error && campaigns.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-white/30">
            <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>Nenhuma campanha encontrada.</p>
          </div>
        )}

        {campaigns.map(campaign => (
          <CampaignRow
            key={campaign.id}
            campaign={campaign}
            metrics={insightsMap[campaign.id] ?? null}
            companyId={company.id}
            metaAccountId={company.metaAdAccountId}
            startDate={dateRange.since}
            endDate={dateRange.until}
            openUtm={openUtm}
            setOpenUtm={setOpenUtm}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Company Selector ─────────────────────────────────────────────────────────
function CompanySelector({
  companies, isLoading, onSelect,
}: { companies: any[]; isLoading: boolean; onSelect: (c: any) => void }) {
  const [, setLocation] = useLocation();
  const withMeta    = companies.filter(c => c.metaAccessToken && c.metaAdAccountId);
  const withoutMeta = companies.filter(c => !c.metaAccessToken || !c.metaAdAccountId);

  if (isLoading) return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Campanhas</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Selecione uma empresa para ver suas campanhas</p>
        </div>
      </div>

      {withMeta.length === 0 && withoutMeta.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Nenhuma empresa cadastrada</p>
          <Button onClick={() => setLocation("/relatorios")} variant="outline" size="sm" className="mt-3 gap-2">
            <Building2 className="h-4 w-4" /> Ir para Relatórios
          </Button>
        </div>
      )}

      {withMeta.length > 0 && (
        <div>
          <p className="text-xs text-white/30 uppercase tracking-widest mb-3 font-bold">Meta Ads conectado</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {withMeta.map((company: any) => (
              <CompanyCard key={company.id} company={company} onClick={() => onSelect(company)} />
            ))}
          </div>
        </div>
      )}

      {withoutMeta.length > 0 && (
        <div>
          <p className="text-xs text-white/30 uppercase tracking-widest mb-3 font-bold">Sem Meta configurado</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {withoutMeta.map((company: any) => (
              <CompanyCard key={company.id} company={company} onClick={() => setLocation("/contas")} disabled />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Company Card ─────────────────────────────────────────────────────────────
function CompanyCard({ company, onClick, disabled }: { company: any; onClick: () => void; disabled?: boolean }) {
  const { data } = trpc.meta.listCampaigns.useQuery(
    { companyId: company.id },
    { enabled: !!company.metaAccessToken && !!company.metaAdAccountId }
  );

  const totalAll    = data?.campaigns?.length ?? 0;
  const activeCount = data?.campaigns?.filter((c: any) => (c.effective_status || c.status).toUpperCase() === "ACTIVE").length ?? 0;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left glass-card group overflow-hidden border-white/10 rounded-2xl transition-all duration-500 p-0 ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/30 cursor-pointer"
      }`}
    >
      {/* Card header */}
      <div className="relative overflow-hidden p-5 pb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-start justify-between gap-3 relative">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              disabled ? "bg-white/5" : "bg-primary/20 border border-primary/30"
            }`}>
              <Building2 className={`h-5 w-5 ${disabled ? "text-white/30" : "text-primary"}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-white uppercase tracking-wide truncate leading-tight">
                {company.name}
              </h3>
              {!disabled && company.metaAdAccountId && (
                <p className="text-[10px] text-primary/60 font-mono truncate mt-0.5">
                  {company.metaAdAccountId}
                </p>
              )}
            </div>
          </div>
          {!disabled && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 shrink-0">
              <Zap className="h-2.5 w-2.5" /> Meta ✓
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      {!disabled && (
        <div className="px-5 pb-2 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="h-3 w-3 text-white/20" />
            <span className="text-[11px] text-white/40">
              <span className="text-white font-semibold">{totalAll}</span> campanhas
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Play className="h-3 w-3 text-emerald-400/60" />
            <span className="text-[11px] text-white/40">
              <span className="text-emerald-400 font-semibold">{activeCount}</span> ativas
            </span>
          </div>
        </div>
      )}
      {disabled && (
        <div className="px-5 pb-2">
          <p className="text-[11px] text-white/20">Meta não configurado</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-5 pb-5 pt-3 border-t border-white/5 flex gap-2">
        {!disabled ? (
          <>
            <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/8 text-xs text-white/50 hover:text-white hover:border-white/20 transition-all">
              <BarChart2 className="h-3.5 w-3.5" /> Ver Campanhas
            </div>
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary/15 border border-primary/30 text-xs text-primary font-semibold group-hover:bg-primary/20 transition-all">
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/8 text-xs text-white/30">
            <Zap className="h-3.5 w-3.5" /> Clique para configurar
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Campanhas() {
  const { data: companies, isLoading } = trpc.company.list.useQuery();
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);

  if (selectedCompany) {
    return <CompanyDetailView company={selectedCompany} onBack={() => setSelectedCompany(null)} />;
  }

  return (
    <CompanySelector
      companies={companies ?? []}
      isLoading={isLoading}
      onSelect={setSelectedCompany}
    />
  );
}
