import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Check, Link2, Zap, Hash, Save, MousePointerClick, ShoppingBag, CheckCircle2, Building2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const PLATFORMS = [
  {
    id: "facebook", label: "Facebook Ads", color: "bg-[#1877F2]", emoji: "f",
    defaults: { utm_source: "facebook", utm_medium: "cpc", utm_campaign: "{{campaign.name}}", utm_content: "{{ad.name}}", utm_term: "{{adset.name}}" },
    tags: ["{{campaign.name}}", "{{campaign.id}}", "{{adset.name}}", "{{adset.id}}", "{{ad.name}}", "{{ad.id}}", "{{placement}}"],
  },
  {
    id: "instagram", label: "Instagram Ads", color: "bg-gradient-to-br from-purple-600 to-pink-500", emoji: "ig",
    defaults: { utm_source: "instagram", utm_medium: "cpc", utm_campaign: "{{campaign.name}}", utm_content: "{{ad.name}}", utm_term: "{{adset.name}}" },
    tags: ["{{campaign.name}}", "{{campaign.id}}", "{{adset.name}}", "{{ad.name}}", "{{placement}}"],
  },
  {
    id: "google", label: "Google Ads", color: "bg-red-500", emoji: "G",
    defaults: { utm_source: "google", utm_medium: "cpc", utm_campaign: "{campaignname}", utm_content: "{creative}", utm_term: "{keyword}" },
    tags: ["{campaignname}", "{campaignid}", "{adgroupname}", "{creative}", "{keyword}", "{matchtype}", "{device}"],
  },
  {
    id: "tiktok", label: "TikTok Ads", color: "bg-black", emoji: "tt",
    defaults: { utm_source: "tiktok", utm_medium: "cpc", utm_campaign: "__CAMPAIGN_NAME__", utm_content: "__CID_NAME__", utm_term: "__AID_NAME__" },
    tags: ["__CAMPAIGN_NAME__", "__CAMPAIGN_ID__", "__CID_NAME__", "__AID_NAME__"],
  },
  {
    id: "manual", label: "Manual", color: "bg-white/10", emoji: "⚙",
    defaults: { utm_source: "", utm_medium: "", utm_campaign: "", utm_content: "", utm_term: "" },
    tags: [],
  },
];

const UTM_FIELDS = [
  { key: "utm_source",   label: "Fonte (utm_source)",          placeholder: "facebook", color: "text-emerald-400" },
  { key: "utm_medium",   label: "Meio (utm_medium)",            placeholder: "cpc", color: "text-blue-400" },
  { key: "utm_campaign", label: "Campanha (utm_campaign)",      placeholder: "nome-da-campanha", color: "text-primary" },
  { key: "utm_content",  label: "Conteúdo (utm_content)",       placeholder: "nome-do-anuncio", color: "text-orange-400" },
  { key: "utm_term",     label: "Termo/Conjunto (utm_term)",    placeholder: "conjunto-de-anuncios", color: "text-purple-400" },
];

// Monta só a string de parâmetros UTM (sem URL base)
function buildUtmParams(utmParams: Record<string, string>): string {
  return Object.entries(utmParams)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
}

