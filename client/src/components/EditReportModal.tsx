import { useState, useEffect } from "react";
import { Report } from "@shared/types";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { parseBrazilianNumber } from "@shared/numberParser";
import { formatLocalDate, parseLocalDate } from "@shared/dateParser";

interface EditReportModalProps {
  report: Report | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditReportModal({ report, onClose, onSuccess }: EditReportModalProps) {
  // Busca o relatório completo (com métricas) do servidor
  const { data: fullData, isLoading: loadingReport } = trpc.report.get.useQuery(
    { id: report?.id ?? 0 },
    { enabled: !!report?.id }
  );

  const fullReport = fullData?.report;
  const metrics = fullData?.metrics;

  // Estados do formulário — iniciam vazios, preenchidos via useEffect quando dados chegam
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [instagramReach, setInstagramReach] = useState("0");
  const [totalReach, setTotalReach] = useState("0");
  const [totalImpressions, setTotalImpressions] = useState("0");
  const [instagramProfileVisits, setInstagramProfileVisits] = useState("0");
  const [newInstagramFollowers, setNewInstagramFollowers] = useState("0");
  const [messagesInitiated, setMessagesInitiated] = useState("0");
  const [totalSpent, setTotalSpent] = useState("0");
  const [totalClicks, setTotalClicks] = useState("0");
  const [costPerClick, setCostPerClick] = useState("0");
  const [videoRetentionRate, setVideoRetentionRate] = useState("0");
  const [profileVisitsThroughCampaigns, setProfileVisitsThroughCampaigns] = useState("0");
  const [costPerProfileVisit, setCostPerProfileVisit] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

  // Quando o relatório completo chegar do servidor, preenche todos os campos
  useEffect(() => {
    if (!fullReport) return;
    setTitle(fullReport.title || "");
    setDescription(fullReport.description || "");
    setStartDate(formatLocalDate(new Date(fullReport.startDate)));
    setEndDate(formatLocalDate(new Date(fullReport.endDate)));
  }, [fullReport]);

  useEffect(() => {
    if (!metrics) return;
    setInstagramReach(metrics.instagramReach?.toString() ?? "0");
    setTotalReach(metrics.totalReach?.toString() ?? "0");
    setTotalImpressions(metrics.totalImpressions?.toString() ?? "0");
    setInstagramProfileVisits(metrics.instagramProfileVisits?.toString() ?? "0");
    setNewInstagramFollowers(metrics.newInstagramFollowers?.toString() ?? "0");
    setMessagesInitiated(metrics.messagesInitiated?.toString() ?? "0");
    setTotalSpent(metrics.totalSpent?.toString() ?? "0");
    setTotalClicks(metrics.totalClicks?.toString() ?? "0");
    setCostPerClick(metrics.costPerClick?.toString() ?? "0");
    setVideoRetentionRate(metrics.videoRetentionRate?.toString() ?? "0");
    setProfileVisitsThroughCampaigns(metrics.profileVisitsThroughCampaigns?.toString() ?? "0");
    setCostPerProfileVisit(metrics.costPerProfileVisit?.toString() ?? "0");
  }, [metrics]);

  const updateMutation = trpc.report.update.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;
    if (!title.trim()) { toast.error("Título do relatório é obrigatório"); return; }
    if (!startDate || !endDate) { toast.error("Datas de início e fim são obrigatórias"); return; }

    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    if (start > end) { toast.error("Data de início não pode ser maior que data de fim"); return; }

    setIsLoading(true);
    try {
      await updateMutation.mutateAsync({
        id: report.id,
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: start,
        endDate: end,
        metrics: {
          instagramReach: Math.floor(parseBrazilianNumber(instagramReach)) || 0,
          totalReach: Math.floor(parseBrazilianNumber(totalReach)) || 0,
          totalImpressions: Math.floor(parseBrazilianNumber(totalImpressions)) || 0,
          instagramProfileVisits: Math.floor(parseBrazilianNumber(instagramProfileVisits)) || 0,
          newInstagramFollowers: Math.floor(parseBrazilianNumber(newInstagramFollowers)) || 0,
          messagesInitiated: Math.floor(parseBrazilianNumber(messagesInitiated)) || 0,
          totalSpent: parseBrazilianNumber(totalSpent) || 0,
          totalClicks: Math.floor(parseBrazilianNumber(totalClicks)) || 0,
          costPerClick: parseBrazilianNumber(costPerClick) || 0,
          videoRetentionRate: parseBrazilianNumber(videoRetentionRate) || 0,
          profileVisitsThroughCampaigns: Math.floor(parseBrazilianNumber(profileVisitsThroughCampaigns)) || 0,
          costPerProfileVisit: parseBrazilianNumber(costPerProfileVisit) || 0,
          cpm: 0,
          ctr: 0,
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

  const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#0f1623] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-white/10 bg-[#0f1623]/95 backdrop-blur rounded-t-2xl">
          <h2 className="text-lg font-bold text-white">Editar Relatório</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Loading state */}
        {loadingReport ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Carregando dados do relatório...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Informações Básicas</h3>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Título do Relatório *
                </label>
                <Input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Relatório de Março 2026" className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Descrição</label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Descrição opcional" className={`${inputClass} resize-none`} rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Início *</label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Fim *</label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Métricas */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Métricas</h3>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Alcance Instagram", val: instagramReach, set: setInstagramReach },
                  { label: "Alcance Total", val: totalReach, set: setTotalReach },
                  { label: "Total de Impressões", val: totalImpressions, set: setTotalImpressions },
                  { label: "Visitas Perfil Instagram", val: instagramProfileVisits, set: setInstagramProfileVisits },
                  { label: "Novos Seguidores Instagram", val: newInstagramFollowers, set: setNewInstagramFollowers },
                  { label: "Mensagens Iniciadas", val: messagesInitiated, set: setMessagesInitiated },
                  { label: "Valor Gasto (R$)", val: totalSpent, set: setTotalSpent },
                  { label: "Cliques Totais", val: totalClicks, set: setTotalClicks },
                  { label: "Custo por Clique (R$)", val: costPerClick, set: setCostPerClick },
                  { label: "Retenção de Vídeo (%)", val: videoRetentionRate, set: setVideoRetentionRate },
                  { label: "Visitas via Campanhas", val: profileVisitsThroughCampaigns, set: setProfileVisitsThroughCampaigns },
                  { label: "Custo por Visita (R$)", val: costPerProfileVisit, set: setCostPerProfileVisit },
                ].map(field => (
                  <div key={field.label}>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                      {field.label}
                    </label>
                    <Input type="text" value={field.val}
                      onChange={e => field.set(e.target.value)} className={inputClass} />
                  </div>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
              <Button type="button" onClick={onClose} variant="outline"
                className="border-white/20 text-white hover:bg-white/10 rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold px-6">
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
