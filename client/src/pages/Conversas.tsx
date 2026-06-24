import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  MessageCircle, Building2, Loader2, Settings2, Copy, Check,
  Megaphone, CheckCircle2, Phone, Users, Tag, Zap, ArrowLeft, Clock, LogOut,
} from "lucide-react";
import { launchWhatsappEmbeddedSignup, WHATSAPP_CONFIG_ID } from "@/lib/facebookSdk";

const WEBHOOK_URL = "https://sistemaderelatoriosmeta.vercel.app/webhook/whatsapp";

function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
}

function fmtTime(d: string) {
  return d ? new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
}

function fmtDay(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  const today = new Date();
  const isToday = dt.toDateString() === today.toDateString();
  if (isToday) return "Hoje";
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function Conversas() {
  const { data: companies, isLoading: loadingCompanies } = trpc.company.list.useQuery();
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);

  const { data: convData, isLoading: loadingConvs } = trpc.whatsapp.listConversations.useQuery(
    { companyId: companyId ?? 0 },
    { enabled: !!companyId }
  );
  const { data: waConfig } = trpc.whatsapp.getConfig.useQuery(
    { companyId: companyId ?? 0 },
    { enabled: !!companyId }
  );
  const { data: msgData, isLoading: loadingMsgs } = trpc.whatsapp.listMessages.useQuery(
    { companyId: companyId ?? 0, waId: selectedConv?.waId ?? "" },
    { enabled: !!companyId && !!selectedConv, refetchInterval: 5000 }
  );

  const conversations = convData?.conversations ?? [];
  const summary = convData?.summary ?? { total: 0, attributed: 0, converted: 0 };
  const messages = msgData?.messages ?? [];

  // Agrupa mensagens por dia para separadores visuais
  const msgsByDay: { day: string; msgs: any[] }[] = [];
  for (const m of messages) {
    const day = fmtDay(m.timestamp);
    if (!msgsByDay.length || msgsByDay[msgsByDay.length - 1].day !== day) {
      msgsByDay.push({ day, msgs: [m] });
    } else {
      msgsByDay[msgsByDay.length - 1].msgs.push(m);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 flex-wrap">
            {selectedConv ? (
              <button onClick={() => setSelectedConv(null)} className="flex items-center gap-2 hover:text-white/70 transition-colors">
                <ArrowLeft className="h-5 w-5" />
                {selectedConv.customerName || selectedConv.waId}
              </button>
            ) : (
              <>
                <MessageCircle className="h-6 w-6 text-primary" /> Conversas WhatsApp
                {companyId && waConfig && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border text-emerald-300 bg-emerald-400/10 border-emerald-400/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> WhatsApp Conectado
                  </span>
                )}
              </>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {selectedConv
              ? `${selectedConv.waId}${selectedConv.campaignName ? " · via " + selectedConv.campaignName : " · orgânica"}`
              : "Conversas iniciadas pelos anúncios (Click-to-WhatsApp) com atribuição de campanha"}
          </p>
        </div>
        {companyId && !selectedConv && (
          <Button variant="outline" onClick={() => setShowConfig((v) => !v)} className="rounded-xl gap-2 border-white/10">
            <Settings2 className="h-4 w-4" /> Configurar conexão
          </Button>
        )}
      </div>

      {/* Empresa */}
      {!selectedConv && (
        <div className="glass-card rounded-xl p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <Building2 className="h-3.5 w-3.5" /> Empresa
          </Label>
          <select
            value={companyId ?? ""}
            onChange={(e) => { setCompanyId(e.target.value ? Number(e.target.value) : null); setSelectedConv(null); }}
            disabled={loadingCompanies}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-primary/50"
          >
            <option value="" className="bg-zinc-900">Selecione a empresa…</option>
            {companies?.map((c: any) => (
              <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {!companyId ? (
        <div className="text-center py-20 text-muted-foreground">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Selecione uma empresa para ver as conversas.</p>
        </div>
      ) : selectedConv ? (
        /* ── Painel de mensagens ── */
        <div className="glass-card rounded-xl border border-white/10 flex flex-col" style={{ minHeight: "60vh" }}>
          {/* Info da conversa */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/20">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white/90">{selectedConv.customerName || selectedConv.waId}</p>
              {selectedConv.customerName && <p className="text-[11px] text-white/40">{selectedConv.waId}</p>}
            </div>
            <div className="text-right">
              {selectedConv.campaignName
                ? <span className="inline-flex items-center gap-1 text-[11px] text-cyan-300/80"><Megaphone className="h-3 w-3" />{selectedConv.campaignName}</span>
                : <span className="inline-flex items-center gap-1 text-[11px] text-white/30"><Tag className="h-3 w-3" />orgânica</span>}
              <p className="text-[10px] text-white/25 mt-0.5">{selectedConv.messageCount} msg(s)</p>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1" style={{ maxHeight: "65vh" }}>
            {loadingMsgs && (
              <div className="flex items-center justify-center py-10 text-white/30 text-xs gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Carregando mensagens…
              </div>
            )}
            {!loadingMsgs && messages.length === 0 && (
              <div className="text-center py-12 text-white/30 text-sm space-y-2">
                <MessageCircle className="h-8 w-8 mx-auto opacity-20" />
                <p>Nenhuma mensagem registrada ainda.</p>
                <p className="text-[11px] text-white/20">As próximas mensagens recebidas aparecerão aqui automaticamente.</p>
              </div>
            )}
            {msgsByDay.map(({ day, msgs }) => (
              <div key={day}>
                {/* Separador de dia */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-[10px] text-white/25 px-2">{day}</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>
                <div className="space-y-2">
                  {msgs.map((m: any) => (
                    <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        m.direction === "outbound"
                          ? "bg-primary/70 text-white rounded-br-sm"
                          : "bg-white/8 text-white/90 rounded-bl-sm"
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <p className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${
                          m.direction === "outbound" ? "text-white/50" : "text-white/30"
                        }`}>
                          <Clock className="h-2.5 w-2.5" />
                          {fmtTime(m.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Rodapé */}
          <div className="px-4 py-2.5 border-t border-white/8 bg-black/20">
            <p className="text-[11px] text-white/25 text-center">
              Visualização somente leitura · Responda pelo WhatsApp Business
            </p>
          </div>
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

          {/* Lista de conversas — clicável */}
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
              <button
                key={c.id}
                onClick={() => setSelectedConv(c)}
                className="w-full text-left flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 px-4 py-3 border-b border-white/8 last:border-0 hover:bg-white/[0.06] active:bg-white/10 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-white/30 shrink-0" />
                    {c.customerName || c.waId}
                  </p>
                  {c.customerName && <p className="text-[11px] text-white/35 truncate pl-[18px]">{c.waId}</p>}
                  {c.lastMessageText && (
                    <p className="text-[11px] text-white/30 truncate pl-[18px] mt-0.5 italic">{c.lastMessageText}</p>
                  )}
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
              </button>
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

  const [connecting, setConnecting] = useState(false);
  const finishSignup = trpc.whatsapp.finishEmbeddedSignup.useMutation({
    onSuccess: () => { toast.success("WhatsApp conectado com sucesso!"); refetch(); },
    onError: (e) => toast.error(e.message || "Erro ao finalizar conexão"),
  });

  const disconnectWA = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => {
      toast.success("WhatsApp desconectado.");
      setLoaded(false);
      setPhoneNumberId(""); setWabaId(""); setDisplayPhone(""); setAccessToken(""); setVerifyToken("");
      refetch();
    },
    onError: (e) => toast.error(e.message || "Erro ao desconectar"),
  });
  const handleDisconnect = () => {
    if (!confirm("Desconectar o WhatsApp desta empresa? As conversas salvas não serão apagadas.")) return;
    disconnectWA.mutate({ companyId });
  };

  const connectOneClick = async () => {
    setConnecting(true);
    try {
      const r = await launchWhatsappEmbeddedSignup();
      if (!r.phoneNumberId || !r.wabaId) {
        toast.error("A Meta não retornou o número/WABA. Tente novamente ou use o modo manual.");
        return;
      }
      await finishSignup.mutateAsync({
        companyId,
        code: r.code,
        phoneNumberId: r.phoneNumberId,
        wabaId: r.wabaId,
      });
    } catch (e: any) {
      if (e?.message && !/cancel/i.test(e.message)) toast.error(e.message);
    } finally {
      setConnecting(false);
    }
  };
  const [showManual, setShowManual] = useState(false);

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
        <h2 className="text-sm font-bold">Conexão WhatsApp</h2>
        {cfg && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> {cfg.displayPhone || "Conectado"}
          </span>
        )}
        {cfg && (
          <button
            onClick={handleDisconnect}
            disabled={disconnectWA.isPending}
            className="ml-2 inline-flex items-center gap-1 text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
            title="Desconectar WhatsApp"
          >
            {disconnectWA.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
            Desconectar
          </button>
        )}
      </div>

      {WHATSAPP_CONFIG_ID ? (
        <div className="rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white/90">Conectar com 1 clique</p>
              <p className="text-[11px] text-white/50">Login oficial da Meta — descobre o número e configura tudo sozinho.</p>
            </div>
          </div>
          <Button onClick={connectOneClick} disabled={connecting || finishSignup.isPending}
            className="w-full rounded-xl gap-2 bg-[#1877F2] hover:bg-[#1466d8] text-white">
            {connecting || finishSignup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            {cfg ? "Reconectar WhatsApp" : "Conectar WhatsApp"}
          </Button>
          <button onClick={() => setShowManual((v) => !v)} className="text-[11px] text-white/40 hover:text-white/70 underline w-full text-center">
            {showManual ? "Esconder conexão manual" : "Prefiro conectar manualmente"}
          </button>
        </div>
      ) : (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-[11px] text-amber-300/80">
          Conexão 1 clique indisponível (falta configurar o Embedded Signup na Meta). Use o modo manual abaixo.
        </div>
      )}

      {(!WHATSAPP_CONFIG_ID || showManual) && (
      <>
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
      </>
      )}
    </div>
  );
}
