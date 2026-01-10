import { Route, Switch } from "wouter";
import NotFound from "../pages/NotFound";
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard/Dashboard";
import Pipeline from "../pages/Pipeline/Pipeline";
import Calendar from "../pages/Calendar/Calendar";
import Contacts from "../pages/Contacts";
import Products from "../pages/Products";
import VextPages from "../pages/LandingPages";
import VextRadar from "../pages/VextRadar";
import Tags from "../pages/Tags";
import Academy from "../pages/Academy";
import Team from "../pages/Team";

/**
 * Application routes
 */
export function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/pipeline" component={Pipeline} />
      <Route path="/agenda" component={Calendar} />
      <Route path="/contatos" component={Contacts} />
      <Route path="/produtos" component={Products} />
      <Route path="/vext-pages" component={VextPages} />
      <Route path="/vext-radar" component={VextRadar} />
      <Route path="/tags" component={Tags} />
      <Route path="/academy" component={Academy} />
      <Route path="/equipe" component={Team} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}
