import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import CashFlow from "@/pages/cash-flow";
import ReserveFunds from "@/pages/reserve-funds";
import MonthlyExpenses from "@/pages/monthly-expenses";
import StockOverview from "@/pages/stock-overview";
import StockIn from "@/pages/stock-in";
import StockOut from "@/pages/stock-out";
import Settings from "@/pages/settings";
import Layout from "@/components/layout/layout";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tea-brown"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/cash-flow" component={CashFlow} />
        <Route path="/reserve-funds" component={ReserveFunds} />
        <Route path="/monthly-expenses" component={MonthlyExpenses} />
        <Route path="/stock-overview" component={StockOverview} />
        <Route path="/stock-in" component={StockIn} />
        <Route path="/stock-out" component={StockOut} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
