import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Settings, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import CompanyForm from "@/components/CompanyForm";
import CompanyList from "@/components/CompanyList";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [, setLocation] = useLocation();

  const { data: companies, isLoading, refetch } = trpc.company.list.useQuery();

  const handleLogout = async () => {
    await trpc.auth.logout.useMutation().mutateAsync();
    logout();
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-orange-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-orange-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Meta Reports</h1>
            <p className="text-sm text-cyan-300">Bem-vindo, {user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Empresas</h2>
            <p className="text-gray-400">Gerencie suas empresas e relatórios de campanhas</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Empresa
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-8 bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Criar Nova Empresa</CardTitle>
              <CardDescription className="text-gray-400">
                Adicione uma nova empresa para gerenciar seus relatórios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanyForm
                onSuccess={() => {
                  setShowForm(false);
                  refetch();
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Companies List */}
        {companies && companies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <CompanyList
                key={company.id}
                company={company}
                onUpdate={() => refetch()}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-12 text-center">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Nenhuma empresa criada</h3>
              <p className="text-gray-400 mb-6">
                Comece criando sua primeira empresa para gerenciar relatórios
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Empresa
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
