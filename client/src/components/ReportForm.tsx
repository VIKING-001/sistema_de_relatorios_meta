import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Calendar, Target, TrendingUp, DollarSign, MousePointer2, PlayCircle, Users, Plus, Zap, AlertCircle } from "lucide-react";
import { parseBrazilianNumber } from "@shared/numberParser";
import { parseLocalDate } from "@shared/dateParser";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

interface ReportFormProps {
  companyId: number;
  metaConnected?: boolean;
  metaHasAccount?: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function ReportForm({ companyId, metaConnected = false, metaHasAccount = false, onSuccess, onCancel }: ReportFormProps) {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
  const importMutation = trpc.meta.fetchInsights.useMutation();

  const handleImportMeta = async () => {
    if (!startDate || !endDate) {
      toast.error("Preencha as datas de início e fim antes de importar do Meta.");
      return;
    }
    setIsImporting(true);
    try {
      const data = await importMutation.mutateAsync({
        companyId,
        startDate,
        endDate,
      });

      // Preenche os campos automaticamente
      setTotalReach(String(data.totalReach));
      setInstagramReach(String(data.instagramReach));
      setTotalImpressions(String(data.totalImpressions));
      setInstagramProfileVisits(String(data.instagramProfileVisits));
      setNewInstagramFollowers(String(data.newInstagramFollowers));
      setMessagesInitiated(String(data.messagesInitiated));
      setTotalSpent(String(data.totalSpent));
      setTotalClicks(String(data.totalClicks));
      setCostPerClick(String(data.costPerClick));
      setVideoRetentionRate(String(data.videoRetentionRate));
      setProfileVisitsThroughCampaigns(String(data.profileVisitsThroughCampaigns));
      setCostPerProfileVisit(String(data.costPerProfileVisit));

      toast.success("Métricas importadas do Meta Ads com sucesso!");
    } catch (err: any) {
      const msg = err?.message || "Erro ao importar dados do Meta.";
      toast.error(msg);
    } finally {
      setIsImporting(false);
    }
  };

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

  const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl";

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {/* Informações Básicas */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-primary">
          <Calendar className="h-5 w-5" />
          <h3 className="font-bold font-display uppercase tracking-wider text-sm">Cronograma e Identificação</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
              Título da Campanha
            </label>
            <Input
              placeholder="Ex: Lançamento Coleção Outono 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
              Início do Período
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
              Fim do Período
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Botão de importação Meta */}
      {!metaConnected ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-300">Meta Ads não conectado</p>
            <p className="text-xs text-muted-foreground mt-0.5">Conecte o Meta Ads desta empresa para importar métricas automaticamente.</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setLocation("/contas")}
            className="shrink-0 rounded-xl border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs"
          >
            Conectar
          </Button>
        </div>
      ) : !metaHasAccount ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-300">Conta de anúncio não selecionada</p>
            <p className="text-xs text-muted-foreground mt-0.5">Vá em Contas de Anúncio e selecione qual conta usar para esta empresa.</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setLocation("/contas")}
            className="shrink-0 rounded-xl border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs"
          >
            Selecionar
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1877F2]/10 border border-[#1877F2]/30">
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Importar métricas do Meta Ads</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Preenche os campos abaixo automaticamente com dados reais do período selecionado.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleImportMeta}
            disabled={isImporting || isLoading || !startDate || !endDate}
            className="shrink-0 rounded-xl bg-[#1877F2] hover:bg-[#1466d8] text-white font-bold px-5 py-2 h-auto disabled:opacity-40"
          >
            {isImporting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Importando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Importar do Meta</span>
              </div>
            )}
          </Button>
        </div>
      )}

      {/* Métricas */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-primary">
          <Target className="h-5 w-5" />
          <h3 className="font-bold font-display uppercase tracking-wider text-sm">Performance e Alcance</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: "Alcance IG", val: instagramReach, set: setInstagramReach, icon: Users },
            { label: "Alcance Total", val: totalReach, set: setTotalReach, icon: TrendingUp },
            { label: "Impressões", val: totalImpressions, set: setTotalImpressions, icon: Target },
            { label: "Visitas IG", val: instagramProfileVisits, set: setInstagramProfileVisits, icon: MousePointer2 },
            { label: "Seguidores", val: newInstagramFollowers, set: setNewInstagramFollowers, icon: Plus },
            { label: "Mensagens", val: messagesInitiated, set: setMessagesInitiated, icon: PlayCircle },
            { label: "Total Gasto", val: totalSpent, set: setTotalSpent, icon: DollarSign, isMoney: true },
            { label: "Cliques", val: totalClicks, set: setTotalClicks, icon: MousePointer2 },
            { label: "CPC", val: costPerClick, set: setCostPerClick, icon: DollarSign, isMoney: true },
          ].map((field) => (
            <div key={field.label} className="group">
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1 group-focus-within:text-primary transition-colors">
                <field.icon className="h-3 w-3" />
                {field.label}
              </label>
              <div className="relative">
                {field.isMoney && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>}
                <Input
                  type="text"
                  value={field.val}
                  onChange={(e) => field.set(e.target.value)}
                  disabled={isLoading}
                  className={`${inputClass} ${field.isMoney ? 'pl-9' : ''} bg-white/[0.03] hover:bg-white/[0.06]`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/5">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-2xl py-6 border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
          >
            Descartar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-[2] rounded-2xl py-6 bg-primary hover:bg-primary/90 text-white font-bold glow-blue shadow-lg shadow-primary/20 transition-all"
        >
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processando...</span>
            </div>
          ) : (
            "Finalizar Relatório"
          )}
        </Button>
      </div>
    </motion.form>
  );
}
