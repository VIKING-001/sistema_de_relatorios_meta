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
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { trpc } from "@/lib/trpc";

const mainNav = [
  { icon: BarChart3,    label: "Dashboard",        path: "/" },
  { icon: Building2,    label: "Relatórios",        path: "/relatorios" },
  { icon: Megaphone,    label: "Contas de Anúncio", path: "/contas" },
  { icon: Zap,          label: "Campanhas",          path: "/campanhas" },
  { icon: ShoppingCart, label: "Compras",            path: "/compras" },
];

const toolsNav = [
  { icon: Link2,    label: "Gerador de URL", path: "/gerador-url" },
  { icon: Globe,    label: "Integrações",    path: "/integracoes" },
  { icon: Settings, label: "Configurações",  path: "/configuracoes" },
];

const allNav = [...mainNav, ...toolsNav];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 180;
const MAX_WIDTH = 320;

// ─── Mobile bottom navigation ────────────────────────────────────────────────
// Usa apenas os 5 itens principais para não poluir a barra
const mobileNav = [
  { icon: BarChart3,    label: "Dashboard",  path: "/" },
  { icon: Building2,    label: "Relatórios", path: "/relatorios" },
  { icon: Megaphone,    label: "Contas",     path: "/contas" },
  { icon: Zap,          label: "Campanhas",  path: "/campanhas" },
  { icon: Settings,     label: "Config",     path: "/configuracoes" },
];

function MobileLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();
  const activeLabel = allNav.find(i => i.path === location)?.label ?? "Menu";

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
    setLocation("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between h-12 px-4 bg-background/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
            <BarChart3 className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">Meta Reports</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{activeLabel}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setLocation("/configuracoes")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" /> Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-20 overflow-x-hidden">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-white/5 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {mobileNav.map(({ icon: Icon, label, path }) => {
            const isActive = location === path || (path !== "/" && location.startsWith(path));
            return (
              <button
                key={path}
                onClick={() => setLocation(path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-0 flex-1 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                <span className="text-[9px] font-medium truncate w-full text-center">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ─── Desktop sidebar layout ───────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
    try { localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()); } catch {}
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return null;

  // Mobile: usa layout separado sem Radix Sheet
  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  // Desktop: usa Sidebar do Radix
  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
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

  const NavItem = ({ icon: Icon, label, path }: typeof mainNav[0]) => {
    const isActive = location === path || (path !== "/" && location.startsWith(path));
    return (
      <SidebarMenuItem>
        <SidebarMenuButton isActive={isActive} onClick={() => setLocation(path)} tooltip={label} className="h-9 font-normal">
          <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-white/5">
          <SidebarHeader className="h-14 justify-center border-b border-white/5">
            <div className="flex items-center gap-3 px-2">
              <button onClick={toggleSidebar} className="h-8 w-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors shrink-0">
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center shrink-0">
                    <BarChart3 className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-bold text-sm tracking-tight truncate">Meta Reports</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 pt-2">
            <SidebarGroup>
              <SidebarMenu className="px-2 gap-0.5">
                {mainNav.map(item => <NavItem key={item.path} {...item} />)}
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup className="mt-2">
              {!isCollapsed && (
                <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">
                  Ferramentas
                </SidebarGroupLabel>
              )}
              <SidebarMenu className="px-2 gap-0.5">
                {toolsNav.map(item => <NavItem key={item.path} {...item} />)}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-2 border-t border-white/5">
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
                      <p className="text-xs font-semibold truncate leading-none">{user?.name ?? "-"}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user?.email ?? "-"}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/configuracoes")}>
                  <User className="mr-2 h-4 w-4" /> Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {!isCollapsed && (
          <div className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/30 transition-colors" style={{ zIndex: 50 }} onMouseDown={() => setIsResizing(true)} />
        )}
      </div>

      <SidebarInset>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </>
  );
}
