import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Trello,
  Users,
  Calendar,
  Package,
  Smartphone,
  Tag,
  GraduationCap,
  Briefcase,
  LogOut,
  Bell,
  Search,
  Moon,
  Sun,
  Zap,
  Settings,
  ChevronRight,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode, useEffect, useState } from "react";

interface CRMLayoutProps {
  children: ReactNode;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "pipeline", label: "Pipeline", icon: Trello, path: "/pipeline" },
  { id: "calendar", label: "Agenda", icon: Calendar, path: "/calendar" },
  { id: "contacts", label: "Clientes", icon: Users, path: "/contacts" },
  { id: "vext-radar", label: "Vext Radar", icon: Brain, path: "/vext-radar", badge: "IA" },
  { id: "landing-pages", label: "Vext Pages", icon: Smartphone, path: "/landing-pages" },
  { id: "tags", label: "Tags", icon: Tag, path: "/tags" },
  { id: "products", label: "Produtos", icon: Package, path: "/products" },
  { id: "academy", label: "Academy", icon: GraduationCap, path: "/academy" },
];

const adminNavItems = [
  { id: "team", label: "Gestão Equipe", icon: Briefcase, path: "/team" },
];

export default function CRMLayout({ children }: CRMLayoutProps) {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: notifications } = trpc.notifications.list.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  });

  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = getLoginUrl();
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-20 h-6" />
          </div>
          <div className="flex-1 px-4 space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </aside>
        <main className="flex-1 p-8">
          <Skeleton className="h-10 w-96 mb-8" />
          <div className="grid grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
    setShowNotifications(false);
  };

  return (
    <div className="flex min-h-screen bg-background font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col fixed h-full z-20 shadow-xl">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight text-sidebar-foreground">Vext</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const itemWithBadge = item as typeof item & { badge?: string };
            return (
              <Link key={item.id} href={item.path}>
                <a
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                    isActive
                      ? "bg-sidebar-accent text-primary shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1">{item.label}</span>
                  {itemWithBadge.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary">
                      {itemWithBadge.badge}
                    </Badge>
                  )}
                </a>
              </Link>
            );
          })}

          {user.role === "admin" && (
            <>
              <div className="my-4 border-t border-sidebar-border" />
              {adminNavItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <Link key={item.id} href={item.path}>
                    <a
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                        isActive
                          ? "bg-sidebar-accent text-primary shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </a>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Preferências
            </span>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded hover:bg-sidebar-accent text-muted-foreground transition-colors"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-sidebar-accent border border-sidebar-border">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-sidebar-foreground truncate">{user.name || "Usuário"}</p>
              <p className="text-[10px] text-muted-foreground truncate capitalize flex items-center gap-1">
                {user.role === "admin" ? "Gestor" : "Vendedor"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-background/90 backdrop-blur-sm z-10 py-2">
          <div className="relative w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Buscar em todo o CRM..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full"
            />
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount && unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-4 border-b flex justify-between items-center">
                  <h4 className="font-bold text-sm">Notificações</h4>
                  {notifications && notifications.length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Marcar lidas
                    </button>
                  )}
                </div>
                <ScrollArea className="max-h-64">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className={`p-4 flex gap-3 cursor-pointer ${!n.isRead ? "bg-primary/5" : ""}`}
                      >
                        <div
                          className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                            n.type === "success"
                              ? "bg-emerald-500"
                              : n.type === "warning"
                              ? "bg-amber-500"
                              : n.type === "ai"
                              ? "bg-purple-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(n.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-xs">
                      Nenhuma notificação nova.
                    </div>
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}
