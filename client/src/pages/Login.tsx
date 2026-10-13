import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Lock,
  User,
  BarChart3,
  TrendingUp,
  Link,
} from "lucide-react";

type Mode = "login" | "register";

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Login realizado com sucesso!");
    },
    onError: err => {
      toast.error(err.message || "Erro ao fazer login");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Conta criada com sucesso!");
    },
    onError: err => {
      toast.error(err.message || "Erro ao criar conta");
    },
  });

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      loginMutation.mutate({ email, password });
    } else {
      registerMutation.mutate({ name, email, password });
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center overflow-y-auto bg-background px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-sm">
              <BarChart3
                className="h-6 w-6 text-primary-foreground"
                aria-hidden="true"
              />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
            Meta Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerenciamento profissional de campanhas
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-lg sm:p-7">
          {/* Tabs */}
          <div className="mb-6 flex rounded-lg border border-border bg-secondary p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`min-h-10 flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                mode === "login"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={mode === "login"}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`min-h-10 flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                mode === "register"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={mode === "register"}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-foreground"
                >
                  Nome completo
                </Label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Seu nome"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    minLength={2}
                    className="h-11 border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-11 border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Senha
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  placeholder={
                    mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"
                  }
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="min-h-11 w-full font-semibold transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Aguarde...
                </>
              ) : mode === "login" ? (
                "Entrar no Dashboard"
              ) : (
                "Criar minha conta"
              )}
            </Button>
          </form>
        </div>

        {/* Features */}
        <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-4">
          {[
            {
              icon: <BarChart3 className="h-4 w-4 text-primary" />,
              label: "Dashboard",
            },
            {
              icon: <Link className="h-4 w-4 text-primary" />,
              label: "Links exclusivos",
            },
            {
              icon: <TrendingUp className="h-4 w-4 text-primary" />,
              label: "Métricas",
            },
          ].map(f => (
            <div
              key={f.label}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
                {f.icon}
              </div>
              <p className="text-xs text-muted-foreground">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
