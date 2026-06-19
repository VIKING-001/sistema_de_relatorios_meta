import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  MessageCircle, Building2, Loader2, Settings2, Copy, Check,
  Megaphone, CheckCircle2, Phone, Users, Tag, ChevronDown,
} from "lucide-react";

const WEBHOOK_URL = "https://sistemaderelatoriosmeta.vercel.app/webhook/whatsapp";

function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
}

export default function Conversas() {
  const { data: companies, isLoading: loadingCompanies } = trpc.company.list.useQuery();
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const { data: convData, isLoading: loadingConvs } = trpc.whatsapp.listConversations.useQuery(
    { companyId: companyId ?? 0 },
    { enabled: !!companyId }
  );

  const conversations = convData?.conversations ?? [];
  const summary = convData?.summary ?? { total: 0, attributed: 0, converted: 0 };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" /> Conversas WhatsApp
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Conversas iniciadas pelos anúncios (Click-to-WhatsApp) com atribuição de campanha
          </p>
        </div>
        {companyId && (
          <Button variant="outline" onClick={() => setShowConfig((v) => !v)} className="rounded-xl gap-2 border-white/10">
            <Settings2 className="h-4 w-4" /> Configurar conexão
          </Button>
        )}
      </div>

      {/* Empresa */}
      <div className="glass-card rounded-xl p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 shrink-0">
          <Building2 className="h-3.5 w-3.5" /> Empresa
        </Label>
        <select
          value={companyId ?? ""}
          onChange={(e) => setCompanyId(e.target.value ? Number(e.target.value) : null)}
          disabled={loadingCompanies}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-primary/50"
        >
          <option value="" className="bg-zinc-900">Selecione a empresa…</option>
          {companies?.map((c: any) => (
            <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
          ))}
        </select>
      </div>

      {!companyId ? (
        <div className="text-center py-20 text-muted-foreground">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Selecione uma empresa para ver as conversas.</p>
        </div>
      ) : (
        <>
          {showConfig && <WhatsappConfig companyId={companyId} />}

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Conversas", value: String(summary.total), icon: Users, color: "text-white" },
              { label: "Via anúncio", value: String(summary.attributed), icon: Megaphone, color: "text-cyan-400" },
              { label: "Viraram venda", value: String(summary.converted), icon: CheckCircle2, color: "text-emerald-400" },
            ].map((c) => (
              <div key={c.label} className="glass-card rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <c.icon className={`h-3.5 w-3.5 ${c.color}`} />
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium">{c.label}</p>
                </div>
                <p className={`text-xl font-bold tabular-nums ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Lista */}
          <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-black/30 border-b border-white/8 text-[10px] text-white/25 uppercase tracking-widest font-bold">
              <div className="flex-1">Cliente</div>
              <div className="w-[180px]">Campanha de origem</div>
              <div className="w-[90px] text-center">Msgs</div>
              <div className="w-[130px] text-right">Última msg</div>
              <div className="w-[100px] text-center">Status</div>
            </div>

            {loadingConvs && (
              <div className="flex items-center gap-2 px-4 py-10 text-white/30 text-xs">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Carregando conversas...
              </div>
            )}
            {!loadingConvs && conversations.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-white/30">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>Nenhuma conversa ainda. Configure a conexão e rode anúncios Click-to-WhatsApp.</p>
              </div>
            )}
            {conversations.map((c: any) => (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 px-4 py-3 border-b border-white/8 last:border-0 hover:bg-white/[0.03] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-white/30 shrink-0" />
                    {c.customerName || c.waId}
                  </p>
                  {c.customerName && <p className="text-[11px] text-white/35 truncate pl-4.5">{c.waId}</p>}
                </div>
                <div className="w-full sm:w-[180px] min-w-0">
                  {c.campaignName
                    ? <span className="inline-flex items-center gap-1 text-[11px] text-cyan-300/90 truncate"><Megaphone className="h-3 w-3 shrink-0" />{c.campaignName}</span>
                    : <span className="inline-flex items-center gap-1 text-[11px] text-white/25"><Tag className="h-3 w-3 shrink-0" />orgânica</span>}
                </div>
                <div className="w-[90px] text-center text-[11px] text-white/40 tabular-nums">{c.messageCount}</div>
                <div className="w-[130px] text-right text-[11px] text-white/45 tabular-nums">{fmtDate(c.lastMessageAt)}</div>
                <div className="w-[100px] flex sm:justify-center">
                  {c.status === "converted"
                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border text-emerald-300 bg-emerald-400/10 border-emerald-400/25"><CheckCircle2 className="h-2.5 w-2.5" /> Vendeu</span>
                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border text-white/50 bg-white/5 border-white/15">Aberta</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Bloco de configuração da Cloud API ───────────────────────────────────────
function WhatsappConfig({ companyId }: { companyId: number }) {
  const { data: cfg, refetch } = trpc.whatsapp.getConfig.useQuery({ companyId });
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Pré-preenche com o que já está salvo (uma vez)
  if (cfg && !loaded) {
    setPhoneNumberId(cfg.phoneNumberId ?? "");
    setWabaId(cfg.wabaId ?? "");
    setDisplayPhone(cfg.displayPhone ?? "");
    setVerifyToken(cfg.verifyToken ?? "");
    setLoaded(true);
  }

  const save = trpc.whatsapp.saveConfig.useMutation({
    onSuccess: () => { toast.success("Conexão do WhatsApp salva!"); refetch(); },
    onError: (e) => toast.error(e.message || "Erro ao salvar"),
  });

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const submit = () => {
    if (!phoneNumberId.trim()) { toast.error("Informe o Phone Number ID."); return; }
    if (verifyToken.trim().length < 4) { toast.error("Crie um Verify Token (mín. 4 caracteres)."); return; }
    save.mutate({
      companyId,
      phoneNumberId: phoneNumberId.trim(),
      wabaId: wabaId.trim() || undefined,
      displayPhone: displayPhone.trim() || undefined,
      accessToken: accessToken.trim() || undefined,
      verifyToken: verifyToken.trim(),
    });
  };

  return (
    <div className="glass-card rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-cyan-400" />
        <h2 className="text-sm font-bold">Conexão WhatsApp Cloud API</h2>
        {cfg && <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-emerald-300"><CheckCircle2 className="h-3 w-3" /> Configurado</span>}
      </div>

      {/* Passo a passo da Meta */}
      <div className="rounded-lg bg-black/20 border border-white/8 p-3 text-[11px] text-white/50 space-y-1.5">
        <p className="text-white/70 font-semibold">No painel da Meta (developers.facebook.com → seu app → WhatsApp → Configuration):</p>
        <p>1. Em <b>Callback URL</b>, cole a URL abaixo. 2. Em <b>Verify token</b>, use o mesmo que você criar aqui. 3. Assine o campo <b>messages</b>.</p>
        <div className="flex items-center gap-2 mt-2">
          <code className="flex-1 truncate bg-black/40 rounded px-2 py-1 text-cyan-300/90">{WEBHOOK_URL}</code>
          <button onClick={() => copy(WEBHOOK_URL, "url")} className="text-white/50 hover:text-white shrink-0">
            {copied === "url" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Phone Number ID *</Label>
          <Input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="ex: 123456789012345"
            className="bg-white/5 border-white/10 rounded-xl font-mono text-sm" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">WABA ID (opcional)</Label>
          <Input value={wabaId} onChange={(e) => setWabaId(e.target.value)} placeholder="WhatsApp Business Account ID"
            className="bg-white/5 border-white/10 rounded-xl font-mono text-sm" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Número exibido (opcional)</Label>
          <Input value={displayPhone} onChange={(e) => setDisplayPhone(e.target.value)} placeholder="+55 62 9..."
            className="bg-white/5 border-white/10 rounded-xl text-sm" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Verify Token * (você inventa)</Label>
          <Input value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} placeholder="ex: meu-token-secreto-123"
            className="bg-white/5 border-white/10 rounded-xl font-mono text-sm" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">
            Access Token {cfg?.hasToken ? "(já salvo — preencha só para trocar)" : "(permanente, opcional p/ enviar respostas no futuro)"}
          </Label>
          <Input value={accessToken} onChange={(e) => setAccessToken(e.target.value)} type="password" placeholder="EAAG..."
            className="bg-white/5 border-white/10 rounded-xl font-mono text-sm" />
        </div>
      </div>

      <Button onClick={submit} disabled={save.isPending} className="rounded-xl gap-2">
        {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Salvar conexão
      </Button>
    </div>
  );
}
