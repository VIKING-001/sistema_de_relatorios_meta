import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import CompanyForm from "@/components/CompanyForm";
import ReportList from "@/components/ReportList";
import ReportForm from "@/components/ReportForm";
import EditReportModal from "@/components/EditReportModal";
import { Report, Company } from "@shared/types";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus, Loader2, Building2, Zap, ArrowLeft,
  CheckCircle2, AlertCircle, FileText, Edit2, Trash2,
  ChevronDown, LogOut, BarChart2, X,
} from "lucide-react";

// ─── Company Grid Card ────────────────────────────────────────────────────────
function CompanyCard({
  company, onClick,
}: { company: Company; onClick: () => void }) {
  const { data: metaStatus } = trpc.meta.getStatus.useQuery({ companyId: company.id });
  const { data: reports } = trpc.report.list.useQuery({ companyId: company.id });

  const isConnected = metaStatus?.connected && !metaStatus?.expired;
  const isExpired   = metaStatus?.expired;
  const reportCount = reports?.length ?? 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left glass-card group overflow-hidden border-white/10 rounded-2xl hover:border-primary/30 transition-all duration-500 p-0 cursor-pointer"
    >
      <div className="relative overflow-hidden p-5 pb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-start justify-between gap-3 relative">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-white uppercase tracking-wide truncate leading-tight">
                {company.name}
              </h3>
              {company.description && (
                <p className="text-[10px] text-white/30 truncate mt-0.5">{company.description}</p>
              )}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold shrink-0 ${
            isConnected
              ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/25"
              : isExpired
              ? "text-amber-400 bg-amber-400/10 border border-amber-400/25"
              : "text-white/30 bg-white/5 border border-white/10"
          }`}>
            <Zap className="h-2.5 w-2.5" />
            {isConnected ? "Meta ✓" : isExpired ? "Expirado" : "Sem Meta"}
          </span>
        </div>
      </div>

      <div className="px-5 pb-2 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <BarChart2 className="h-3 w-3 text-white/20" />
          <span className="text-[11px] text-white/40">
            <span className="text-white font-semibold">{reportCount}</span> relatório{reportCount !== 1 ? "s" : ""}
          </span>
        </div>
        {metaStatus?.adAccountId && (
          <span className="text-[10px] text-primary/50 font-mono truncate">{metaStatus.adAccountId}</span>
        )}
      </div>

      <div className="px-5 pb-5 pt-3 border-t border-white/5 flex gap-2">
        <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/8 text-xs text-white/50 hover:text-white hover:border-white/20 transition-all">
          <FileText className="h-3.5 w-3.5" /> Ver Relatórios
        </div>
        <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary/15 border border-primary/30 text-xs text-primary font-semibold group-hover:bg-primary/20 transition-all">
          <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
        </div>
      </div>
    </button>
  );
}

// ─── Company Detail View ──────────────────────────────────────────────────────
function CompanyDetailView({
  company, onBack, onUpdate, autoOpenMeta,
}: {
  company: Company;
  onBack: () => void;
  onUpdate: () => void;
  autoOpenMeta?: boolean;
}) {
  const [showReportDialog, setShowReportDialog]   = useState(false);
  const [showListDialog, setShowListDialog]       = useState(false);
  const [editingReport, setEditingReport]         = useState<Report | null>(null);
  const [isEditingCompany, setIsEditingCompany]   = useState(false);
  const [isDisconnecting, setIsDisconnecting]     = useState(false);
  const [isSelectingAccount, setIsSelectingAccount] = useState(false);

  const { data: reports, refetch: refetchReports } = trpc.report.list.useQuery({ companyId: company.id });
  const { data: metaStatus, refetch: refetchStatus } = trpc.meta.getStatus.useQuery(
    { companyId: company.id },
    { refetchOnWindowFocus: true }
  );
  const { data: adAccounts, isLoading: loadingAccounts } = trpc.meta.listAdAccounts.useQuery(
    { companyId: company.id },
    { enabled: !!metaStatus?.connected }
  );

  const deleteMutation        = trpc.company.delete.useMutation({
    onSuccess: () => { toast.success("Empresa removida"); onBack(); onUpdate(); },
    onError:   () => toast.error("Erro ao remover empresa"),
  });
  const disconnectMutation    = trpc.meta.disconnect.useMutation();
  const selectAccountMutation = trpc.meta.selectAdAccount.useMutation();

  const isConnected = metaStatus?.connected && !metaStatus?.expired;
  const isExpired   = metaStatus?.expired;

  const handleConnectMeta    = () => { window.location.href = `/api/meta/connect?companyId=${company.id}`; };
  const handleDisconnect     = async () => {
    if (!confirm("Desconectar esta empresa do Meta Ads?")) return;
    setIsDisconnecting(true);
    try {
      await disconnectMutation.mutateAsync({ companyId: company.id });
      toast.success("Desconectado do Meta Ads.");
      refetchStatus(); onUpdate();
    } catch { toast.error("Erro ao desconectar."); }
    finally { setIsDisconnecting(false); }
  };
  const handleSelectAccount  = async (accountId: string) => {
    setIsSelectingAccount(true);
    try {
      await selectAccountMutation.mutateAsync({ companyId: company.id, adAccountId: accountId });
      toast.success("Conta selecionada!");
      refetchStatus(); onUpdate();
    } catch { toast.error("Erro ao selecionar conta."); }
    finally { setIsSelectingAccount(false); }
  };
  const handleDelete         = () => {
    if (confirm(`Remover a empresa ${company.name}? Todos os relatórios serão apagados.`)) {
      deleteMutation.mutate({ id: company.id });
    }
  };

  const formatExpiry = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/40 hover:text-primary text-xs transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white uppercase tracking-wide">{company.name}</h1>
            {company.description && <p className="text-[11px] text-white/40">{company.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setIsEditingCompany(v => !v)}
            className="p-2 rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-primary hover:border-primary/30 transition-all"
            title="Editar empresa">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleDelete} disabled={deleteMutation.isPending}
            className="p-2 rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-red-400 hover:border-red-400/30 transition-all"
            title="Excluir empresa">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Editar empresa */}
      <AnimatePresence>
        {isEditingCompany && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="glass-card rounded-xl p-5 border border-primary/20">
              <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">Editar Empresa</h4>
              <CompanyForm
                company={company}
                onSuccess={() => { setIsEditingCompany(false); onUpdate(); }}
                onCancel={() => setIsEditingCompany(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Meta Connection Panel ── */}
        <div className={`glass-card rounded-2xl border p-5 space-y-4 ${
          isConnected ? "border-emerald-500/20" : isExpired ? "border-amber-500/20" : "border-white/10"
        }`}>
          <div className="flex items-center gap-2">
            <Zap className={`h-4 w-4 ${isConnected ? "text-emerald-400" : isExpired ? "text-amber-400" : "text-white/30"}`} />
            <h4 className={`text-sm font-bold uppercase tracking-wider ${
              isConnected ? "text-emerald-400" : isExpired ? "text-amber-400" : "text-white/40"
            }`}>Meta Ads</h4>
            {isConnected && (
              <span className="ml-auto flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle2 className="h-3 w-3" /> Conectado
              </span>
            )}
            {isExpired && (
              <span className="ml-auto flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                <AlertCircle className="h-3 w-3" /> Expirado
              </span>
            )}
            {!isConnected && !isExpired && (
              <span className="ml-auto text-xs text-white/20">Não conectado</span>
            )}
          </div>

          {isConnected && (
            <div className="space-y-3">
              {metaStatus?.expiresAt && (
                <p className="text-xs text-white/40">
                  Token válido até: <span className="text-white font-medium">{formatExpiry(metaStatus.expiresAt)}</span>
                </p>
              )}
              {metaStatus?.hasAdAccount ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-400">Conta ativa</p>
                    <p className="text-xs text-white/50 font-mono truncate">{metaStatus.adAccountId}</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Selecione a conta de anúncios
                  </p>
                  {loadingAccounts ? (
                    <div className="flex items-center gap-2 text-white/30 text-xs py-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Buscando contas...
                    </div>
                  ) : adAccounts && adAccounts.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {adAccounts.map((acc: any) => (
                        <button key={acc.id} onClick={() => handleSelectAccount(acc.id)} disabled={isSelectingAccount}
                          className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all text-left">
                          <div>
                            <p className="text-xs font-medium text-white">{acc.name}</p>
                            <p className="text-[10px] text-white/40 font-mono">{acc.id} · {acc.currency}</p>
                          </div>
                          <ChevronDown className="h-3.5 w-3.5 text-white/30 -rotate-90 shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                      <p className="font-bold">Nenhuma conta encontrada</p>
                      <p className="text-white/50 mt-0.5">Verifique o Business Manager.</p>
                    </div>
                  )}
                </>
              )}
              <button onClick={handleDisconnect} disabled={isDisconnecting}
                className="flex items-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 transition-colors">
                {isDisconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
                Desconectar Meta Ads
              </button>
            </div>
          )}

          {(!isConnected || isExpired) && (
            <div className="space-y-3">
              {isExpired && <p className="text-xs text-amber-400">Token expirado. Reconecte para continuar.</p>}
              {!isConnected && !isExpired && (
                <p className="text-xs text-white/30">Conecte ao Meta Ads para importar métricas automaticamente.</p>
              )}
              <Button onClick={handleConnectMeta}
                className="w-full rounded-xl bg-[#1877F2] hover:bg-[#1466d8] text-white font-bold">
                <Zap className="h-4 w-4 mr-2" />
                {isExpired ? "Reconectar com Meta" : "Conectar com Meta"}
              </Button>
            </div>
          )}
        </div>

        {/* ── Reports Section ── */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold text-white">Relatórios</h4>
              <span className="text-xs text-white/30 tabular-nums">({reports?.length ?? 0})</span>
            </div>
            <Button size="sm" onClick={() => setShowReportDialog(true)}
              className="h-8 text-xs gap-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg">
              <Plus className="h-3.5 w-3.5" /> Novo Relatório
            </Button>
          </div>
          <div className="p-5">
            {reports && reports.length > 0 ? (
              <ReportList
                reports={reports}
                companyId={company.id}
                onEditReport={(report) => setEditingReport(report)}
                onUpdate={() => { refetchReports(); onUpdate(); }}
              />
            ) : (
              <div className="text-center py-12 text-white/20">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum relatório ainda</p>
                <p className="text-xs mt-1">Clique em "Novo Relatório" para começar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Novo Relatório */}
      <AnimatePresence>
        {showReportDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) setShowReportDialog(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0d1422] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl my-6">
              <div className="sticky top-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-[#0d1422]/95 backdrop-blur rounded-t-2xl z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Novo Relatório</h2>
                    <p className="text-xs text-white/40">{company.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowReportDialog(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <ReportForm
                  companyId={company.id}
                  metaConnected={!!metaStatus?.connected && !metaStatus?.expired}
                  metaHasAccount={!!metaStatus?.hasAdAccount}
                  onSuccess={() => { setShowReportDialog(false); refetchReports(); onUpdate(); }}
                  onCancel={() => setShowReportDialog(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: edição */}
      <EditReportModal
        report={editingReport}
        onClose={() => setEditingReport(null)}
        onSuccess={() => { setEditingReport(null); refetchReports(); onUpdate(); }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Relatorios() {
  const { data: companies, isLoading, refetch } = trpc.company.list.useQuery();
  const [showForm, setShowForm]                 = useState(false);
  const [selectedCompany, setSelectedCompany]   = useState<Company | null>(null);
  const [autoOpenMetaId, setAutoOpenMetaId]     = useState<number | null>(null);

  useEffect(() => {
    const params       = new URLSearchParams(window.location.search);
    const metaConnected = params.get("meta_connected");
    const companyId    = params.get("companyId");
    const metaError    = params.get("meta_error");
    const accounts     = params.get("accounts");

    if (metaConnected) {
      let adCount = 0;
      try { adCount = JSON.parse(decodeURIComponent(accounts || "[]")).length; } catch {}
      const msg = adCount > 1
        ? "Meta conectado! Selecione qual conta de anúncios usar."
        : adCount === 1 ? "Meta conectado! Conta vinculada automaticamente."
        : "Meta conectado! Configure a conta de anúncios.";
      toast.success(msg, { duration: 6000 });

      if (companyId) {
        setAutoOpenMetaId(Number(companyId));
        // Auto-navigate to the company that just connected
        refetch().then(({ data }) => {
          const c = data?.find((x: Company) => x.id === Number(companyId));
          if (c) setSelectedCompany(c);
        });
      }
      window.history.replaceState({}, "", "/relatorios");
    }
    if (metaError) {
      toast.error("Erro ao conectar Meta: " + decodeURIComponent(metaError), { duration: 8000 });
      window.history.replaceState({}, "", "/relatorios");
    }
  }, []);

  // If a company is selected, show its detail page
  if (selectedCompany) {
    return (
      <CompanyDetailView
        company={selectedCompany}
        onBack={() => setSelectedCompany(null)}
        onUpdate={() => refetch()}
        autoOpenMeta={autoOpenMetaId === selectedCompany.id}
      />
    );
  }

  // Otherwise show company grid
  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Relatórios</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Selecione uma empresa para ver seus relatórios</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova </span>Empresa
        </Button>
      </div>

      {/* New company form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5 rounded-2xl border border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-white">Nova Empresa</h3>
            <CompanyForm
              onSuccess={() => { setShowForm(false); refetch(); }}
              onCancel={() => setShowForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Company grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-44 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : !companies?.length ? (
        <div className="text-center py-20 text-white/30">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium">Nenhuma empresa cadastrada</p>
          <p className="text-sm mt-1">Clique em "Nova Empresa" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onClick={() => setSelectedCompany(company)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
