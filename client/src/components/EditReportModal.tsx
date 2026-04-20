import { useState, useEffect, memo } from "react";
import { Report } from "@shared/types";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, X, Target, DollarSign, MessageCircle, ShoppingBag } from "lucide-react";
import { parseBrazilianNumber } from "@shared/numberParser";
import { formatLocalDate, parseLocalDate } from "@shared/dateParser";

// ─── Subcomponentes FORA do componente principal ───────────────────────────────
// IMPORTANTE: definir dentro do componente pai causa re-mount a cada render,
// fazendo o input perder o foco após cada tecla.

interface FieldProps {
  label: string;
  val: string;
  set: (v: string) => void;
  money?: boolean;
  disabled?: boolean;
}

const Field = memo(({ label, val, set, money = false, disabled = false }: FieldProps) => (
  <div>
    <label className="block text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
      {label}
    </label>
    <div className="relative">
      {money && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
          R$
        </span>
      )}
      <Input
        type="text"
        value={val}
        onChange={e => set(e.target.value)}
        disabled={disabled}
        className={`bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl ${money ? "pl-9" : ""}`}
      />
    </div>
  </div>
));
Field.displayName = "Field";

interface SectionProps {
  icon: React.ElementType;
  label: string;
  color?: string;
}

const Section = ({ icon: Icon, label, color = "text-primary" }: SectionProps) => (
  <div className={`flex items-center gap-2 ${color} mt-4 mb-3`}>
    <Icon className="h-3.5 w-3.5" />
    <h3 className="text-[10px] font-bold uppercase tracking-widest">{label}</h3>
  </div>
);

// ─── Componente principal ──────────────────────────────────────────────────────

