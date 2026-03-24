import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { parseBrazilianNumber } from "@shared/numberParser";
import { parseLocalDate } from "@shared/dateParser";

interface ReportFormProps {
  companyId: number;
  onSuccess: () => void;
}

export default function ReportForm({ companyId, onSuccess }: ReportFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Métricas
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

  const createMutation = trpc.report.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Título do relatório é obrigatório");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Datas de início e fim são obrigatórias");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Data de início não pode ser maior que data de fim");
      return;
    }

    setIsLoading(true);
    try {
      await createMutation.mutateAsync({
        companyId,
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: parseLocalDate(startDate),
        endDate: parseLocalDate(endDate),
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

      toast.success("Relatório criado com sucesso!");
      onSuccess();
    } catch (error) {
      toast.error("Erro ao criar relatório");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <div className="space-y-4">
        <h3 className="text-white font-bold">Informações Básicas</h3>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Título do Relatório *
          </label>
          <Input
            type="text"
            placeholder="Ex: Campanha Fevereiro 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Descrição
          </label>
          <Textarea
            placeholder="Descrição do relatório (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 resize-none"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Data Início *
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Data Fim *
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="space-y-4">
        <h3 className="text-white font-bold">Métricas de Campanha</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Alcance Instagram
            </label>
            <Input
              type="number"
              value={instagramReach}
              onChange={(e) => setInstagramReach(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Alcance Total
            </label>
            <Input
              type="number"
              value={totalReach}
              onChange={(e) => setTotalReach(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Total de Impressões
            </label>
            <Input
              type="number"
              value={totalImpressions}
              onChange={(e) => setTotalImpressions(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Visitas Perfil Instagram
            </label>
            <Input
              type="number"
              value={instagramProfileVisits}
              onChange={(e) => setInstagramProfileVisits(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Novos Seguidores Instagram
            </label>
            <Input
              type="number"
              value={newInstagramFollowers}
              onChange={(e) => setNewInstagramFollowers(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Mensagens Iniciadas
            </label>
            <Input
              type="number"
              value={messagesInitiated}
              onChange={(e) => setMessagesInitiated(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Valor Gasto (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              value={totalSpent}
              onChange={(e) => setTotalSpent(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Cliques Todos
            </label>
            <Input
              type="number"
              value={totalClicks}
              onChange={(e) => setTotalClicks(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Custo por Clique (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              value={costPerClick}
              onChange={(e) => setCostPerClick(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Retenção de Reprodução de Vídeo (%)
            </label>
            <Input
              type="number"
              step="0.01"
              value={videoRetentionRate}
              onChange={(e) => setVideoRetentionRate(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Visitas no Perfil através das Campanhas
            </label>
            <Input
              type="number"
              value={profileVisitsThroughCampaigns}
              onChange={(e) => setProfileVisitsThroughCampaigns(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Custo de Visita através da Campanha (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              value={costPerProfileVisit}
              onChange={(e) => setCostPerProfileVisit(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold"
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isLoading ? "Criando..." : "Criar Relatório"}
        </Button>
      </div>
    </form>
  );
}
