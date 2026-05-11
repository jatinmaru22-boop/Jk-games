import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { Login } from "@/pages/login";
import { Home } from "@/pages/home";
import { Crash } from "@/pages/crash";
import { Transfer } from "@/pages/transfer";
import { Profile } from "@/pages/profile";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, firebaseReady } = useAuth();

  if (!firebaseReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground uppercase tracking-widest text-xs font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;
  return <Component />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={() => <ProtectedRoute component={Home} />} />
        <Route path="/crash" component={() => <ProtectedRoute component={Crash} />} />
        <Route path="/transfer" component={() => <ProtectedRoute component={Transfer} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
