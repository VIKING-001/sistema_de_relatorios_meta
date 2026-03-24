import { Report } from "@shared/types";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Copy, Trash2, Eye, Loader2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

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
    if (!confirm("Tem certeza que deseja deletar este relatório?")) return;

    try {
      await deleteMutation.mutateAsync({ id: reportId });
      toast.success("Relatório deletado com sucesso!");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao deletar relatório");
    }
  };

  const handlePublish = async (reportId: number, slug: string) => {
    setPublishingId(reportId);
    try {
      await publishMutation.mutateAsync({ id: reportId });
      const publicUrl = `${window.location.origin}/report/${slug}`;
      navigator.clipboard.writeText(publicUrl);
      toast.success("Relatório publicado! Link copiado para a área de transferência");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao publicar relatório");
    } finally {
      setPublishingId(null);
    }
  };

  const handleCopyLink = (slug: string) => {
    const publicUrl = `${window.location.origin}/report/${slug}`;
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copiado para a área de transferência!");
  };

  return (
    <div className="space-y-2">
      {reports.map((report) => (
        <div
          key={report.id}
          className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between hover:border-cyan-500/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{report.title}</p>
            <p className="text-xs text-gray-400">
              {new Date(report.startDate).toLocaleDateString("pt-BR")} a{" "}
              {new Date(report.endDate).toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {report.isPublished === "published" ? (
              <>
                <Button
                  onClick={() => handleCopyLink(report.slug)}
                  size="sm"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <a
                  href={`/report/${report.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-cyan-500/20 text-cyan-300 rounded hover:bg-cyan-500/30 transition-colors"
                >
                  <Eye className="h-3 w-3" />
                </a>
              </>
            ) : (
              <Button
                onClick={() => handlePublish(report.id, report.slug)}
                disabled={publishingId === report.id}
                size="sm"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs"
              >
                {publishingId === report.id && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Publicar
              </Button>
            )}

            {report.isPublished === "published" && (
              <Button
                onClick={() => onEditReport?.(report)}
                size="sm"
                variant="outline"
                className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}

            <Button
              onClick={() => handleDelete(report.id)}
              disabled={deleteMutation.isPending}
              size="sm"
              variant="outline"
              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
