import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export interface MetaSyncButtonProps {
  companyId: number;
  onSuccess?: () => void;
}

export function MetaSyncButton({ companyId, onSuccess }: MetaSyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Mutations
  const syncCampaignsMut = trpc.metaSync.syncCampaigns.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      onSuccess?.();
      setIsLoading(false);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao sincronizar campanhas");
      setIsLoading(false);
    },
  });

  const handleSyncCampaigns = async () => {
    setIsLoading(true);
    await syncCampaignsMut.mutateAsync({ companyId });
  };

  return (
    <Button
      onClick={handleSyncCampaigns}
      disabled={isLoading || syncCampaignsMut.isPending}
      size="sm"
      className="rounded-lg gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Sincronizando..." : "Sincronizar do Meta"}
    </Button>
  );
}

export function MetaSyncMetricsButton({ companyId, onSuccess }: MetaSyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const syncMetricsMut = trpc.metaSync.syncMetrics.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      onSuccess?.();
      setIsLoading(false);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao sincronizar métricas");
      setIsLoading(false);
    },
  });

  const handleSyncMetrics = async () => {
    setIsLoading(true);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Últimos 30 dias

    const fmt = (d: Date) => d.toISOString().split("T")[0];

    await syncMetricsMut.mutateAsync({
      companyId,
      startDate: fmt(startDate),
      endDate: fmt(endDate),
    });
  };

  return (
    <Button
      onClick={handleSyncMetrics}
      disabled={isLoading || syncMetricsMut.isPending}
      size="sm"
      variant="outline"
      className="rounded-lg gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Sincronizando..." : "Atualizar Métricas"}
    </Button>
  );
}

export function MetaSyncSection({ companyId }: { companyId: number }) {
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleSyncComplete = () => {
    setLastSync(new Date().toLocaleString("pt-BR"));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Sincronizar Campanhas</h3>
        <p className="text-xs text-white/60">
          Puxe campanhas, adsets e anúncios do Meta Ads diretamente para o sistema
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <MetaSyncButton companyId={companyId} onSuccess={handleSyncComplete} />
        <MetaSyncMetricsButton companyId={companyId} onSuccess={handleSyncComplete} />
      </div>

      {lastSync && (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Última sincronização: {lastSync}
        </div>
      )}
    </div>
  );
}
