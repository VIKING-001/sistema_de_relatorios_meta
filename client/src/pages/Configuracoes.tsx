import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings, User, Shield, Bell, Palette,
  Save, LogOut, Eye, EyeOff, CheckCircle2,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Configuracoes() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

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
            <Card className="glass-card border-white/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" /> Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Token Meta expirado", desc: "Avise quando um token de acesso Meta estiver prestes a expirar" },
                  { label: "Novo relatório criado", desc: "Notificação ao criar um novo relatório" },
                  { label: "Importação de dados concluída", desc: "Avise quando a importação do Meta Ads terminar" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 py-3 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      className="w-10 h-5 bg-primary/30 rounded-full relative shrink-0 mt-0.5"
                      onClick={() => toast.info("Em breve!")}
                    >
                      <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white/30 rounded-full transition-transform" />
                    </button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Notificações — em breve.</p>
              </CardContent>
            </Card>
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
