import { useState, useEffect, useRef, memo } from "react";
import { Report } from "@shared/types";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, X, Target, DollarSign, MessageCircle, ShoppingBag } from "lucide-react";
import { parseBrazilianNumber } from "@shared/numberParser";
import { formatLocalDate, parseLocalDate } from "@shared/dateParser";

interface ReportEditDraft {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  instagramReach: string;
  totalReach: string;
  totalImpressions: string;
  instagramProfileVisits: string;
  newInstagramFollowers: string;
  profileVisitsThroughCamp: string;
  totalSpent: string;
  totalClicks: string;
  costPerClick: string;
  videoRetentionRate: string;
  costPerProfileVisit: string;
  messagesInitiated: string;
  costPerMessage: string;
  purchases: string;
  sitePurchases: string;
  whatsappPurchases: string;
  purchaseValue: string;
  costPerPurchase: string;
}

// ─── Subcomponentes FORA do componente principal ───────────────────────────────
// IMPORTANTE: definir dentro do componente pai causa re-mount a cada render,
// fazendo o input perder o foco após cada tecla.

interface FieldProps {
  label: string;
  val: string;
  set: (v: string) => void;
  money?: boolean;
  numeric?: boolean;
  disabled?: boolean;
}

const Field = memo(({ label, val, set, money = false, numeric = false, disabled = false }: FieldProps) => (
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
        type={numeric ? "number" : "text"}
        min={numeric ? "0" : undefined}
        step={numeric ? "1" : undefined}
        placeholder={numeric ? "Não informado" : undefined}
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
  const editDraftQuery = trpc.report.getEditDraft.useQuery(
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
  const [sitePurchases,   setSitePurchases]   = useState("");
  const [whatsappPurchases, setWhatsappPurchases] = useState("");
  const [purchaseValue,   setPurchaseValue]   = useState("0");
  const [costPerPurchase, setCostPerPurchase] = useState("0");

  const [isLoading, setIsLoading] = useState(false);
  const [draftReadyForId, setDraftReadyForId] = useState<number | null>(null);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastSavedDraftRef = useRef("");

  const draftMutation = trpc.report.saveEditDraft.useMutation();
  const trpcUtils = trpc.useUtils();

  const draftSnapshot: ReportEditDraft = {
    title, description, startDate, endDate,
    instagramReach, totalReach, totalImpressions, instagramProfileVisits,
    newInstagramFollowers, profileVisitsThroughCamp,
    totalSpent, totalClicks, costPerClick, videoRetentionRate, costPerProfileVisit,
    messagesInitiated, costPerMessage, purchases, sitePurchases, whatsappPurchases,
    purchaseValue, costPerPurchase,
  };
  const draftSnapshotJson = JSON.stringify(draftSnapshot);

  useEffect(() => {
    const reportId = report?.id;
    if (!reportId || !fullReport || fullReport.id !== reportId || loadingReport || !editDraftQuery.isFetched || editDraftQuery.isError) return;
    if (draftReadyForId === reportId) return;

    const savedDraft = editDraftQuery.data?.draft as ReportEditDraft | null | undefined;
    const initialDraft: ReportEditDraft = savedDraft ?? {
      title: fullReport.title || "",
      description: fullReport.description || "",
      startDate: formatLocalDate(parseLocalDate(String(fullReport.startDate).split("T")[0])),
      endDate: formatLocalDate(parseLocalDate(String(fullReport.endDate).split("T")[0])),
      instagramReach: metrics?.instagramReach?.toString() ?? "0",
      totalReach: metrics?.totalReach?.toString() ?? "0",
      totalImpressions: metrics?.totalImpressions?.toString() ?? "0",
      instagramProfileVisits: metrics?.instagramProfileVisits?.toString() ?? "0",
      newInstagramFollowers: metrics?.newInstagramFollowers?.toString() ?? "0",
      profileVisitsThroughCamp: metrics?.profileVisitsThroughCampaigns?.toString() ?? "0",
      totalSpent: metrics?.totalSpent?.toString() ?? "0",
      totalClicks: metrics?.totalClicks?.toString() ?? "0",
      costPerClick: metrics?.costPerClick?.toString() ?? "0",
      videoRetentionRate: metrics?.videoRetentionRate?.toString() ?? "0",
      costPerProfileVisit: metrics?.costPerProfileVisit?.toString() ?? "0",
      messagesInitiated: metrics?.messagesInitiated?.toString() ?? "0",
      costPerMessage: (metrics as any)?.costPerMessage?.toString() ?? "0",
      purchases: (metrics as any)?.purchases?.toString() ?? "0",
      sitePurchases: (metrics as any)?.sitePurchases?.toString() ?? "",
      whatsappPurchases: (metrics as any)?.whatsappPurchases?.toString() ?? "",
      purchaseValue: (metrics as any)?.purchaseValue?.toString() ?? "0",
      costPerPurchase: (metrics as any)?.costPerPurchase?.toString() ?? "0",
    };

    setTitle(initialDraft.title);
    setDescription(initialDraft.description);
    setStartDate(initialDraft.startDate);
    setEndDate(initialDraft.endDate);
    setInstagramReach(initialDraft.instagramReach);
    setTotalReach(initialDraft.totalReach);
    setTotalImpressions(initialDraft.totalImpressions);
    setInstagramProfileVisits(initialDraft.instagramProfileVisits);
    setNewInstagramFollowers(initialDraft.newInstagramFollowers);
    setProfileVisitsThroughCamp(initialDraft.profileVisitsThroughCamp);
    setTotalSpent(initialDraft.totalSpent);
    setTotalClicks(initialDraft.totalClicks);
    setCostPerClick(initialDraft.costPerClick);
    setVideoRetentionRate(initialDraft.videoRetentionRate);
    setCostPerProfileVisit(initialDraft.costPerProfileVisit);
    setMessagesInitiated(initialDraft.messagesInitiated);
    setCostPerMessage(initialDraft.costPerMessage);
    setPurchases(initialDraft.purchases);
    setSitePurchases(initialDraft.sitePurchases);
    setWhatsappPurchases(initialDraft.whatsappPurchases);
    setPurchaseValue(initialDraft.purchaseValue);
    setCostPerPurchase(initialDraft.costPerPurchase);
    lastSavedDraftRef.current = JSON.stringify(initialDraft);
    setDraftStatus(savedDraft ? "saved" : "idle");
    setDraftReadyForId(reportId);
  }, [report?.id, fullReport, metrics, loadingReport, editDraftQuery.isFetched, editDraftQuery.isError, editDraftQuery.data, draftReadyForId]);

  const updateMutation = trpc.report.update.useMutation();

  const queueDraftSave = (reportId: number, snapshot: ReportEditDraft) => {
    const serialized = JSON.stringify(snapshot);
    const queuedSave = draftQueueRef.current.catch(() => undefined).then(async () => {
      if (serialized === lastSavedDraftRef.current) return;
      await draftMutation.mutateAsync({ id: reportId, draft: snapshot });
      lastSavedDraftRef.current = serialized;
      trpcUtils.report.getEditDraft.setData({ id: reportId }, { draft: snapshot });
      setDraftStatus("saved");
    });
    draftQueueRef.current = queuedSave;
    return queuedSave;
  };

  useEffect(() => {
    const reportId = report?.id;
    if (!reportId || draftReadyForId !== reportId || loadingReport || draftSnapshotJson === lastSavedDraftRef.current) return;

    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    setDraftStatus("saving");
    draftTimerRef.current = setTimeout(() => {
      draftTimerRef.current = null;
      const snapshot = JSON.parse(draftSnapshotJson) as ReportEditDraft;
      void queueDraftSave(reportId, snapshot).catch((error) => {
        console.error("Erro ao salvar rascunho do relatório:", error);
        setDraftStatus("error");
      });
    }, 700);

    return () => {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
        draftTimerRef.current = null;
      }
    };
  }, [report?.id, draftReadyForId, loadingReport, draftSnapshotJson]);

  const flushDraft = async (reportId: number, snapshot: ReportEditDraft) => {
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
    }
    try {
      await draftQueueRef.current;
      if (JSON.stringify(snapshot) !== lastSavedDraftRef.current) {
        setDraftStatus("saving");
        await queueDraftSave(reportId, snapshot);
      }
      await draftQueueRef.current;
      return true;
    } catch (error) {
      console.error("Erro ao salvar rascunho do relatório:", error);
      setDraftStatus("error");
      return false;
    }
  };

  const handleClose = async () => {
    if (report && draftReadyForId === report.id) {
      const saved = await flushDraft(report.id, draftSnapshot);
      if (!saved) {
        toast.error("Não foi possível salvar o rascunho. Tente novamente antes de fechar.");
        return;
      }
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;
    if (!title.trim()) { toast.error("Título é obrigatório"); return; }
    if (!startDate || !endDate) { toast.error("Datas são obrigatórias"); return; }

    const start = parseLocalDate(startDate);
    const end   = parseLocalDate(endDate);
    if (start > end) { toast.error("Data de início não pode ser maior que data de fim"); return; }
    const parseOptionalCount = (value: string) => value.trim() === "" ? null : Number(value);
    const siteCount = parseOptionalCount(sitePurchases);
    const whatsappCount = parseOptionalCount(whatsappPurchases);
    if ([siteCount, whatsappCount].some(value => value !== null && (!Number.isInteger(value) || value < 0))) {
      toast.error("As vendas por canal devem ser números inteiros iguais ou maiores que zero.");
      return;
    }

    setIsLoading(true);
    try {
      await flushDraft(report.id, draftSnapshot);
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
          sitePurchases:                siteCount,
          whatsappPurchases:            whatsappCount,
          purchaseValue:               parseBrazilianNumber(purchaseValue)                        || 0,
          costPerPurchase:             parseBrazilianNumber(costPerPurchase)                      || 0,
          costPerMessage:              parseBrazilianNumber(costPerMessage)                       || 0,
        },
      });
      lastSavedDraftRef.current = draftSnapshotJson;
      trpcUtils.report.getEditDraft.setData({ id: report.id }, { draft: null });
      setDraftStatus("idle");
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
            type="button"
            onClick={() => void handleClose()}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loadingReport || (!!report?.id && editDraftQuery.isLoading) ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Carregando dados...</span>
          </div>
        ) : editDraftQuery.isError ? (
          <div className="p-6 text-center space-y-3">
            <p className="text-sm text-red-300">Não foi possível carregar o rascunho salvo. Tente novamente para evitar substituir dados pendentes.</p>
            <Button type="button" variant="outline" onClick={() => void editDraftQuery.refetch()}>
              Tentar novamente
            </Button>
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
              <Field label="Vendas pelo site"        val={sitePurchases}     set={setSitePurchases}     numeric disabled={isLoading} />
              <Field label="Vendas pelo WhatsApp"    val={whatsappPurchases} set={setWhatsappPurchases} numeric disabled={isLoading} />
              <Field label="Valor Faturado (R$)"    val={purchaseValue}   set={setPurchaseValue}   money disabled={isLoading} />
              <Field label="Custo por Compra (R$)"  val={costPerPurchase} set={setCostPerPurchase} money disabled={isLoading} />
            </div>

            {/* Rascunho automático e gravação final */}
            <div className="flex flex-col gap-3 pt-5 mt-4 border-t border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <p aria-live="polite" className={`text-xs ${draftStatus === "error" ? "text-red-300" : "text-muted-foreground"}`}>
                {draftStatus === "saving" && "Salvando rascunho..."}
                {draftStatus === "saved" && "Rascunho salvo automaticamente. Clique em Salvar Alterações para aplicar ao relatório."}
                {draftStatus === "error" && "Falha ao salvar o rascunho"}
                {draftStatus === "idle" && "O rascunho é salvo automaticamente; use Salvar Alterações para aplicar tudo."}
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  onClick={() => void handleClose()}
                  variant="outline"
                  disabled={isLoading}
                  className="border-white/20 text-white hover:bg-white/10 rounded-xl"
                >
                  Fechar
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
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
