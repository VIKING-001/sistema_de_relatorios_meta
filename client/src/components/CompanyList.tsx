import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Trash2, Loader2, Edit2, Building2, BarChart2, Zap, CheckCircle2, AlertCircle, ChevronDown, LogOut } from "lucide-react";
import CompanyForm from "./CompanyForm";
import ReportList from "./ReportList";
import ReportForm from "./ReportForm";
import EditReportModal from "./EditReportModal";
import { Report, Company } from "@shared/types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface CompanyListProps {
  company: Company;
  onUpdate: () => void;
  autoOpenMeta?: boolean;
}

export default function CompanyList({ company, onUpdate, autoOpenMeta = false }: CompanyListProps) {
  const [showReports, setShowReports] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [showMetaPanel, setShowMetaPanel] = useState(autoOpenMeta);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSelectingAccount, setIsSelectingAccount] = useState(false);

  const { data: reports, refetch: refetchReports } = trpc.report.list.useQuery(
    { companyId: company.id },
    { enabled: showReports }
  );

  const { data: metaStatus, refetch: refetchStatus } = trpc.meta.getStatus.useQuery(
    { companyId: company.id },
    { refetchOnWindowFocus: true }
  );

  const { data: adAccounts, isLoading: loadingAccounts } = trpc.meta.listAdAccounts.useQuery(
    { companyId: company.id },
    { enabled: showMetaPanel && !!metaStatus?.connected }
  );

  const deleteMutation = trpc.company.delete.useMutation({
    onSuccess: () => {
      toast.success("Empresa removida com sucesso");
      onUpdate();
    },
    onError: (error) => {
      toast.error("Erro ao remover empresa: " + (error as any).message);
    },
  });

  const disconnectMutation = trpc.meta.disconnect.useMutation();
  const selectAccountMutation = trpc.meta.selectAdAccount.useMutation();

  const handleDelete = () => {
    if (confirm(`Deseja realmente remover a empresa ${company.name}? Isso apagará todos os seus relatórios.`)) {
      deleteMutation.mutate({ id: company.id });
    }
  };

  const handleConnectMeta = () => {
    // Redireciona para a rota Express que inicia o OAuth
    window.location.href = `/api/meta/connect?companyId=${company.id}`;
  };

  const handleDisconnect = async () => {
    if (!confirm("Desconectar esta empresa do Meta Ads?")) return;
    setIsDisconnecting(true);
    try {
      await disconnectMutation.mutateAsync({ companyId: company.id });
      toast.success("Empresa desconectada do Meta Ads.");
      refetchStatus();
      onUpdate();
    } catch {
      toast.error("Erro ao desconectar.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSelectAccount = async (accountId: string) => {
    setIsSelectingAccount(true);
    try {
      await selectAccountMutation.mutateAsync({ companyId: company.id, adAccountId: accountId });
      toast.success("Conta de anúncios selecionada!");
      refetchStatus();
      onUpdate();
    } catch {
      toast.error("Erro ao selecionar conta.");
    } finally {
      setIsSelectingAccount(false);
    }
  };

  const isConnected = metaStatus?.connected && !metaStatus?.expired;
  const isExpired = metaStatus?.expired;
  const needsAccount = isConnected && !metaStatus?.hasAdAccount;

  const formatExpiry = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <Card className="glass-card group overflow-hidden border-white/10 hover:border-primary/30 transition-all duration-500">
      <CardHeader className="pb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary glow-blue">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold font-display group-hover:text-primary transition-colors">
                {company.name}
              </CardTitle>
              {company.description && (
                <CardDescription className="line-clamp-1 mt-0.5 text-muted-foreground/80">
                  {company.description}
                </CardDescription>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Badge de status Meta — sempre visível */}
            <button
              onClick={() => setShowMetaPanel(!showMetaPanel)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isConnected
                  ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30"
                  : isExpired
                  ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30"
                  : "bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 border border-[#1877F2]/30"
              }`}
              title="Configurar Meta Ads"
            >
              <Zap className="h-3 w-3" />
              {isConnected ? "Meta ✓" : isExpired ? "Expirado" : "Meta"}
            </button>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditingCompany(true)}
                className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400/70 hover:text-blue-400 transition-all"
                title="Editar"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="p-2 rounded-lg hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-all"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">

        {/* ── Painel Meta Ads ── */}
        <AnimatePresence>
          {showMetaPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={`p-5 rounded-2xl space-y-4 border ${
                isConnected
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : isExpired
                  ? "bg-amber-500/5 border-amber-500/20"
                  : "bg-[#1877F2]/10 border-[#1877F2]/30"
              }`}>

                {/* Header do painel */}
                <div className="flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${isConnected ? "text-emerald-400" : "text-[#1877F2]"}`} />
                  <h4 className={`text-sm font-bold uppercase tracking-wider ${isConnected ? "text-emerald-400" : "text-[#1877F2]"}`}>
                    Meta Ads
                  </h4>
                  {isConnected && (
                    <span className="ml-auto flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Conectado
                    </span>
                  )}
                  {isExpired && (
                    <span className="ml-auto flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                      <AlertCircle className="h-3 w-3" /> Token expirado
                    </span>
                  )}
                  {!isConnected && !isExpired && (
                    <span className="ml-auto text-xs text-muted-foreground">Não conectado</span>
                  )}
                </div>

                {/* Status detalhado quando conectado */}
                {isConnected && (
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground space-y-1">
                      {metaStatus?.expiresAt && (
                        <p>Token válido até: <span className="text-white font-medium">{formatExpiry(metaStatus.expiresAt)}</span></p>
                      )}
                    </div>

                    {/* Contas de anúncios disponíveis */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1">
                        {needsAccount
                          ? <><AlertCircle className="h-3 w-3 text-amber-400" /><span className="text-amber-400">Selecione a conta de anúncios</span></>
                          : <><CheckCircle2 className="h-3 w-3 text-emerald-400" /><span className="text-emerald-400">Conta ativa</span></>
                        }
                      </p>

                      {loadingAccounts ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Buscando suas contas de anúncios...
                        </div>
                      ) : adAccounts && adAccounts.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {adAccounts.map((acc) => {
                            const isActive = metaStatus?.adAccountId === acc.id;
                            return (
                              <button
                                key={acc.id}
                                onClick={() => !isActive && handleSelectAccount(acc.id)}
                                disabled={isSelectingAccount || isActive}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                                  isActive
                                    ? "bg-emerald-500/10 border-emerald-500/40 cursor-default"
                                    : "bg-white/5 border-white/10 hover:border-[#1877F2]/40 hover:bg-[#1877F2]/5"
                                }`}
                              >
                                <div>
                                  <p className="text-sm font-medium text-white">{acc.name}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{acc.id} · {acc.currency}</p>
                                </div>
                                {isActive
                                  ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                  : <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90 shrink-0" />
                                }
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 space-y-1">
                          <p className="font-bold">Nenhuma conta encontrada</p>
                          <p className="text-white/60">Verifique se você tem acesso a contas de anúncios no Business Manager desta conta Meta.</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                      className="flex items-center gap-2 text-xs text-red-400/70 hover:text-red-400 transition-colors"
                    >
                      {isDisconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
                      Desconectar Meta Ads
                    </button>
                  </div>
                )}

                {/* Botão conectar */}
                {(!isConnected || isExpired) && (
                  <div className="space-y-3">
                    {isExpired && (
                      <p className="text-xs text-amber-400">
                        Seu token expirou. Reconecte para continuar importando dados automaticamente.
                      </p>
                    )}
                    {!isConnected && !isExpired && (
                      <p className="text-xs text-muted-foreground">
                        Conecte esta empresa ao Meta Ads para importar métricas automaticamente ao criar relatórios.
                        Serão solicitadas as permissões <code className="text-[#1877F2]">ads_read</code> e{" "}
                        <code className="text-[#1877F2]">read_insights</code>.
                      </p>
                    )}
                    <Button
                      onClick={handleConnectMeta}
                      className="w-full rounded-xl bg-[#1877F2] hover:bg-[#1466d8] text-white font-bold py-5"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {isExpired ? "Reconectar com Meta" : "Conectar com Meta"}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isEditingCompany ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-primary/5 border border-primary/20 -mx-2"
          >
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-5 flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              Editar Informações
            </h4>
            <CompanyForm
              company={company}
              onSuccess={() => {
                setIsEditingCompany(false);
                onUpdate();
              }}
              onCancel={() => setIsEditingCompany(false)}
            />
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm px-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BarChart2 className="h-4 w-4" />
                <span>{reports?.length ?? 0} Relatório{(reports?.length ?? 0) !== 1 ? "s" : ""}</span>
              </div>
              {isConnected && metaStatus?.adAccountId && (
                <span className="text-xs text-emerald-400 font-mono truncate max-w-[120px]" title={metaStatus.adAccountId}>
                  {metaStatus.adAccountId}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setShowReports(!showReports)}
                variant="outline"
                className={`w-full rounded-xl border-white/5 hover:bg-white/5 font-medium transition-all ${showReports ? "bg-primary/10 border-primary/30 text-primary" : ""}`}
              >
                {showReports ? "Fechar" : "Ver Lista"}
              </Button>
              <Button
                onClick={() => setShowReportForm(!showReportForm)}
                className="w-full rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo
              </Button>
            </div>

            <AnimatePresence>
              {showReportForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 -mx-2">
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-5">Novo Relatório</h4>
                    <ReportForm
                      companyId={company.id}
                      metaConnected={!!metaStatus?.connected && !metaStatus?.expired}
                      metaHasAccount={!!metaStatus?.hasAdAccount}
                      onSuccess={() => {
                        setShowReportForm(false);
                        setShowReports(true);
                      }}
                      onCancel={() => setShowReportForm(false)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showReports && !showReportForm && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="pt-2">
                    <ReportList
                      reports={reports || []}
                      companyId={company.id}
                      onEditReport={(report) => setEditingReport(report)}
                      onUpdate={() => onUpdate()}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        <EditReportModal
          report={editingReport}
          onClose={() => setEditingReport(null)}
          onSuccess={() => {
            setEditingReport(null);
            onUpdate();
          }}
        />
      </CardContent>
    </Card>
  );
}
