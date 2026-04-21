import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Relatorios from "./pages/Relatorios";
import ContasAnuncio from "./pages/ContasAnuncio";
import Campanhas from "./pages/Campanhas";
import Rastreamento from "./pages/Rastreamento";
import GeradorUrl from "./pages/GeradorUrl";
import Integracoes from "./pages/Integracoes";
import Configuracoes from "./pages/Configuracoes";
import PublicReport from "./pages/PublicReport";
import DashboardLayout from "./components/DashboardLayout";

function PrivateRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/"              component={Dashboard} />
        <Route path="/relatorios"    component={Relatorios} />
        <Route path="/contas"        component={ContasAnuncio} />
        <Route path="/campanhas"     component={Campanhas} />
        <Route path="/compras"       component={Campanhas} />
        <Route path="/rastreamento"  component={Rastreamento} />
        <Route path="/gerador-url"   component={GeradorUrl} />
        <Route path="/integracoes"   component={Integracoes} />
        <Route path="/configuracoes" component={Configuracoes} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/report/:slug" component={PublicReport} />
      <Route>
        {isAuthenticated ? <PrivateRoutes /> : <Login />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