export default function GeradorUrl() {
  const [baseUrl, setBaseUrl] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("facebook");
  const [utmParams, setUtmParams] = useState(PLATFORMS[0].defaults);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedParams, setCopiedParams] = useState(false);
  // mode: "url" = URL completa, "params" = só parâmetros UTM
  const [mode, setMode] = useState<"url" | "params">("url");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [copiedShortId, setCopiedShortId] = useState<number | null>(null);

  // Empresas + links salvos
  const { data: companies } = trpc.company.list.useQuery();
  const { data: savedLinks, refetch: refetchLinks } = trpc.utm.list.useQuery(
    { companyId: selectedCompanyId ?? 0 },
    { enabled: !!selectedCompanyId }
  );
  const createLinkMut = trpc.utm.create.useMutation({
    onSuccess: () => {
      refetchLinks();
      toast.success("Link salvo e rastreável! Use o link curto na campanha.");
    },
    onError: (err) => toast.error(err.message || "Erro ao salvar link"),
  });

  const shortLinkFor = (code: string) => `${window.location.origin}/r/${code}`;

  const platform = PLATFORMS.find(p => p.id === selectedPlatform)!;

  const selectPlatform = (id: string) => {
    setSelectedPlatform(id);
    setUtmParams({ ...PLATFORMS.find(p => p.id === id)!.defaults });
  };

  const utmParamsString = useMemo(() => buildUtmParams(utmParams as any), [utmParams]);

  const finalUrl = useMemo(() => {
    if (!baseUrl) return "";
    try {
      const url = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
      Object.entries(utmParams).forEach(([k, v]) => {
        if (v) url.searchParams.set(k, v);
      });
      return url.toString();
    } catch {
      return "";
    }
  }, [baseUrl, utmParams]);

  const handleCopyUrl = async () => {
    if (!finalUrl) { toast.error("Preencha a URL base primeiro."); return; }
    await navigator.clipboard.writeText(finalUrl);
    setCopiedUrl(true);
    toast.success("URL completa copiada!");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyParams = async () => {
    if (!utmParamsString) { toast.error("Preencha ao menos um parâmetro UTM."); return; }
    await navigator.clipboard.writeText(utmParamsString);
    setCopiedParams(true);
    toast.success("Parâmetros UTM copiados!");
    setTimeout(() => setCopiedParams(false), 2000);
  };

  const insertTag = (tag: string, field: string) => {
    setUtmParams(prev => ({ ...prev, [field]: tag }));
  };

  const handleSaveLink = () => {
    if (!selectedCompanyId) { toast.error("Selecione a empresa para salvar o link."); return; }
    if (!baseUrl) { toast.error("Preencha a URL base primeiro."); return; }
    if (!(utmParams as any).utm_campaign) { toast.error("Preencha ao menos o utm_campaign."); return; }
    const normalized = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
    createLinkMut.mutate({
      companyId: selectedCompanyId,
      baseUrl: normalized,
      utmSource: (utmParams as any).utm_source || undefined,
      utmMedium: (utmParams as any).utm_medium || undefined,
      utmCampaign: (utmParams as any).utm_campaign,
      utmContent: (utmParams as any).utm_content || undefined,
      utmTerm: (utmParams as any).utm_term || undefined,
    });
  };

  const copyShort = async (link: any) => {
    await navigator.clipboard.writeText(shortLinkFor(link.shortCode));
    setCopiedShortId(link.id);
    toast.success("Link curto copiado!");
    setTimeout(() => setCopiedShortId(null), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gerador de URL</h1>
        <p className="text-sm text-muted-foreground mt-1">Crie parâmetros UTM para rastrear suas campanhas</p>
      </div>

      {/* Empresa (para salvar e rastrear o link) */}
      <Card className="glass-card border-white/10">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <Building2 className="h-3.5 w-3.5" /> Empresa
          </Label>
          <select
            value={selectedCompanyId ?? ""}
            onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-primary/50"
          >
            <option value="" className="bg-zinc-900">Selecione a empresa para salvar o link…</option>
            {companies?.map((c: any) => (
              <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("url")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
            mode === "url"
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
          }`}
        >
          <Link2 className="h-4 w-4" /> URL Completa
        </button>
        <button
          onClick={() => setMode("params")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
            mode === "params"
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
          }`}
        >
          <Hash className="h-4 w-4" /> Só Parâmetros UTM
        </button>
      </div>

      {/* Platform selector */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => selectPlatform(p.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
              selectedPlatform === p.id
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            <span className={`w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold ${p.color}`}>
              {p.emoji}
            </span>
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="glass-card border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Configurar Parâmetros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* URL Base — só exibe no modo URL */}
            {mode === "url" && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">URL Base *</Label>
                <Input
                  placeholder="https://seusite.com.br/pagina"
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl"
                />
              </div>
            )}

            {UTM_FIELDS.map(field => (
              <div key={field.key}>
                <Label className={`text-xs uppercase tracking-wider mb-1.5 block ${field.color}`}>
                  {field.label}
                </Label>
                <Input
                  placeholder={field.placeholder}
                  value={(utmParams as any)[field.key]}
                  onChange={e => setUtmParams(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-xl font-mono text-sm"
                />
                {/* Dynamic tags */}
                {platform.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {platform.tags.slice(0, 4).map(tag => (
                      <button
                        key={tag}
                        onClick={() => insertTag(tag, field.key)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors font-mono"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="space-y-4">

          {/* Modo: só parâmetros */}
          {mode === "params" && (
            <Card className="glass-card border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" /> Parâmetros UTM Gerados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {utmParamsString ? (
                  <>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 break-all text-xs font-mono text-muted-foreground leading-relaxed space-y-1">
                      {utmParamsString.split("&").map((param, i) => (
                        <div key={i} className="flex gap-1">
                          <span className="text-primary/80">{param.split("=")[0]}</span>
                          <span className="text-white/30">=</span>
                          <span className="text-emerald-400/80">{decodeURIComponent(param.split("=").slice(1).join("="))}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">String completa</p>
                      <p className="text-xs font-mono text-muted-foreground break-all">{utmParamsString}</p>
                    </div>

                    <Button onClick={handleCopyParams} className="w-full rounded-xl gap-2">
                      {copiedParams ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedParams ? "Copiado!" : "Copiar Parâmetros UTM"}
                    </Button>

                    <p className="text-[11px] text-muted-foreground text-center">
                      Cole no campo de URL da campanha no gerenciador de anúncios após o <span className="font-mono text-white/50">?</span>
                    </p>
                  </>
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    Preencha os parâmetros UTM para gerar
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Modo: URL completa */}
          {mode === "url" && (
            <Card className="glass-card border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" /> URL Gerada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {finalUrl ? (
                  <>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 break-all text-xs font-mono text-muted-foreground leading-relaxed">
                      {finalUrl.split("?")[0]}
                      {finalUrl.includes("?") && (
                        <>
                          <span className="text-white/40">?</span>
                          {finalUrl.split("?")[1].split("&").map((param, i) => (
                            <span key={i}>
                              {i > 0 && <span className="text-white/30">&</span>}
                              <span className="text-primary/80">{param.split("=")[0]}</span>
                              <span className="text-white/30">=</span>
                              <span className="text-emerald-400/80">{param.split("=").slice(1).join("=")}</span>
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                    <Button onClick={handleCopyUrl} variant="outline" className="w-full rounded-xl gap-2 border-white/10">
                      {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedUrl ? "Copiado!" : "Copiar URL Completa"}
                    </Button>
                    {/* Salvar = rastreável de verdade */}
                    <Button
                      onClick={handleSaveLink}
                      disabled={createLinkMut.isPending}
                      className="w-full rounded-xl gap-2 bg-primary hover:bg-primary/90"
                    >
                      {createLinkMut.isPending
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Save className="h-4 w-4" />}
                      Gerar e salvar link rastreável
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Salva o link e cria um <span className="text-primary">link curto</span> que conta cada clique. Cole o link curto na campanha.
                    </p>
                  </>
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    Preencha a URL base para ver a prévia
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* UTM breakdown — sempre visível */}
          {utmParamsString && (
            <Card className="glass-card border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resumo dos Parâmetros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {UTM_FIELDS.filter(f => (utmParams as any)[f.key]).map(field => (
                  <div key={field.key} className="flex items-center justify-between text-xs">
                    <span className={`font-mono ${field.color}`}>{field.key}</span>
                    <span className="text-muted-foreground font-mono truncate max-w-[200px]">
                      {(utmParams as any)[field.key]}
                    </span>
                  </div>
                ))}

                {/* Botão copiar params disponível em qualquer modo */}
                {mode === "url" && (
                  <div className="pt-2 border-t border-white/5">
                    <Button onClick={handleCopyParams} variant="outline" size="sm" className="w-full rounded-xl gap-2 text-xs border-white/10">
                      {copiedParams ? <Check className="h-3.5 w-3.5" /> : <Hash className="h-3.5 w-3.5" />}
                      {copiedParams ? "Copiado!" : "Copiar só os parâmetros UTM"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Links salvos / rastreados */}
      {selectedCompanyId && (
        <Card className="glass-card border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-primary" /> Links Rastreados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!savedLinks || savedLinks.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Nenhum link salvo ainda. Gere e salve um link acima para começar a rastrear.
              </div>
            ) : (
              <div className="space-y-2">
                {savedLinks.map((link: any) => {
                  const clicks = Number(link.clickCount ?? 0);
                  const conversions = Number(link.conversionCount ?? 0);
                  const tracked = clicks > 0;
                  return (
                    <div key={link.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white/90 truncate">{link.utmCampaign}</span>
                          {tracked ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1 text-[10px]">
                              <CheckCircle2 className="h-3 w-3" /> Rastreado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-white/15 text-muted-foreground text-[10px]">
                              Aguardando cliques
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-muted-foreground truncate">{shortLinkFor(link.shortCode)}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center">
                          <p className="text-sm font-bold text-white flex items-center gap-1">
                            <MousePointerClick className="h-3.5 w-3.5 text-primary" /> {clicks}
                          </p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">cliques</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-white flex items-center gap-1">
                            <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" /> {conversions}
                          </p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">vendas</p>
                        </div>
                        <Button onClick={() => copyShort(link)} size="sm" variant="outline" className="rounded-xl gap-1.5 border-white/10 text-xs">
                          {copiedShortId === link.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedShortId === link.id ? "Copiado" : "Copiar curto"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
