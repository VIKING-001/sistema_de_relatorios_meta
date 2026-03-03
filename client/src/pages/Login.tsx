import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Login() {
  const loginUrl = getLoginUrl();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-orange-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Meta Reports
          </h1>
          <p className="text-xl text-cyan-200 font-light">
            Gerenciamento profissional de campanhas
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo</h2>
              <p className="text-gray-300 text-sm">
                Faça login para acessar seu dashboard e gerenciar seus relatórios de campanhas Meta
              </p>
            </div>

            <div className="pt-4">
              <a href={loginUrl} className="w-full">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-lg py-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Loader2 className="mr-2 h-5 w-5" />
                  Fazer Login com Manus
                </Button>
              </a>
            </div>

            <div className="pt-4 border-t border-white/20">
              <p className="text-xs text-gray-400 text-center">
                Ao fazer login, você concorda com nossos Termos de Serviço
              </p>
            </div>
          </div>
        </div>

        {/* Features preview */}
        <div className="mt-12 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <span className="text-cyan-300 font-bold">📊</span>
            </div>
            <p className="text-sm text-gray-300">Dashboard</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <span className="text-orange-300 font-bold">🔗</span>
            </div>
            <p className="text-sm text-gray-300">Links Exclusivos</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <span className="text-cyan-300 font-bold">📈</span>
            </div>
            <p className="text-sm text-gray-300">Métricas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
