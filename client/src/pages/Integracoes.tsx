import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, CheckCircle2, AlertCircle, Zap, ExternalLink, RefreshCw, Plus, Copy, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

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
];

const WEBHOOK_PLATFORMS = [
  // Plataformas principais
  { id: "shopify", name: "Shopify", icon: "🛍️" },
  { id: "woocommerce", name: "WooCommerce", icon: "🔧" },
  { id: "zapier", name: "Zapier", icon: "⚡" },

  // Plataformas de infoproduto
  { id: "hotmart", name: "Hotmart", icon: "🔥" },
  { id: "kiwify", name: "Kiwify", icon: "🥝" },
  { id: "eduzz", name: "Eduzz", icon: "📚" },
  { id: "braip", name: "Braip", icon: "🧠" },
  { id: "monetizze", name: "Monetizze", icon: "💰" },

  // Outras plataformas de vendas
  { id: "cartpanda", name: "CartPanda", icon: "🐼" },
  { id: "vega1", name: "Vega 1", icon: "✨" },
  { id: "kirvano", name: "Kirvano", icon: "🎯" },
  { id: "perfectpay", name: "PerfectPay", icon: "✅" },
  { id: "yampi", name: "Yampi", icon: "🎨" },
  { id: "lastlink", name: "Lastlink", icon: "🔗" },
  { id: "payt", name: "Payt", icon: "💳" },
  { id: "logzz", name: "Logzz", icon: "📊" },
  { id: "adoorel", name: "Adoorel", icon: "🎁" },
  { id: "tribopay", name: "TriboPay", icon: "🔔" },
  { id: "clickbank", name: "Clickbank", icon: "💸" },
  { id: "ticto", name: "Ticto", icon: "⏱️" },
  { id: "pepper", name: "Pepper", icon: "🌶️" },
  { id: "buygoods", name: "BuyGoods", icon: "🛒" },
  { id: "mundpay", name: "MundPay", icon: "🌎" },
  { id: "disrupty", name: "Disrupty", icon: "⚡" },
  { id: "greenn", name: "Greenn", icon: "💚" },
  { id: "guru", name: "Guru", icon: "🧘" },
  { id: "digistore", name: "Digistore24", icon: "🏪" },
  { id: "hubla", name: "Hubla", icon: "🌐" },
  { id: "doppus", name: "Doppus", icon: "🚀" },
  { id: "frendz", name: "Frendz", icon: "👥" },
  { id: "invictuspay", name: "InvictusPay", icon: "🎖️" },
  { id: "appmax", name: "Appmax", icon: "📱" },
  { id: "nitropagamentos", name: "Nitro Pagamentos", icon: "💨" },
  { id: "goatpay", name: "GoatPay", icon: "🐐" },

  // Genérico por último
  { id: "custom", name: "Customizado/Genérico", icon: "⚙️" },
] as const;

