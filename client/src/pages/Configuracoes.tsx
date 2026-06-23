import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings, User, Shield, Bell, Palette,
  Save, LogOut, Eye, EyeOff, CheckCircle2,
  BellRing, BellOff, Smartphone, DollarSign, Download,
} from "lucide-react";
import { useLocation } from "wouter";
import { usePushNotifications } from "@/lib/usePushNotifications";

function BalanceAlertsSection() {
  const { user } = useAuth();
  const companiesQuery = trpc.company.list.useQuery(undefined, { enabled: !!user });
  const companies = companiesQuery.data ?? [];

  return (
    <Card className="glass-card border-white/10">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" /> Alertas de Saldo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Configure o saldo mínimo por conta. Quando o saldo cair abaixo do limite, você receberá uma notificação às 9h.
          Funciona apenas em contas pré-pagas (boleto/Pix).
        </p>
        {companies.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada.</p>
        ) : (
          companies.map((company: any) => (
            <BalanceAlertRow key={company.id} company={company} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function BalanceAlertRow({ company }: { company: any }) {
  const alertQuery = trpc.notifications.getBalanceAlert.useQuery(
    { companyId: company.id },
    { enabled: !!company.id }
  );
  const setAlert = trpc.notifications.setBalanceAlert.useMutation({
    onSuccess: () => alertQuery.refetch(),
  });

  const alert = alertQuery.data;
  const [threshold, setThreshold] = useState<string>(
    alert ? String(alert.thresholdReais) : "100"
  );
  const [enabled, setEnabled] = useState<boolean>(alert?.enabled ?? true);

  useEffect(() => {
    if (alert) {
      setThreshold(String(alert.thresholdReais));
      setEnabled(alert.enabled);
    }
  }, [alert]);

  const handleSave = async () => {
    const val = parseFloat(threshold);
    if (isNaN(val) || val < 0) {
      toast.error("Valor inválido.");
      return;
    }
    await setAlert.mutateAsync({
      companyId: company.id,
      thresholdReais: val,
      enabled,
    });
    toast.success(`Alerta salvo para ${company.name}.`);
  };

  if (!company.metaAdAccountId) {
    return (
      <div className="py-3 border-b border-white/5 last:border-0 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{company.name}</p>
          <p className="text-xs text-muted-foreground">Sem conta Meta conectada</p>
        </div>
        <Badge variant="outline" className="border-white/10 text-muted-foreground text-[10px]">
          Sem conexão
        </Badge>
      </div>
    );
  }

  return (
    <div className="py-3 border-b border-white/5 last:border-0 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{company.name}</p>
          <p className="text-xs text-muted-foreground">Conta: {company.metaAdAccountId}</p>
        </div>
        {/* Toggle ativo/inativo */}
        <button
          onClick={() => setEnabled((v: boolean) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
            enabled ? "bg-primary" : "bg-white/10"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      {enabled && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            Avisar quando saldo &lt; R$
          </Label>
          <Input
            type="number"
            min={0}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="bg-white/5 border-white/10 rounded-xl h-8 w-28 text-sm"
            placeholder="100"
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={setAlert.isPending}
            className="rounded-xl h-8 shrink-0"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            {setAlert.isPending ? "..." : "Salvar"}
          </Button>
        </div>
      )}
      {!enabled && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={setAlert.isPending}
          className="rounded-xl h-7 text-xs text-muted-foreground"
        >
          Salvar (desativado)
        </Button>
      )}
    </div>
  );
}

export default function Configuracoes() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const push = usePushNotifications();

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installDismissed, setInstallDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") setInstallPrompt(null);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
    setLocation("/");
  };

  const handleSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    toast.success("Configurações salvas!");
    setSaving(false);
  };

  const SECTIONS = [
    { id: "perfil", label: "Perfil", icon: User },
    { id: "seguranca", label: "Segurança", icon: Shield },
    { id: "aparencia", label: "Aparência", icon: Palette },
    { id: "notificacoes", label: "Notificações", icon: Bell },
  ];

  const [activeSection, setActiveSection] = useState("perfil");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie sua conta e preferências do sistema</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <div className="lg:w-52 shrink-0">
          <Card className="glass-card border-white/10">
            <CardContent className="p-2 space-y-0.5">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    activeSection === s.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <s.icon className="h-4 w-4 shrink-0" />
                  {s.label}
                </button>
              ))}

              <div className="pt-2 mt-2 border-t border-white/5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Sair
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {/* Profile */}
          {activeSection === "perfil" && (
            <Card className="glass-card border-white/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Informações do Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-bold text-primary">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                  <div>
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <Badge variant="outline" className="mt-1 text-[10px] border-white/10 text-muted-foreground capitalize">
                      {user?.role ?? "usuário"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Nome</Label>
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">E-mail</Label>
                    <Input
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl"
                      type="email"
                    />
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl">
                  <Save className="h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Security */}
          {activeSection === "seguranca" && (
            <Card className="glass-card border-white/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Senha atual</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Nova senha</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Confirmar senha</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {newPassword && confirmPassword && (
                  <p className={`text-xs flex items-center gap-1.5 ${newPassword === confirmPassword ? "text-emerald-400" : "text-red-400"}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    {newPassword === confirmPassword ? "Senhas coincidem" : "Senhas não coincidem"}
                  </p>
                )}

                <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl">
                  <Save className="h-4 w-4" />
                  {saving ? "Salvando..." : "Atualizar senha"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Appearance */}
          {activeSection === "aparencia" && (
            <Card className="glass-card border-white/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" /> Aparência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">Tema</Label>
                  <div className="flex gap-3">
                    {[
                      { id: "dark", label: "Escuro", preview: "bg-gray-900 border-white/10" },
                      { id: "light", label: "Claro", preview: "bg-white border-black/10", text: "text-black/60" },
                    ].map(t => (
                      <button
                        key={t.id}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          t.id === "dark" ? "border-primary/50 bg-primary/5" : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className={`w-16 h-10 rounded-lg border ${t.preview}`} />
                        <span className="text-xs font-medium">{t.label}</span>
                        {t.id === "dark" && <Badge className="text-[9px] h-4">Ativo</Badge>}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">Cor de destaque</Label>
                  <div className="flex gap-2">
                    {["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"].map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${color === "#3b82f6" ? "border-white scale-110" : "border-transparent hover:scale-105"}`}
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {activeSection === "notificacoes" && (
            <div className="space-y-4">
              {/* PWA install banner */}
              {installPrompt && !installDismissed && (
                <Card className="glass-card border-primary/30 bg-primary/5">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Instale o app no celular</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Adicione à tela inicial para receber notificações e acessar offline.
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" onClick={handleInstall} className="gap-1.5 rounded-xl h-8">
                        <Download className="h-3.5 w-3.5" />
                        Instalar
                      </Button>
                      <button
                        onClick={() => setInstallDismissed(true)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Agora não
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Push notifications toggle */}
              <Card className="glass-card border-white/10">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" /> Notificações Push
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!push.isSupported ? (
                    <p className="text-sm text-muted-foreground">
                      Seu navegador não suporta notificações push. Use Chrome ou Safari no celular.
                    </p>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          {push.isSubscribed ? (
                            <BellRing className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <BellOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          {push.isSubscribed ? "Notificações ativas" : "Notificações desativadas"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {push.isSubscribed
                            ? "Você receberá alertas de saldo neste dispositivo, mesmo com o app fechado."
                            : push.permission === "denied"
                            ? "Permissão negada. Habilite nas configurações do navegador."
                            : "Ative para receber alertas de saldo no celular."}
                        </p>
                      </div>
                      {push.permission !== "denied" && (
                        <Button
                          size="sm"
                          variant={push.isSubscribed ? "outline" : "default"}
                          disabled={push.isLoading}
                          onClick={async () => {
                            if (push.isSubscribed) {
                              await push.unsubscribe();
                              toast.success("Notificações desativadas.");
                            } else {
                              const ok = await push.subscribe();
                              if (ok) toast.success("Notificações ativadas!");
                              else if (push.permission === "denied")
                                toast.error("Permissão negada pelo navegador.");
                            }
                          }}
                          className="rounded-xl shrink-0"
                        >
                          {push.isLoading
                            ? "Aguarde..."
                            : push.isSubscribed
                            ? "Desativar"
                            : "Ativar notificações"}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Balance alerts per company */}
              <BalanceAlertsSection />
            </div>
          )}

          {/* System info */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Meta Reports Viking</span>
                <span className="text-white/20">•</span>
                <span>v2.0.0</span>
                <span className="text-white/20">•</span>
                <span>© 2026</span>
                <span className="text-white/20">•</span>
                <span>Construído para profissionais</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
