import { Company } from "@shared/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Trash2, ChevronRight, Loader2 } from "lucide-react";
import ReportList from "./ReportList";
import ReportForm from "./ReportForm";
import { toast } from "sonner";

interface CompanyListProps {
  company: Company;
  onUpdate: () => void;
}

export default function CompanyList({ company, onUpdate }: CompanyListProps) {
  const [showReports, setShowReports] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  const { data: reports } = trpc.report.list.useQuery(
    { companyId: company.id },
    { enabled: showReports }
  );

  const deleteMutation = trpc.company.delete.useMutation();

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja deletar esta empresa?")) return;

    try {
      await deleteMutation.mutateAsync({ id: company.id });
      toast.success("Empresa deletada com sucesso!");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao deletar empresa");
    }
  };

  return (
    <>
      <Card className="bg-white/5 border-white/10 hover:border-cyan-500/50 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-white">{company.name}</CardTitle>
              {company.description && (
                <CardDescription className="text-gray-400 mt-1">
                  {company.description}
                </CardDescription>
              )}
            </div>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm text-gray-400">
            {reports?.length ?? 0} relatório(s)
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowReports(!showReports)}
              variant="outline"
              size="sm"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              <ChevronRight className={`h-4 w-4 mr-2 transition-transform ${showReports ? "rotate-90" : ""}`} />
              Ver Relatórios
            </Button>

            <Button
              onClick={() => setShowReportForm(!showReportForm)}
              size="sm"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo
            </Button>
          </div>

          {showReportForm && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <ReportForm
                companyId={company.id}
                onSuccess={() => {
                  setShowReportForm(false);
                  onUpdate();
                }}
              />
            </div>
          )}

          {showReports && reports && (
            <div className="mt-4 space-y-2">
              {reports.length > 0 ? (
                <ReportList reports={reports} companyId={company.id} onUpdate={onUpdate} />
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                  Nenhum relatório criado
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
