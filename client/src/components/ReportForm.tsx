import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2, Calendar, Target, TrendingUp, DollarSign, MousePointer2,
  PlayCircle, Users, Plus, Zap, AlertCircle, MessageCircle, ShoppingBag,
  ChevronDown,
} from "lucide-react";
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

// Meses em pt-BR
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getLastDayOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function toDateInput(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function ReportForm({
  companyId, metaConnected = false, metaHasAccount = false, onSuccess, onCancel,
}: ReportFormProps) {
  const [, setLocation] = useLocation();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Métricas — Performance e Alcance
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

  // Métricas — Conversões / Compras
  const [purchases, setPurchases] = useState("0");
  const [purchaseValue, setPurchaseValue] = useState("0");
  const [costPerPurchase, setCostPerPurchase] = useState("0");
  const [costPerMessage, setCostPerMessage] = useState("0");

  const createMutation = trpc.report.create.useMutation();
  const importMutation = trpc.meta.fetchInsights.useMutation();

  // ── Seletor de mês: preenche datas automaticamente ──
  const applyMonth = (month: number, year: number) => {
    const lastDay = getLastDayOfMonth(year, month);
    const start = toDateInput(year, month, 1);
    const end = toDateInput(year, month, lastDay);
    setStartDate(start);
    setEndDate(end);
    // Sugere título se vazio
    if (!title.trim()) {
      setTitle(`${MONTHS[month].toUpperCase()} ${year}`);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value, 10);
    setSelectedMonth(m);
    applyMonth(m, selectedYear);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = parseInt(e.target.value, 10);
    setSelectedYear(y);
    applyMonth(selectedMonth, y);
  };

  // Gera anos: 3 anos atrás até 1 à frente
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 3 + i);

  // ── Importar do Meta ──
  const handleImportMeta = async () => {
    if (!startDate || !endDate) {
      toast.error("Selecione o período antes de importar do Meta.");
      return;
    }
    setIsImporting(true);
    try {
      const data = await importMutation.mutateAsync({ companyId, startDate, endDate });

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
      setPurchases(String(data.purchases ?? 0));
      setPurchaseValue(String(data.purchaseValue ?? 0));
      setCostPerPurchase(String(data.costPerPurchase ?? 0));
      setCostPerMessage(String(data.costPerMessage ?? 0));

      if ((data as any)._warning) {
        toast.warning((data as any)._warning, { duration: 8000 });
      } else {
        toast.success("Métricas importadas do Meta Ads com sucesso!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao importar dados do Meta.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Título é obrigatório"); return; }
    if (!startDate || !endDate) { toast.error("Selecione o período"); return; }

    setIsLoading(true);
    try {
      await createMutation.mutateAsync({
        companyId,
        title: title.trim(),
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
          purchases: Math.floor(parseBrazilianNumber(purchases)) || 0,
          purchaseValue: parseBrazilianNumber(purchaseValue) || 0,
          costPerPurchase: parseBrazilianNumber(costPerPurchase) || 0,
          costPerMessage: parseBrazilianNumber(costPerMessage) || 0,
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
  const selectClass = "bg-[#0d1422] border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer";

  const spentNum = parseBrazilianNumber(totalSpent) || 0;
  const msgNum = parseBrazilianNumber(messagesInitiated) || 0;
  const calculatedCostPerMsg = msgNum > 0 ? (spentNum / msgNum).toFixed(2) : "—";

  return (
    <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="space-y-7">

      {/* ── 1. Cronograma ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Calendar className="h-4 w-4" />
          <h3 className="font-bold font-display uppercase tracking-wider text-xs">Cronograma e Identificação</h3>
        </div>

        {/* Seletor rápido de mês */}
        <div className="p-3 rounded-xl bg-white/3 border border-white/8 space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Selecionar mês rapidamente</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className={`${selectClass} w-full pr-8`}
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative w-28">
              <select
                value={selectedYear}
                onChange={handleYearChange}
                className={`${selectClass} w-full pr-8`}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => applyMonth(selectedMonth, selectedYear)}
              className="rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs px-3 shrink-0"
            >
              Aplicar
            </Button>
          </div>
          {startDate && endDate && (
            <p className="text-[10px] text-emerald-400 font-medium">
              ✓ {new Date(startDate + "T00:00:00").toLocaleDateString("pt-BR")} até {new Date(endDate + "T00:00:00").toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Título da Campanha
          </label>
          <Input
            placeholder="Ex: MES 04 – Lançamento Verão"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
              Início do Período
            </label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
              Fim do Período
            </label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading} className={inputClass} />
          </div>
        </div>
      </div>

      {/* ── 2. Importar Meta ── */}
      {!metaConnected ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-300">Meta Ads não conectado</p>
            <p className="text-xs text-muted-foreground mt-0.5">Conecte para importar métricas automaticamente.</p>
          </div>
          <Button type="button" size="sm" variant="outline"
            onClick={() => setLocation("/contas")}
            className="shrink-0 rounded-xl border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs">
            Conectar
          </Button>
        </div>
      ) : !metaHasAccount ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-300">Conta de anúncio não selecionada</p>
            <p className="text-xs text-muted-foreground mt-0.5">Selecione a conta no painel de Contas de Anúncio.</p>
          </div>
          <Button type="button" size="sm" variant="outline"
            onClick={() => setLocation("/contas")}
            className="shrink-0 rounded-xl border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs">
            Selecionar
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1877F2]/10 border border-[#1877F2]/30">
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Importar métricas do Meta Ads</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Preenche todos os campos automaticamente com dados reais do período selecionado.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleImportMeta}
            disabled={isImporting || isLoading || !startDate || !endDate}
            className="shrink-0 rounded-xl bg-[#1877F2] hover:bg-[#1466d8] text-white font-bold px-5 py-2 h-auto disabled:opacity-40"
          >
            {isImporting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Importando...</>
            ) : (
              <><Zap className="h-4 w-4 mr-2" />Importar do Meta</>
            )}
          </Button>
        </div>
      )}

      {/* ── 3. Performance e Alcance ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Target className="h-4 w-4" />
          <h3 className="font-bold font-display uppercase tracking-wider text-xs">Performance e Alcance</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Alcance IG", val: instagramReach, set: setInstagramReach, icon: Users },
            { label: "Alcance Total", val: totalReach, set: setTotalReach, icon: TrendingUp },
            { label: "Impressões", val: totalImpressions, set: setTotalImpressions, icon: Target },
            { label: "Visitas IG", val: instagramProfileVisits, set: setInstagramProfileVisits, icon: MousePointer2 },
            { label: "Seguidores Novos", val: newInstagramFollowers, set: setNewInstagramFollowers, icon: Plus },
            { label: "Visitas via Camp.", val: profileVisitsThroughCampaigns, set: setProfileVisitsThroughCampaigns, icon: TrendingUp },
          ].map((field) => (
            <div key={field.label} className="group">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1 group-focus-within:text-primary transition-colors">
                <field.icon className="h-3 w-3" />
                {field.label}
              </label>
              <Input type="text" value={field.val} onChange={(e) => field.set(e.target.value)}
                disabled={isLoading} className={`${inputClass} bg-white/[0.03]`} />
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Investimento ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-yellow-400">
          <DollarSign className="h-4 w-4" />
          <h3 className="font-bold font-display uppercase tracking-wider text-xs text-yellow-400">Investimento e Cliques</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Gasto", val: totalSpent, set: setTotalSpent, money: true },
            { label: "Cliques Totais", val: totalClicks, set: setTotalClicks, money: false },
            { label: "CPC", val: costPerClick, set: setCostPerClick, money: true },
            { label: "Retenção Vídeo %", val: videoRetentionRate, set: setVideoRetentionRate, money: false },
            { label: "Custo/Visita", val: costPerProfileVisit, set: setCostPerProfileVisit, money: true },
          ].map((field) => (
            <div key={field.label} className="group">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1 block group-focus-within:text-yellow-400 transition-colors">
                {field.label}
              </label>
              <div className="relative">
                {field.money && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                )}
                <Input type="text" value={field.val} onChange={(e) => field.set(e.target.value)}
                  disabled={isLoading}
                  className={`${inputClass} bg-white/[0.03] ${field.money ? "pl-9" : ""}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Mensagens ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <MessageCircle className="h-4 w-4" />
          <h3 className="font-bold font-display uppercase tracking-wider text-xs text-cyan-400">Mensagens</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="group">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1 block group-focus-within:text-cyan-400 transition-colors">
              Mensagens Iniciadas
            </label>
            <Input type="text" value={messagesInitiated} onChange={(e) => setMessagesInitiated(e.target.value)}
              disabled={isLoading} className={`${inputClass} bg-white/[0.03]`} />
          </div>

          <div className="group">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1 block group-focus-within:text-cyan-400 transition-colors">
              Custo por Mensagem
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input type="text" value={costPerMessage} onChange={(e) => setCostPerMessage(e.target.value)}
                disabled={isLoading}
                className={`${inputClass} bg-white/[0.03] pl-9`} />
            </div>
            {msgNum > 0 && spentNum > 0 && (
              <p className="text-[10px] text-cyan-400 mt-1 ml-1">
                Calculado: R$ {calculatedCostPerMsg} (gasto ÷ mensagens)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── 6. Conversões / Compras ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <ShoppingBag className="h-4 w-4" />
          <h3 className="font-bold font-display uppercase tracking-wider text-xs text-emerald-400">Conversões e Compras</h3>
          <span className="text-[10px] text-muted-foreground font-normal normal-case tracking-normal ml-1">(quando houver)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="group">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1 block group-focus-within:text-emerald-400 transition-colors">
              Nº de Compras
            </label>
            <Input type="text" value={purchases} onChange={(e) => setPurchases(e.target.value)}
              disabled={isLoading} className={`${inputClass} bg-white/[0.03]`} />
          </div>

          <div className="group">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1 block group-focus-within:text-emerald-400 transition-colors">
              Valor Faturado (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input type="text" value={purchaseValue} onChange={(e) => setPurchaseValue(e.target.value)}
                disabled={isLoading} className={`${inputClass} bg-white/[0.03] pl-9`} />
            </div>
          </div>

          <div className="group">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1 block group-focus-within:text-emerald-400 transition-colors">
              Custo por Compra
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input type="text" value={costPerPurchase} onChange={(e) => setCostPerPurchase(e.target.value)}
                disabled={isLoading} className={`${inputClass} bg-white/[0.03] pl-9`} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Botões ── */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}
            className="flex-1 rounded-2xl py-5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}
          className="flex-[2] rounded-2xl py-5 bg-primary hover:bg-primary/90 text-white font-bold glow-blue shadow-lg shadow-primary/20 transition-all">
          {isLoading ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" />Salvando...</>
          ) : (
            "Finalizar Relatório"
          )}
        </Button>
      </div>
    </motion.form>
  );
}
