import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Contacts from "./pages/Contacts";
import Calendar from "./pages/Calendar";
import Products from "./pages/Products";
import LandingPages from "./pages/LandingPages";
import Team from "./pages/Team";
import Tags from "./pages/Tags";
import Academy from "./pages/Academy";
import LandingPageView from "./pages/LandingPageView";
import VextRadar from "./pages/VextRadar";
import CRMLayout from "./components/CRMLayout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/lp/:slug" component={LandingPageView} />
      <Route path="/dashboard">
        <CRMLayout>
          <Dashboard />
        </CRMLayout>
      </Route>
      <Route path="/pipeline">
        <CRMLayout>
          <Pipeline />
        </CRMLayout>
      </Route>
      <Route path="/contacts">
        <CRMLayout>
          <Contacts />
        </CRMLayout>
      </Route>
      <Route path="/calendar">
        <CRMLayout>
          <Calendar />
        </CRMLayout>
      </Route>
      <Route path="/products">
        <CRMLayout>
          <Products />
        </CRMLayout>
      </Route>
      <Route path="/landing-pages">
        <CRMLayout>
          <LandingPages />
        </CRMLayout>
      </Route>
      <Route path="/team">
        <CRMLayout>
          <Team />
        </CRMLayout>
      </Route>
      <Route path="/tags">
        <CRMLayout>
          <Tags />
        </CRMLayout>
      </Route>
      <Route path="/academy">
        <CRMLayout>
          <Academy />
        </CRMLayout>
      </Route>
      <Route path="/vext-radar">
        <CRMLayout>
          <VextRadar />
        </CRMLayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
