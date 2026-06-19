import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ShoppingCart, Building2, Plus, Loader2, DollarSign, TrendingUp,
  Hash, CalendarDays, X, Phone, Tag, Webhook, MousePointerClick,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────
const DATE_PRESETS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
  { label: "Tudo", days: 0 },
];

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function rangeFor(days: number) {
  if (days === 0) return { since: undefined as string | undefined, until: undefined as string | undefined };
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { since: localDateStr(start), until: localDateStr(end) };
}
function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function sourceBadge(source: string) {
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    manual:      { label: "Manual",     cls: "text-cyan-300 bg-cyan-400/10 border-cyan-400/25",       Icon: Phone },
    shopify:     { label: "Shopify",    cls: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25", Icon: Webhook },
    woocommerce: { label: "WooCommerce",cls: "text-violet-300 bg-violet-400/10 border-violet-400/25",  Icon: Webhook },
    custom:      { label: "Webhook",    cls: "text-blue-300 bg-blue-400/10 border-blue-400/25",        Icon: Webhook },
  };
  const cfg = map[source] || { label: source || "—", cls: "text-white/50 bg-white/5 border-white/15", Icon: Tag };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.cls}`}>
      <cfg.Icon className="h-2.5 w-2.5" /> {cfg.label}
    </span>
  );
}

// ─── Página ─────────────────────────────────────────────────────────────────
export default function Vendas() {
  const { data: companies, isLoading: loadingCompanies } = trpc.company.list.useQuery();
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [preset, setPreset] = useState(DATE_PRESETS[1]);
  const [showForm, setShowForm] = useState(false);

  const range = useMemo(() => rangeFor(preset.days), [preset]);

  const { data: salesData, isLoading: loadingSales, refetch } = trpc.utm.listSales.useQuery(
    { companyId: companyId ?? 0, startDate: range.since, endDate: range.until },
    { enabled: !!companyId }
  );
  const { data: roasData } = trpc.utm.getRoasComparison.useQuery(
    { companyId: companyId ?? 0 },
    { enabled: !!companyId }
  );

  const sales = salesData?.sales ?? [];
  const totalRevenue = salesData?.totalRevenue ?? 0;
  const totalCount = salesData?.totalCount ?? 0;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" /> Vendas
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Vendas rastreadas (webhook) e registradas manualmente (WhatsApp/Direct)
          </p>
        </div>
        {companyId && (
          <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2">
            <Plus className="h-4 w-4" /> Registrar venda
          </Button>
        )}
      </div>

      {/* Seleção de empresa + período */}
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
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-white/30 shrink-0" />
          {DATE_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPreset(p)}
              className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all ${
                preset.label === p.label
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!companyId ? (
        <div className="text-center py-20 text-muted-foreground">
          <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Selecione uma empresa para ver as vendas.</p>
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Receita rastreada", value: fmtBRL(totalRevenue), icon: DollarSign, color: "text-emerald-400" },
              { label: "Nº de vendas", value: String(totalCount), icon: Hash, color: "text-white" },
              { label: "ROAS consolidado", value: roasData ? `${roasData.roasFromUTM.toFixed(2)}x` : "—", icon: TrendingUp, color: "text-primary" },
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
          {roasData && (
            <p className="text-[11px] text-white/30 -mt-2">
              ROAS consolidado = receita rastreada ({fmtBRL(roasData.utmRevenue)}) ÷ gasto Meta dos relatórios ({fmtBRL(roasData.metaSpent)}).
            </p>
          )}

          {/* Lista de vendas */}
          <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-black/30 border-b border-white/8 text-[10px] text-white/25 uppercase tracking-widest font-bold">
              <div className="flex-1">Pedido / Cliente</div>
              <div className="w-[140px]">Campanha</div>
              <div className="w-[110px]">Origem</div>
              <div className="w-[120px] text-right">Data</div>
              <div className="w-[110px] text-right">Valor</div>
            </div>

            {loadingSales && (
              <div className="flex items-center gap-2 px-4 py-10 text-white/30 text-xs">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Carregando vendas...
              </div>
            )}
            {!loadingSales && sales.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-white/30">
                <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>Nenhuma venda no período. Registre uma venda manual ou conecte um webhook.</p>
              </div>
            )}
            {sales.map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 px-4 py-3 border-b border-white/8 last:border-0 hover:bg-white/[0.03] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate">
                    {s.customerName || s.orderId}
                  </p>
                  <p className="text-[11px] text-white/40 truncate">
                    {[s.customerName ? s.orderId : null, s.customerPhone].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="w-[140px] min-w-0">
                  {s.utmCampaign
                    ? <span className="inline-flex items-center gap-1 text-[11px] text-cyan-300/90 truncate"><MousePointerClick className="h-3 w-3 shrink-0" />{s.utmCampaign}</span>
                    : <span className="text-[11px] text-white/20">sem campanha</span>}
                </div>
                <div className="w-[110px]">{sourceBadge(s.source)}</div>
                <div className="w-[120px] text-right text-[11px] text-white/50 tabular-nums">
                  {s.saleDate ? new Date(s.saleDate).toLocaleDateString("pt-BR") : "—"}
                </div>
                <div className="w-[110px] text-right text-sm font-bold text-emerald-400 tabular-nums">
                  {fmtBRL(parseFloat(s.orderValue))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal: registrar venda manual */}
      {showForm && companyId && (
        <ManualSaleForm
          companyId={companyId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refetch(); }}
        />
      )}
    </div>
  );
}

// ─── Formulário de venda manual ───────────────────────────────────────────────
const MANUAL_CAMPAIGN = "__manual__";

function ManualSaleForm({ companyId, onClose, onSaved }: { companyId: number; onClose: () => void; onSaved: () => void }) {
  const [orderValue, setOrderValue] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saleDate, setSaleDate] = useState(localDateStr(new Date()));
  // Campanha: escolhe da lista real OU digita manualmente
  const [campaignChoice, setCampaignChoice] = useState<string>("");   // "" = sem campanha
  const [campaignManual, setCampaignManual] = useState("");

  // Campanhas reais da empresa (sincronizadas do Meta) — garante o nome exato p/ casar ROAS
  const { data: campaigns } = trpc.campaigns.list.useQuery(
    { companyId },
    { enabled: !!companyId }
  );

  const mut = trpc.utm.recordManualSale.useMutation({
    onSuccess: (res) => {
      toast.success(res.trackingFound ? "Venda registrada e vinculada à campanha!" : "Venda registrada!");
      onSaved();
    },
    onError: (e) => toast.error(e.message || "Erro ao registrar venda"),
  });

  const submit = () => {
    const val = parseFloat(orderValue.replace(",", "."));
    if (!val || val <= 0) { toast.error("Informe um valor de venda válido."); return; }
    const utmCampaign =
      campaignChoice === MANUAL_CAMPAIGN
        ? campaignManual.trim()
        : campaignChoice.trim();
    mut.mutate({
      companyId,
      orderValue: val,
      utmCampaign: utmCampaign || undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      saleDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-card border border-white/15 rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Registrar venda</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-xs text-muted-foreground">
          Use para vendas fechadas no WhatsApp/Direct. Escolha a campanha para a venda somar no ROAS real daquela campanha e no relatório.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Valor da venda (R$) *</Label>
            <Input value={orderValue} onChange={(e) => setOrderValue(e.target.value)} placeholder="199,90"
              className="bg-white/5 border-white/10 rounded-xl" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Data</Label>
            <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)}
              className="bg-white/5 border-white/10 rounded-xl" />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Nome do cliente (opcional)</Label>
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="ex: Maria Silva"
            className="bg-white/5 border-white/10 rounded-xl" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Telefone / WhatsApp (opcional)</Label>
          <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="(11) 9..."
            className="bg-white/5 border-white/10 rounded-xl" />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Campanha (para casar o ROAS)</Label>
          <select
            value={campaignChoice}
            onChange={(e) => setCampaignChoice(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-primary/50"
          >
            <option value="" className="bg-zinc-900">Sem campanha</option>
            {(campaigns ?? []).map((c: any) => (
              <option key={c.id} value={c.name} className="bg-zinc-900">{c.name}</option>
            ))}
            <option value={MANUAL_CAMPAIGN} className="bg-zinc-900">✏️ Digitar nome da campanha…</option>
          </select>
          {campaignChoice === MANUAL_CAMPAIGN && (
            <Input
              value={campaignManual}
              onChange={(e) => setCampaignManual(e.target.value)}
              placeholder="Nome EXATO da campanha no Meta"
              className="bg-white/5 border-white/10 rounded-xl font-mono text-sm mt-2"
            />
          )}
          {(campaigns?.length ?? 0) === 0 && (
            <p className="text-[10px] text-amber-400/70 mt-1.5">
              Nenhuma campanha sincronizada. Use "Digitar nome da campanha" com o nome exato do Meta.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-white/10">Cancelar</Button>
          <Button onClick={submit} disabled={mut.isPending} className="flex-[2] rounded-xl gap-2">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Registrar venda
          </Button>
        </div>
      </div>
    </div>
  );
}
