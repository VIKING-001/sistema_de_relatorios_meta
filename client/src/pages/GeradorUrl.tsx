import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Check, Link2, Zap, Hash } from "lucide-react";

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gerador de URL</h1>
        <p className="text-sm text-muted-foreground mt-1">Crie parâmetros UTM para rastrear suas campanhas</p>
      </div>

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
                    <Button onClick={handleCopyUrl} className="w-full rounded-xl gap-2">
                      {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedUrl ? "Copiado!" : "Copiar URL Completa"}
                    </Button>
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
    </div>
  );
}
