import { Report } from "@shared/types";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Copy, Trash2, Globe, Loader2, Edit2, X, Clock, CheckCircle2, Calendar, Brain } from "lucide-react";
import { displayDate } from "@shared/dateParser";
import { toast } from "sonner";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StrategicPanel from "./StrategicPanel";

interface ReportListProps {
  reports: Report[];
  companyId: number;
  onUpdate: () => void;
  onEditReport?: (report: Report) => void;
}

// Extrai métricas do report (pode vir como array ou objeto único)
function extractMetrics(report: any) {
  const raw = Array.isArray(report.metrics) ? report.metrics[0] : report.metrics;
  if (!raw) return null;
  return {
    ctr:                    parseFloat(raw.ctr ?? "0"),
    cpm:                    parseFloat(raw.cpm ?? "0"),
    totalReach:             Number(raw.totalReach ?? 0),
    totalImpressions:       Number(raw.totalImpressions ?? 0),
    totalSpent:             parseFloat(raw.totalSpent ?? "0"),
    totalClicks:            Number(raw.totalClicks ?? 0),
    costPerClick:           parseFloat(raw.costPerClick ?? "0"),
    videoRetentionRate:     parseFloat(raw.videoRetentionRate ?? "0"),
    newInstagramFollowers:  Number(raw.newInstagramFollowers ?? 0),
    messagesInitiated:      Number(raw.messagesInitiated ?? 0),
    instagramProfileVisits: Number(raw.instagramProfileVisits ?? 0),
    costPerProfileVisit:    parseFloat(raw.costPerProfileVisit ?? "0"),
    purchases:              Number(raw.purchases ?? 0),
    purchaseValue:          parseFloat(raw.purchaseValue ?? "0"),
    costPerPurchase:        parseFloat(raw.costPerPurchase ?? "0"),
    costPerMessage:         parseFloat(raw.costPerMessage ?? "0"),
  };
}

export default function ReportList({ reports, companyId, onUpdate, onEditReport }: ReportListProps) {
  const [publishingId, setPublishingId]       = useState<number | null>(null);
  const [openDiagnosisId, setOpenDiagnosisId] = useState<number | null>(null);

  const deleteMutation  = trpc.report.delete.useMutation();
  const publishMutation = trpc.report.publish.useMutation();

  const handleDelete = async (reportId: number) => {
    if (!confirm("Deseja realmente excluir este relatório?")) return;
    try {
      await deleteMutation.mutateAsync({ id: reportId });
      toast.success("Relatório removido com sucesso");
      if (openDiagnosisId === reportId) setOpenDiagnosisId(null);
      onUpdate();
    } catch {
      toast.error("Erro ao remover relatório");
    }
  };

  const handlePublish = async (reportId: number, slug: string) => {
    setPublishingId(reportId);
    try {
      await publishMutation.mutateAsync({ id: reportId });
      const publicUrl = `${window.location.origin}/report/${slug}`;
      navigator.clipboard.writeText(publicUrl);
      toast.success("Publicado! Link copiado.");
      onUpdate();
    } catch {
      toast.error("Erro ao publicar");
    } finally {
      setPublishingId(null);
    }
  };

  const handleCopyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/report/${slug}`);
    toast.success("Link copiado!");
  };

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {reports.map((report, index) => {
          const metrics    = extractMetrics(report);
          const isDiagOpen = openDiagnosisId === report.id;

          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all duration-200 overflow-hidden"
            >
              {/* ── Linha do relatório ── */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <span className="text-white font-semibold truncate text-sm">{report.title}</span>
                    {report.isPublished === "published" ? (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20 shrink-0">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Ativo
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20 shrink-0">
                        <Clock className="h-2.5 w-2.5" /> Rascunho
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3 opacity-40" />
                    {displayDate(report.startDate)}
                    <span className="opacity-30">→</span>
                    {displayDate(report.endDate)}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  {/* Botão Diagnóstico Estratégico */}
                  {metrics && (
                    <button
                      onClick={() => setOpenDiagnosisId(isDiagOpen ? null : report.id)}
                      title="Diagnóstico Estratégico (só para você)"
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        isDiagOpen
                          ? "bg-primary/20 border-primary/40 text-primary"
                          : "bg-white/5 border-white/10 text-white/50 hover:text-primary hover:bg-primary/10 hover:border-primary/30"
                      }`}
                    >
                      <Brain className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Diagnóstico</span>
                    </button>
                  )}

                  {/* Publicar / Link */}
                  {report.isPublished === "published" ? (
                    <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
                      <button
                        onClick={() => handleCopyLink(report.slug)}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                        title="Copiar Link"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <a
                        href={`/report/${report.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                        title="Ver relatório público"
                      >
                        <Globe className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handlePublish(report.id, report.slug)}
                      disabled={publishingId === report.id}
                      size="sm"
                      className="h-8 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs"
                    >
                      {publishingId === report.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : "Publicar"}
                    </Button>
                  )}

                  {/* Edit + Delete */}
                  <div className="flex items-center gap-0.5 pl-2 border-l border-white/5">
                    <button
                      onClick={() => onEditReport?.(report)}
                      className="p-1.5 rounded-lg hover:bg-blue-500/10 text-muted-foreground hover:text-blue-400 transition-all"
                      title="Editar"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Painel Estratégico (expansível) ── */}
              <AnimatePresence>
                {isDiagOpen && metrics && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/5 px-4 pb-4">
                      <StrategicPanel metrics={metrics} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {reports.length === 0 && (
        <div className="text-center py-12 rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
          <Clock className="h-10 w-10 text-white/10 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm font-medium">Nenhum relatório encontrado</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Crie o primeiro relatório de performance</p>
        </div>
      )}
    </div>
  );
}
