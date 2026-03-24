import { useState } from "react";
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
  const [title, setTitle] = useState(report?.title || "");
  const [description, setDescription] = useState(report?.description || "");
  const [startDate, setStartDate] = useState(
    report ? formatLocalDate(new Date(report.startDate)) : ""
  );
  const [endDate, setEndDate] = useState(
    report ? formatLocalDate(new Date(report.endDate)) : ""
  );

  // Métricas - usar valores padrão se report não tiver métricas
  const metricsArr = (report as any)?.metrics;
  const metrics = Array.isArray(metricsArr) ? (metricsArr[0] || {}) : (metricsArr || {});
  const [instagramReach, setInstagramReach] = useState(
    metrics.instagramReach?.toString() || "0"
  );
  const [totalReach, setTotalReach] = useState(metrics.totalReach?.toString() || "0");
  const [totalImpressions, setTotalImpressions] = useState(
    metrics.totalImpressions?.toString() || "0"
  );
  const [instagramProfileVisits, setInstagramProfileVisits] = useState(
    metrics.instagramProfileVisits?.toString() || "0"
  );
  const [newInstagramFollowers, setNewInstagramFollowers] = useState(
    metrics.newInstagramFollowers?.toString() || "0"
  );
  const [messagesInitiated, setMessagesInitiated] = useState(
    metrics.messagesInitiated?.toString() || "0"
  );
  const [totalSpent, setTotalSpent] = useState(metrics.totalSpent?.toString() || "0");
  const [totalClicks, setTotalClicks] = useState(metrics.totalClicks?.toString() || "0");
  const [costPerClick, setCostPerClick] = useState(
    metrics.costPerClick?.toString() || "0"
  );
  const [videoRetentionRate, setVideoRetentionRate] = useState(
    metrics.videoRetentionRate?.toString() || "0"
  );
  const [profileVisitsThroughCampaigns, setProfileVisitsThroughCampaigns] = useState(
    metrics.profileVisitsThroughCampaigns?.toString() || "0"
  );
  const [costPerProfileVisit, setCostPerProfileVisit] = useState(
    metrics.costPerProfileVisit?.toString() || "0"
  );

  const [isLoading, setIsLoading] = useState(false);

  const updateMutation = trpc.report.update.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!report) return;

    if (!title.trim()) {
      toast.error("Título do relatório é obrigatório");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Datas de início e fim são obrigatórias");
      return;
    }

    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);

    if (start > end) {
      toast.error("Data de início não pode ser maior que data de fim");
      return;
    }

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
          profileVisitsThroughCampaigns:
            Math.floor(parseBrazilianNumber(profileVisitsThroughCampaigns)) || 0,
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/80 backdrop-blur">
          <h2 className="text-xl font-bold text-white">Editar Relatório</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-white font-bold">Informações Básicas</h3>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Título do Relatório *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Relatório de Fevereiro"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Descrição</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição opcional do relatório"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Data de Início *
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Data de Fim *</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          {/* Métricas */}
          <div className="space-y-4">
            <h3 className="text-white font-bold">Métricas</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Alcance Instagram
                </label>
                <Input
                  type="text"
                  value={instagramReach}
                  onChange={(e) => setInstagramReach(e.target.value)}
                  placeholder="Ex: 46.800"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Alcance Total</label>
                <Input
                  type="text"
                  value={totalReach}
                  onChange={(e) => setTotalReach(e.target.value)}
                  placeholder="Ex: 63.093"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Total de Impressões
                </label>
                <Input
                  type="text"
                  value={totalImpressions}
                  onChange={(e) => setTotalImpressions(e.target.value)}
                  placeholder="Ex: 137.870"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Visitas Perfil Instagram
                </label>
                <Input
                  type="text"
                  value={instagramProfileVisits}
                  onChange={(e) => setInstagramProfileVisits(e.target.value)}
                  placeholder="Ex: 2.800"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Novos Seguidores Instagram
                </label>
                <Input
                  type="text"
                  value={newInstagramFollowers}
                  onChange={(e) => setNewInstagramFollowers(e.target.value)}
                  placeholder="Ex: 546"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Mensagens Iniciadas
                </label>
                <Input
                  type="text"
                  value={messagesInitiated}
                  onChange={(e) => setMessagesInitiated(e.target.value)}
                  placeholder="Ex: 421"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Valor Gasto</label>
                <Input
                  type="text"
                  value={totalSpent}
                  onChange={(e) => setTotalSpent(e.target.value)}
                  placeholder="Ex: 1.935,02"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Cliques Todos
                </label>
                <Input
                  type="text"
                  value={totalClicks}
                  onChange={(e) => setTotalClicks(e.target.value)}
                  placeholder="Ex: 2.125"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Custo por Clique
                </label>
                <Input
                  type="text"
                  value={costPerClick}
                  onChange={(e) => setCostPerClick(e.target.value)}
                  placeholder="Ex: 1,53"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Retenção de Reprodução de Vídeo (%)
                </label>
                <Input
                  type="text"
                  value={videoRetentionRate}
                  onChange={(e) => setVideoRetentionRate(e.target.value)}
                  placeholder="Ex: 17,48"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Visitas no Perfil através das Campanhas
                </label>
                <Input
                  type="text"
                  value={profileVisitsThroughCampaigns}
                  onChange={(e) => setProfileVisitsThroughCampaigns(e.target.value)}
                  placeholder="Ex: 1.050"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Custo de Visita através da Campanha
                </label>
                <Input
                  type="text"
                  value={costPerProfileVisit}
                  onChange={(e) => setCostPerProfileVisit(e.target.value)}
                  placeholder="Ex: 0,28"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
