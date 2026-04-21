import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Copy, Link2, TrendingUp, DollarSign, Zap,
  BarChart3, Target, Eye, MousePointerClick, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const fmt = (n: number) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n >= 1_000 ? (n / 1_000).toFixed(1) + "K" : n.toLocaleString("pt-BR");
const fmtR = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

export default function Rastreamento() {
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    baseUrl: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmContent: "",
    utmTerm: "",
  });

  const { data: companies } = trpc.company.list.useQuery();
  const { data: trackingLinks = [], isLoading } = trpc.utm.list.useQuery(
    { companyId: companyId || 0 },
    { enabled: !!companyId }
  );
  const { data: stats } = trpc.utm.getStats.useQuery(
    { companyId: companyId || 0 },
    { enabled: !!companyId }
  );
  const { data: roasComparison } = trpc.utm.getRoasComparison.useQuery(
    { companyId: companyId || 0 },
    { enabled: !!companyId }
  );

  const createMutation = trpc.utm.create.useMutation();

  const handleCreateLink = async () => {
    if (!companyId || !formData.baseUrl || !formData.utmCampaign) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createMutation.mutateAsync({
        companyId,
        baseUrl: formData.baseUrl,
        utmSource: formData.utmSource || undefined,
        utmMedium: formData.utmMedium || undefined,
        utmCampaign: formData.utmCampaign,
        utmContent: formData.utmContent || undefined,
        utmTerm: formData.utmTerm || undefined,
      });

      toast.success("Link de rastreamento criado!");
      setFormData({ baseUrl: "", utmSource: "", utmMedium: "", utmCampaign: "", utmContent: "", utmTerm: "" });
      setShowForm(false);
    } catch (err) {
      toast.error("Erro ao criar link");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">🎯 Rastreamento de UTMs</h1>
          <p className="text-sm text-white/40 mt-1">Crie links com rastreamento exato de vendas</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Link
        </Button>
      </div>

      {/* Seleção de empresa */}
      <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
        <CardContent className="p-4">
          <label className="text-xs font-bold text-white/60 mb-2 block">Selecione a empresa</label>
          <Select value={companyId?.toString() || ""} onValueChange={(value) => setCompanyId(value ? parseInt(value) : null)}>
            <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Escolha uma empresa..." />
            </SelectTrigger>
            <SelectContent className="bg-background border-white/10">
              {companies?.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()} className="text-white">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {companyId && (
        <>
          {/* Formulário de criação */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-yellow-500/20 bg-yellow-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Criar novo link de rastreamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-white/60 mb-1 block">URL Base *</label>
                        <input
                          type="url"
                          placeholder="https://seu-site.com/produto"
                          value={formData.baseUrl}
                          onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-yellow-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/60 mb-1 block">utm_campaign *</label>
                        <input
                          placeholder="ex: black_friday_2024"
                          value={formData.utmCampaign}
                          onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-yellow-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/60 mb-1 block">utm_source</label>
                        <input
                          placeholder="ex: facebook"
                          value={formData.utmSource}
                          onChange={(e) => setFormData({ ...formData, utmSource: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-yellow-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/60 mb-1 block">utm_medium</label>
                        <input
                          placeholder="ex: cpc"
                          value={formData.utmMedium}
                          onChange={(e) => setFormData({ ...formData, utmMedium: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-yellow-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/60 mb-1 block">utm_content</label>
                        <input
                          placeholder="ex: anuncio_heroi"
                          value={formData.utmContent}
                          onChange={(e) => setFormData({ ...formData, utmContent: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-yellow-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/60 mb-1 block">utm_term</label>
                        <input
                          placeholder="ex: calça_preta"
                          value={formData.utmTerm}
                          onChange={(e) => setFormData({ ...formData, utmTerm: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-yellow-500/50"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleCreateLink} disabled={createMutation.isPending} className="gap-2">
                        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        Criar Link
                      </Button>
                      <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Estatísticas ROAS */}
          {roasComparison && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
                <CardContent className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Gasto Meta</p>
                  <p className="text-2xl font-black text-yellow-400">{fmtR(roasComparison.metaSpent)}</p>
                </CardContent>
              </Card>
              <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
                <CardContent className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Faturado (UTM)</p>
                  <p className="text-2xl font-black text-emerald-400">{fmtR(roasComparison.utmRevenue)}</p>
                </CardContent>
              </Card>
              <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
                <CardContent className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">ROAS Real</p>
                  <p className="text-2xl font-black text-blue-400">{roasComparison.roasFromUTM.toFixed(2)}x</p>
                </CardContent>
              </Card>
              <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
                <CardContent className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Diferença</p>
                  <p className={`text-2xl font-black ${roasComparison.difference > "0" ? "text-emerald-400" : "text-red-400"}`}>
                    {roasComparison.difference > "0" ? "+" : ""}{fmtR(parseFloat(roasComparison.difference))}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lista de links */}
          <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5 text-yellow-400" />
                Links de Rastreamento ({trackingLinks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-white/30" /></div>
              ) : trackingLinks.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-8">Nenhum link criado ainda</p>
              ) : (
                trackingLinks.map((link: any) => (
                  <div key={link.id} className="border border-white/6 rounded-xl p-3.5 hover:border-white/10 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-yellow-400 truncate">{link.utmCampaign}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{link.utmSource} • {link.utmMedium || "—"}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(link.trackingUrl)}
                        className="h-7 px-2 text-white/50 hover:text-white"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-white/40 truncate mb-2 font-mono">{link.trackingUrl}</p>
                    <div className="flex gap-3 text-[10px]">
                      <span className="flex items-center gap-1 text-blue-400">
                        <Eye className="h-3 w-3" /> {fmt(link.clickCount)} cliques
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <TrendingUp className="h-3 w-3" /> {fmt(link.conversionCount)} conversões
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Análise por campanha */}
          {stats?.byUTM && stats.byUTM.length > 0 && (
            <Card className="border-white/8" style={{ background: "linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(11,15,25,0.5) 100%)" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
                  Análise por Campanha
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] sm:text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 px-2 font-bold text-white/60">Campanha</th>
                        <th className="text-right py-2 px-2 font-bold text-white/60">Vendas</th>
                        <th className="text-right py-2 px-2 font-bold text-white/60">Faturamento</th>
                        <th className="text-right py-2 px-2 font-bold text-white/60">Ticket Médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byUTM.map((row: any, i: number) => (
                        <tr key={i} className="border-b border-white/6 hover:bg-white/3 transition-colors">
                          <td className="py-2 px-2 font-medium text-white truncate">
                            {row.utm_campaign}
                            {row.utm_source && <span className="text-white/30"> • {row.utm_source}</span>}
                          </td>
                          <td className="text-right py-2 px-2 text-blue-400">{row.sales_count}</td>
                          <td className="text-right py-2 px-2 text-emerald-400 font-bold">{fmtR(parseFloat(row.revenue || "0"))}</td>
                          <td className="text-right py-2 px-2 text-yellow-400">{fmtR(parseFloat(row.avg_value || "0"))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
