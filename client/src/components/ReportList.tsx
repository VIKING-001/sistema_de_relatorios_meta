import { Report } from "@shared/types";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Copy, Trash2, Eye, Loader2, Edit2, Share2, Globe, Clock, CheckCircle2, Calendar } from "lucide-react";
import { displayDate } from "@shared/dateParser";
import { toast } from "sonner";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ReportListProps {
  reports: Report[];
  companyId: number;
  onUpdate: () => void;
  onEditReport?: (report: Report) => void;
}

export default function ReportList({ reports, companyId, onUpdate, onEditReport }: ReportListProps) {
  const [publishingId, setPublishingId] = useState<number | null>(null);

  const deleteMutation = trpc.report.delete.useMutation();
  const publishMutation = trpc.report.publish.useMutation();

  const handleDelete = async (reportId: number) => {
    if (!confirm("Deseja realmente excluir este relatório?")) return;

    try {
      await deleteMutation.mutateAsync({ id: reportId });
      toast.success("Relatório removido com sucesso");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao remover relatório");
    }
  };

  const handlePublish = async (reportId: number, slug: string) => {
    setPublishingId(reportId);
    try {
      await publishMutation.mutateAsync({ id: reportId });
      const publicUrl = `${window.location.origin}/report/${slug}`;
      navigator.clipboard.writeText(publicUrl);
      toast.success("Publicado com sucesso! Link copiado.");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao publicar");
    } finally {
      setPublishingId(null);
    }
  };

  const handleCopyLink = (slug: string) => {
    const publicUrl = `${window.location.origin}/report/${slug}`;
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copiado para a área de transferência");
  };

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {reports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            className="group relative p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-primary/20 transition-all duration-300"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-white font-semibold truncate text-sm">
                    {report.title}
                  </span>
                  {report.isPublished === "published" ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Ativo
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                      <Clock className="h-2.5 w-2.5" />
                      Rascunho
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 opacity-50" />
                    {displayDate(report.startDate)}
                    <span className="mx-1 opacity-30">→</span>
                    {displayDate(report.endDate)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {report.isPublished === "published" ? (
                  <div className="flex items-center gap-1.5 bg-white/5 rounded-xl p-1 border border-white/5">
                    <button
                      onClick={() => handleCopyLink(report.slug)}
                      className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                      title="Copiar Link"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <a
                      href={`/report/${report.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                      title="Abrir Visualização"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <Button
                    onClick={() => handlePublish(report.id, report.slug)}
                    disabled={publishingId === report.id}
                    size="sm"
                    className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs"
                  >
                    {publishingId === report.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Publicar Agora"
                    )}
                  </Button>
                )}

                <div className="flex items-center gap-1 ml-1 pl-3 border-l border-white/5">
                  <button
                    onClick={() => onEditReport?.(report)}
                    className="p-2 rounded-lg hover:bg-blue-500/10 text-muted-foreground hover:text-blue-400 transition-all outline-none"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all outline-none"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {reports.length === 0 && (
        <div className="text-center py-12 rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
          <Clock className="h-10 w-10 text-white/10 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm font-medium">Nenhum relatório encontrado</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Comece criando um novo relatório de performance</p>
        </div>
      )}
    </div>
  );
}