export default function Integracoes() {
  const { data: companies } = trpc.company.list.useQuery();
  const [, setLocation] = useLocation();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("shopify");
  const [showAddWebhook, setShowAddWebhook] = useState(false);

  // Webhooks
  const { data: webhooks, refetch: refetchWebhooks, isLoading: webhooksLoading } =
    trpc.webhook.list.useQuery({ companyId: selectedCompanyId ?? 0 }, { enabled: !!selectedCompanyId });

  const createWebhookMut = trpc.webhook.create.useMutation({
    onSuccess: () => {
      refetchWebhooks();
      setShowAddWebhook(false);
      toast.success("Webhook criado com sucesso!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar webhook");
    },
  });

  const deleteWebhookMut = trpc.webhook.delete.useMutation({
    onSuccess: () => {
      refetchWebhooks();
      toast.success("Webhook deletado!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao deletar webhook");
    },
  });

  const updateStatusMut = trpc.webhook.updateStatus.useMutation({
    onSuccess: () => {
      refetchWebhooks();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atualizar status");
    },
  });

  const connectedMeta = companies?.filter((c: any) => c.metaAccessToken).length ?? 0;
  const totalCompanies = companies?.length ?? 0;

  const categories = [...new Set(INTEGRATIONS.map(i => i.category))];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const handleCreateWebhook = () => {
    if (!selectedCompanyId) {
      toast.error("Selecione uma empresa");
      return;
    }
    createWebhookMut.mutate({
      companyId: selectedCompanyId,
      platform: selectedPlatform as any,
    });
  };

  const handleToggleWebhook = (webhook: any) => {
    updateStatusMut.mutate({
      webhookId: webhook.id,
      status: webhook.status === "active" ? "inactive" : "active",
    });
  };

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

      {/* Webhooks Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">🪝 Webhooks</h2>
          <Button
            size="sm"
            className="rounded-lg text-xs h-7 gap-1"
            onClick={() => setShowAddWebhook(!showAddWebhook)}
          >
            <Plus className="h-3 w-3" /> Adicionar Webhook
          </Button>
        </div>

        {/* Company Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/60">Selecione a Empresa</label>
          <select
            value={selectedCompanyId || ""}
            onChange={(e) => setSelectedCompanyId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-500/50"
          >
            <option value="">Escolha uma empresa...</option>
            {companies?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Webhook Form */}
        {showAddWebhook && selectedCompanyId && (
          <Card className="border-purple-500/30 bg-purple-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">⚙️ Novo Webhook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60">Plataforma</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-500/50"
                >
                  {WEBHOOK_PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="rounded-lg flex-1"
                  onClick={handleCreateWebhook}
                  disabled={createWebhookMut.isPending}
                >
                  {createWebhookMut.isPending ? "Criando..." : "Criar Webhook"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg flex-1"
                  onClick={() => setShowAddWebhook(false)}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Webhooks List */}
        {selectedCompanyId && (
          <div className="space-y-2">
            {webhooksLoading ? (
              <div className="text-xs text-muted-foreground text-center py-4">Carregando webhooks...</div>
            ) : webhooks && webhooks.length > 0 ? (
              webhooks.map((webhook: any) => (
                <Card
                  key={webhook.id}
                  className={`glass-card border-white/10 transition-all ${
                    webhook.status === "active" ? "border-emerald-400/30 bg-emerald-400/5" : "opacity-60"
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {WEBHOOK_PLATFORMS.find((p) => p.id === webhook.platform)?.icon}
                          </span>
                          <p className="font-semibold text-sm">
                            {WEBHOOK_PLATFORMS.find((p) => p.id === webhook.platform)?.name}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[9px] h-4 ${
                              webhook.status === "active"
                                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                                : "border-amber-400/30 bg-amber-400/10 text-amber-400"
                            }`}
                          >
                            {webhook.status === "active" ? "Ativo" : "Desativado"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 break-all">{webhook.webhookUrl}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant={webhook.status === "active" ? "outline" : "default"}
                        className="rounded-lg text-xs h-7 gap-1"
                        onClick={() => handleToggleWebhook(webhook)}
                        disabled={updateStatusMut.isPending}
                      >
                        {webhook.status === "active" ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-xs h-7 gap-1"
                        onClick={() => copyToClipboard(webhook.webhookUrl)}
                      >
                        <Copy className="h-3 w-3" /> Copiar URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-xs h-7 gap-1 text-red-400 border-red-400/30 hover:border-red-400/50"
                        onClick={() => deleteWebhookMut.mutate({ webhookId: webhook.id })}
                        disabled={deleteWebhookMut.isPending}
                      >
                        <Trash2 className="h-3 w-3" /> Deletar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                Nenhum webhook configurado. Clique em "Adicionar Webhook" para começar.
              </div>
            )}
          </div>
        )}

        {/* Documentation */}
        {selectedCompanyId && (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-3">
              <p className="text-xs text-white/70">
                <strong>📖 Como configurar:</strong>
              </p>
              <ul className="text-xs text-white/60 mt-2 space-y-1 ml-2">
                <li>✓ Copie a URL do webhook acima</li>
                <li>✓ Vá para configurações da sua plataforma (Shopify, WooCommerce, etc)</li>
                <li>✓ Cole a URL na seção de Webhooks/Notificações</li>
                <li>✓ Configure o evento: "Pedido Criado" ou "Venda Concluída"</li>
                <li>✓ Teste com uma venda de teste</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
