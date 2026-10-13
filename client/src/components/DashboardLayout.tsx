import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  BarChart3,
  Building2,
  Link2,
  LogOut,
  Megaphone,
  PanelLeft,
  Settings,
  ShoppingCart,
  User,
  Zap,
  Globe,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { trpc } from "@/lib/trpc";

const mainNav = [
  { icon: BarChart3, label: "Dashboard", path: "/" },
  { icon: Building2, label: "Relatórios", path: "/relatorios" },
  { icon: Megaphone, label: "Contas de Anúncio", path: "/contas" },
  { icon: Zap, label: "Campanhas", path: "/campanhas" },
  { icon: ShoppingCart, label: "Compras", path: "/compras" },
  { icon: MessageCircle, label: "Conversas", path: "/conversas" },
];

const toolsNav = [
  { icon: Link2, label: "Gerador de URL", path: "/gerador-url" },
  { icon: Globe, label: "Integrações", path: "/integracoes" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

const allNav = [...mainNav, ...toolsNav];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 180;
const MAX_WIDTH = 320;

function isPathActive(location: string, path: string) {
  return path === "/"
    ? location === "/"
    : location === path || location.startsWith(`${path}/`);
}

// ─── Mobile bottom navigation ────────────────────────────────────────────────
// 4 itens principais fixos na barra + botão "Mais" para todo o resto
const mobilePrimary = [
  { icon: BarChart3, label: "Dashboard", path: "/" },
  { icon: Building2, label: "Relatórios", path: "/relatorios" },
  { icon: Megaphone, label: "Contas", path: "/contas" },
  { icon: Zap, label: "Campanhas", path: "/campanhas" },
];

// Itens secundários acessíveis pelo menu "Mais" no celular
const mobileMore = [
  { icon: ShoppingCart, label: "Compras", path: "/compras" },
  { icon: MessageCircle, label: "Conversas", path: "/conversas" },
  { icon: Link2, label: "Gerador de URL", path: "/gerador-url" },
  { icon: Globe, label: "Integrações", path: "/integracoes" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

function MobileLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();
  const activeLabel =
    allNav.find(i => isPathActive(location, i.path))?.label ?? "Menu";

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
    setLocation("/");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <BarChart3 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">Meta Reports</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {activeLabel}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu da conta"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => setLocation("/configuracoes")}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" /> Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-x-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Navegação principal"
        className="safe-area-inset-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card"
      >
        <div className="flex h-[72px] items-center justify-around px-1">
          {mobilePrimary.map(({ icon: Icon, label, path }) => {
            const isActive = isPathActive(location, path);
            return (
              <button
                key={path}
                type="button"
                onClick={() => setLocation(path)}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="w-full truncate text-center text-[10px] font-medium leading-none">
                  {label}
                </span>
              </button>
            );
          })}

          {/* Botão "Mais" — abre menu com todas as outras telas */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  mobileMore.some(i => isPathActive(location, i.path))
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <MoreHorizontal
                  className="h-5 w-5 shrink-0"
                  aria-hidden="true"
                />
                <span className="w-full truncate text-center text-[10px] font-medium leading-none">
                  Mais
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-52 mb-2">
              {mobileMore.map(({ icon: Icon, label, path }) => (
                <DropdownMenuItem
                  key={path}
                  onClick={() => setLocation(path)}
                  className="cursor-pointer gap-2.5 py-2.5"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer gap-2.5 py-2.5 text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 shrink-0" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </div>
  );
}

// ─── Desktop sidebar layout ───────────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const { loading, user } = useAuth();

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
      const parsed = saved ? parseInt(saved, 10) : NaN;
      return isNaN(parsed) ? DEFAULT_WIDTH : parsed;
    } catch {
      return DEFAULT_WIDTH;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
    } catch {}
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return null;

  // Mobile: usa layout separado sem Radix Sheet
  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  // Desktop: usa Sidebar do Radix
  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DesktopSidebarContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DesktopSidebarContent>
    </SidebarProvider>
  );
}

function DesktopSidebarContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const w = e.clientX - left;
      if (w >= MIN_WIDTH && w <= MAX_WIDTH) setSidebarWidth(w);
    };
    const onUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
    setLocation("/");
  };

  const NavItem = ({ icon: Icon, label, path }: (typeof mainNav)[0]) => {
    const isActive = isPathActive(location, path);
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          onClick={() => setLocation(path)}
          tooltip={label}
          className="h-10 rounded-md font-normal data-[active=true]:bg-primary/10 data-[active=true]:font-semibold data-[active=true]:text-foreground"
        >
          <Icon
            className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`}
          />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-border">
          <SidebarHeader className="h-14 justify-center border-b border-border">
            <div className="flex items-center gap-3 px-2">
              <button
                type="button"
                aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
                onClick={toggleSidebar}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary">
                    <BarChart3 className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-sm tracking-tight truncate">
                    Meta Reports
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 pt-3">
            <SidebarGroup>
              <SidebarMenu className="gap-1 px-2">
                {mainNav.map(item => (
                  <NavItem key={item.path} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup className="mt-2">
              {!isCollapsed && (
                <SidebarGroupLabel className="px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ferramentas
                </SidebarGroupLabel>
              )}
              <SidebarMenu className="gap-1 px-2">
                {toolsNav.map(item => (
                  <NavItem key={item.path} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-border p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors w-full text-left">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate leading-none">
                        {user?.name ?? "-"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {user?.email ?? "-"}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setLocation("/configuracoes")}
                >
                  <User className="mr-2 h-4 w-4" /> Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {!isCollapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/30 transition-colors"
            style={{ zIndex: 50 }}
            onMouseDown={() => setIsResizing(true)}
          />
        )}
      </div>

      <SidebarInset>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </>
  );
}