interface EditReportModalProps {
  report: Report | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditReportModal({ report, onClose, onSuccess }: EditReportModalProps) {
  const { data: fullData, isLoading: loadingReport } = trpc.report.get.useQuery(
    { id: report?.id ?? 0 },
    { enabled: !!report?.id }
  );

  const fullReport = fullData?.report;
  const metrics   = fullData?.metrics;

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");

  // Performance
  const [instagramReach,              setInstagramReach]              = useState("0");
  const [totalReach,                  setTotalReach]                  = useState("0");
  const [totalImpressions,            setTotalImpressions]            = useState("0");
  const [instagramProfileVisits,      setInstagramProfileVisits]      = useState("0");
  const [newInstagramFollowers,       setNewInstagramFollowers]       = useState("0");
  const [profileVisitsThroughCamp,    setProfileVisitsThroughCamp]    = useState("0");

  // Investimento
  const [totalSpent,          setTotalSpent]          = useState("0");
  const [totalClicks,         setTotalClicks]          = useState("0");
  const [costPerClick,        setCostPerClick]         = useState("0");
  const [videoRetentionRate,  setVideoRetentionRate]   = useState("0");
  const [costPerProfileVisit, setCostPerProfileVisit]  = useState("0");

  // Mensagens
  const [messagesInitiated, setMessagesInitiated] = useState("0");
  const [costPerMessage,    setCostPerMessage]    = useState("0");

  // Conversões
  const [purchases,       setPurchases]       = useState("0");
  const [purchaseValue,   setPurchaseValue]   = useState("0");
  const [costPerPurchase, setCostPerPurchase] = useState("0");

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!fullReport) return;
    setTitle(fullReport.title || "");
    setDescription(fullReport.description || "");
    setStartDate(formatLocalDate(parseLocalDate(String(fullReport.startDate).split("T")[0])));
    setEndDate(formatLocalDate(parseLocalDate(String(fullReport.endDate).split("T")[0])));
  }, [fullReport]);

  useEffect(() => {
    if (!metrics) return;
    setInstagramReach(metrics.instagramReach?.toString() ?? "0");
    setTotalReach(metrics.totalReach?.toString() ?? "0");
    setTotalImpressions(metrics.totalImpressions?.toString() ?? "0");
    setInstagramProfileVisits(metrics.instagramProfileVisits?.toString() ?? "0");
    setNewInstagramFollowers(metrics.newInstagramFollowers?.toString() ?? "0");
    setProfileVisitsThroughCamp(metrics.profileVisitsThroughCampaigns?.toString() ?? "0");
    setTotalSpent(metrics.totalSpent?.toString() ?? "0");
    setTotalClicks(metrics.totalClicks?.toString() ?? "0");
    setCostPerClick(metrics.costPerClick?.toString() ?? "0");
    setVideoRetentionRate(metrics.videoRetentionRate?.toString() ?? "0");
    setCostPerProfileVisit(metrics.costPerProfileVisit?.toString() ?? "0");
    setMessagesInitiated(metrics.messagesInitiated?.toString() ?? "0");
    setCostPerMessage((metrics as any).costPerMessage?.toString() ?? "0");
    setPurchases((metrics as any).purchases?.toString() ?? "0");
    setPurchaseValue((metrics as any).purchaseValue?.toString() ?? "0");
    setCostPerPurchase((metrics as any).costPerPurchase?.toString() ?? "0");
  }, [metrics]);

  const updateMutation = trpc.report.update.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;
    if (!title.trim()) { toast.error("Título é obrigatório"); return; }
    if (!startDate || !endDate) { toast.error("Datas são obrigatórias"); return; }

    const start = parseLocalDate(startDate);
    const end   = parseLocalDate(endDate);
    if (start > end) { toast.error("Data de início não pode ser maior que data de fim"); return; }

    setIsLoading(true);
    try {
      await updateMutation.mutateAsync({
        id: report.id,
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: start,
        endDate:   end,
        metrics: {
          instagramReach:              Math.floor(parseBrazilianNumber(instagramReach))           || 0,
          totalReach:                  Math.floor(parseBrazilianNumber(totalReach))               || 0,
          totalImpressions:            Math.floor(parseBrazilianNumber(totalImpressions))         || 0,
          instagramProfileVisits:      Math.floor(parseBrazilianNumber(instagramProfileVisits))   || 0,
          newInstagramFollowers:       Math.floor(parseBrazilianNumber(newInstagramFollowers))    || 0,
          messagesInitiated:           Math.floor(parseBrazilianNumber(messagesInitiated))        || 0,
          totalSpent:                  parseBrazilianNumber(totalSpent)                           || 0,
          totalClicks:                 Math.floor(parseBrazilianNumber(totalClicks))              || 0,
          costPerClick:                parseBrazilianNumber(costPerClick)                         || 0,
          videoRetentionRate:          parseBrazilianNumber(videoRetentionRate)                   || 0,
          profileVisitsThroughCampaigns: Math.floor(parseBrazilianNumber(profileVisitsThroughCamp)) || 0,
          costPerProfileVisit:         parseBrazilianNumber(costPerProfileVisit)                  || 0,
          cpm:                         0,
          ctr:                         0,
          purchases:                   Math.floor(parseBrazilianNumber(purchases))                || 0,
          purchaseValue:               parseBrazilianNumber(purchaseValue)                        || 0,
          costPerPurchase:             parseBrazilianNumber(costPerPurchase)                      || 0,
          costPerMessage:              parseBrazilianNumber(costPerMessage)                       || 0,
        },
      });
      toast.success("Relatório atualizado com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Erro ao atualizar relatório");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!report) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-[#0d1422] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl my-6">

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-4 sm:px-5 py-4 border-b border-white/10 bg-[#0d1422]/95 backdrop-blur rounded-t-2xl z-10">
          <h2 className="text-base font-bold text-white">Editar Relatório</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loadingReport ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Carregando dados...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-1">

            {/* Informações básicas */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Informações Básicas
              </h3>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Título *
                </label>
                <Input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: MES 03 – Campanha de Verão"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Descrição
                </label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Opcional"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl resize-none"
                  rows={2}
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Início *
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="bg-white/5 border-white/10 text-white rounded-xl"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Fim *
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="bg-white/5 border-white/10 text-white rounded-xl"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Performance e Alcance */}
            <Section icon={Target} label="Performance e Alcance" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Alcance Instagram"   val={instagramReach}           set={setInstagramReach}           disabled={isLoading} />
              <Field label="Alcance Total"        val={totalReach}               set={setTotalReach}               disabled={isLoading} />
              <Field label="Impressões"           val={totalImpressions}         set={setTotalImpressions}         disabled={isLoading} />
              <Field label="Visitas Perfil IG"    val={instagramProfileVisits}   set={setInstagramProfileVisits}   disabled={isLoading} />
              <Field label="Novos Seguidores"     val={newInstagramFollowers}    set={setNewInstagramFollowers}    disabled={isLoading} />
              <Field label="Visitas via Camp."    val={profileVisitsThroughCamp} set={setProfileVisitsThroughCamp} disabled={isLoading} />
            </div>

            {/* Investimento */}
            <Section icon={DollarSign} label="Investimento e Cliques" color="text-yellow-400" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Total Gasto (R$)"    val={totalSpent}          set={setTotalSpent}          money disabled={isLoading} />
              <Field label="Cliques Totais"       val={totalClicks}         set={setTotalClicks}         disabled={isLoading} />
              <Field label="CPC (R$)"             val={costPerClick}        set={setCostPerClick}        money disabled={isLoading} />
              <Field label="Retenção Vídeo %"     val={videoRetentionRate}  set={setVideoRetentionRate}  disabled={isLoading} />
              <Field label="Custo/Visita (R$)"    val={costPerProfileVisit} set={setCostPerProfileVisit} money disabled={isLoading} />
            </div>

            {/* Mensagens */}
            <Section icon={MessageCircle} label="Mensagens" color="text-cyan-400" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mensagens Iniciadas"      val={messagesInitiated} set={setMessagesInitiated} disabled={isLoading} />
              <Field label="Custo por Mensagem (R$)"  val={costPerMessage}    set={setCostPerMessage}    money disabled={isLoading} />
            </div>

            {/* Compras / Conversões */}
            <Section icon={ShoppingBag} label="Conversões e Compras" color="text-emerald-400" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nº de Compras"          val={purchases}       set={setPurchases}       disabled={isLoading} />
              <Field label="Valor Faturado (R$)"    val={purchaseValue}   set={setPurchaseValue}   money disabled={isLoading} />
              <Field label="Custo por Compra (R$)"  val={costPerPurchase} set={setCostPerPurchase} money disabled={isLoading} />
            </div>

            {/* Botões */}
            <div className="flex gap-3 justify-end pt-5 mt-4 border-t border-white/10">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                disabled={isLoading}
                className="border-white/20 text-white hover:bg-white/10 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold px-6"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
