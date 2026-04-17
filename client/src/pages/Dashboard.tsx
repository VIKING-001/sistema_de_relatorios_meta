import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Settings, LogOut, Loader2, Building2, BarChart3, Users, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import CompanyForm from "@/components/CompanyForm";
import CompanyList from "@/components/CompanyList";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [, setLocation] = useLocation();

  const { data: companies, isLoading, refetch } = trpc.company.list.useQuery();
  const [autoOpenMetaCompanyId, setAutoOpenMetaCompanyId] = useState<number | null>(null);

  // Detecta retorno do OAuth do Meta e mostra feedback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const metaConnected = params.get("meta_connected");
    const metaError = params.get("meta_error");
    const companyId = params.get("companyId");
    const accounts = params.get("accounts");

    if (metaConnected) {
      let adAccountCount = 0;
      if (accounts) {
        try {
          const list = JSON.parse(decodeURIComponent(accounts));
          adAccountCount = list.length;
        } catch {}
      }

      const msg = adAccountCount > 1
        ? `Meta conectado! Selecione qual conta de anúncios usar no painel ⚡ abaixo.`
        : adAccountCount === 1
        ? `Meta conectado! Conta de anúncios vinculada automaticamente.`
        : `Meta conectado! Abra o painel ⚡ para configurar a conta de anúncios.`;

      toast.success(msg, { duration: 6000 });
      refetch();

      // Abre automaticamente o painel Meta da empresa que acabou de conectar
      if (companyId) setAutoOpenMetaCompanyId(Number(companyId));

      window.history.replaceState({}, "", "/");
    }

    if (metaError) {
      toast.error("Erro ao conectar Meta Ads: " + decodeURIComponent(metaError), { duration: 8000 });
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const handleLogout = async () => {
    await trpc.auth.logout.useMutation().mutateAsync();
    logout();
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-cyan-500/20 animate-pulse rounded-full" />
            <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">Carregando seus dados...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar-like layout wrapper */}
      <div className="flex min-h-screen">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="glass sticky top-0 z-50 px-8 py-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center glow-blue">
                <BarChart3 className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  Meta Reports
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Viking Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold">{user?.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{user?.role || 'Usuário'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all border border-destructive/20 group"
                title="Sair do sistema"
              >
                <LogOut className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-10 space-y-10">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Empresas Ativas', value: companies?.length || 0, icon: Building2, color: 'text-blue-400' },
                { label: 'Relatórios Criados', value: companies?.reduce((acc, c) => acc + ( (c as any).reports?.length || 0), 0) || 0, icon: BarChart3, color: 'text-cyan-400' },
                { label: 'Destaque Mensal', value: '+12%', icon: Zap, color: 'text-yellow-400' },
                { label: 'Novos Leads', value: '421', icon: Users, color: 'text-emerald-400' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass-card overflow-hidden group hover:border-primary/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${stat.color} group-hover:scale-110 transition-transform`}>
                          <stat.icon className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold font-display">Suas Empresas</h2>
                <p className="text-muted-foreground">Gerencie o portfólio de clientes e relatórios estratégicos</p>
              </div>
              <Button
                onClick={() => setShowForm(!showForm)}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-6 rounded-2xl font-bold glow-blue transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nova Empresa
              </Button>
            </div>

            {/* Form Section */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Card className="glass-card mb-10 border-primary/20 bg-primary/5">
                    <CardHeader className="border-b border-white/5">
                      <CardTitle className="text-xl">Adicionar Nova Empresa</CardTitle>
                      <CardDescription>Defina os dados estruturais do seu novo cliente</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                      <CompanyForm
                        onSuccess={() => {
                          setShowForm(false);
                          refetch();
                        }}
                        onCancel={() => setShowForm(false)}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {companies && companies.length > 0 ? (
                companies.map((company, i) => (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <CompanyList
                      company={company}
                      onUpdate={() => refetch()}
                      autoOpenMeta={autoOpenMetaCompanyId === company.id}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center text-center max-w-sm mx-auto"
                  >
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Sem empresas registradas</h3>
                    <p className="text-muted-foreground mb-8">
                      Comece agora criando o perfil da primeira empresa para gerar relatórios profissionais.
                    </p>
                    <Button
                      onClick={() => setShowForm(true)}
                      variant="outline"
                      className="rounded-full px-8 py-6 border-primary/20 hover:border-primary/50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Empresa
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <footer className="py-12 border-t border-white/5 text-center px-8">
        <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium opacity-50">
          © 2026 Meta Reports Viking • Construído para Profissionais
        </p>
      </footer>
    </div>
  );
}
