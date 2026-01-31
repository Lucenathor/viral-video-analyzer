import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Analyzer from "./pages/Analyzer";
import Library from "./pages/Library";
import SectorDetail from "./pages/SectorDetail";
import Support from "./pages/Support";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Stories from "./pages/Stories";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analyzer" component={Analyzer} />
      <Route path="/library" component={Library} />
      <Route path="/library/:slug" component={SectorDetail} />
      <Route path="/support" component={Support} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/stories" component={Stories} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
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
