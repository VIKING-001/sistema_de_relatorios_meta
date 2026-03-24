import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Trash2, ChevronRight, Loader2, Edit2, Building2, BarChart2, MoreVertical } from "lucide-react";
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
}

export default function CompanyList({ company, onUpdate }: CompanyListProps) {
  const [showReports, setShowReports] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  const { data: reports } = trpc.report.list.useQuery(
    { companyId: company.id },
    { enabled: showReports }
  );

  const deleteMutation = trpc.company.delete.useMutation({
    onSuccess: () => {
      toast.success("Empresa removida com sucesso");
      onUpdate();
    },
    onError: (error) => {
      toast.error("Erro ao remover empresa: " + (error as any).message);
    }
  });

  const handleDelete = () => {
    if (confirm(`Deseja realmente remover a empresa ${company.name}? Isso apagará todos os seus relatórios.`)) {
      deleteMutation.mutate({ id: company.id });
    }
  };

  return (
    <Card className="glass-card group overflow-hidden border-white/10 hover:border-primary/30 transition-all duration-500">
      <CardHeader className="pb-4 relative overflow-hidden">
        {/* Decorative background element */}
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
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
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
                <span>{reports?.length ?? 0} Relatórios</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setShowReports(!showReports)}
                variant="outline"
                className={`w-full rounded-xl border-white/5 hover:bg-white/5 font-medium transition-all ${showReports ? 'bg-primary/10 border-primary/30 text-primary' : ''}`}
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
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 -mx-2">
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-5">Novo Relatório</h4>
                    <ReportForm
                      companyId={company.id}
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
