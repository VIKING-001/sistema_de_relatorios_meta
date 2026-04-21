import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import CompanyForm from "@/components/CompanyForm";
import CompanyList from "@/components/CompanyList";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function Relatorios() {
  const { data: companies, isLoading, refetch } = trpc.company.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [autoOpenMetaCompanyId, setAutoOpenMetaCompanyId] = useState<number | null>(null);
  const [expandedCompanyId, setExpandedCompanyId] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const metaConnected = params.get("meta_connected");
    const companyId = params.get("companyId");
    const metaError = params.get("meta_error");
    const accounts = params.get("accounts");

    if (metaConnected) {
      let adCount = 0;
      try { adCount = JSON.parse(decodeURIComponent(accounts || "[]")).length; } catch {}
      const msg = adCount > 1
        ? "Meta conectado! Selecione qual conta de anúncios usar abaixo."
        : adCount === 1 ? "Meta conectado! Conta vinculada automaticamente."
        : "Meta conectado! Configure a conta de anúncios no painel ⚡.";
      toast.success(msg, { duration: 6000 });
      if (companyId) setAutoOpenMetaCompanyId(Number(companyId));
      refetch();
      window.history.replaceState({}, "", "/relatorios");
    }
    if (metaError) {
      toast.error("Erro ao conectar Meta: " + decodeURIComponent(metaError), { duration: 8000 });
      window.history.replaceState({}, "", "/relatorios");
    }
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Relatórios</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Gerencie empresas e relatórios</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova </span>Empresa
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Nova Empresa</h3>
            <CompanyForm onSuccess={() => { setShowForm(false); refetch(); }} onCancel={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !companies?.length ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Nenhuma empresa cadastrada</p>
          <p className="text-sm mt-1">Clique em "Nova Empresa" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {companies.map((company) => (
            <CompanyList
              key={company.id}
              company={company}
              onUpdate={() => refetch()}
              autoOpenMeta={autoOpenMetaCompanyId === company.id}
              isExpanded={expandedCompanyId === company.id}
              onToggleExpanded={(isExpanded) => setExpandedCompanyId(isExpanded ? company.id : null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
