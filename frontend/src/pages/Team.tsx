import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Users,
  Mail,
  Shield,
  Clock,
  MoreVertical,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Crown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

interface Member {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  loginMethod: string | null;
  role: "admin" | "seller";
  permissions: string[] | null;
  salesGoal: string | null;
  birthDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

interface Invite {
  id: number;
  token: string;
  email: string;
  name: string;
  role: "admin" | "seller";
  permissions: string[] | null;
  status: "pending" | "used" | "expired";
  invitedBy: number;
  usedBy: number | null;
  expiresAt: Date;
  createdAt: Date;
  usedAt: Date | null;
}

const allPermissions = [
  { id: "deals.view", label: "Ver oportunidades" },
  { id: "deals.create", label: "Criar oportunidades" },
  { id: "deals.edit", label: "Editar oportunidades" },
  { id: "deals.delete", label: "Excluir oportunidades" },
  { id: "contacts.view", label: "Ver contatos" },
  { id: "contacts.create", label: "Criar contatos" },
  { id: "contacts.edit", label: "Editar contatos" },
  { id: "contacts.delete", label: "Excluir contatos" },
  { id: "products.view", label: "Ver produtos" },
  { id: "products.manage", label: "Gerenciar produtos" },
  { id: "landing_pages.view", label: "Ver landing pages" },
  { id: "landing_pages.manage", label: "Gerenciar landing pages" },
  { id: "reports.view", label: "Ver relatórios" },
  { id: "team.view", label: "Ver equipe" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

function InviteDialog({ open, onOpenChange, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "seller">("seller");
  const [permissions, setPermissions] = useState<string[]>([
    "deals.view", "deals.create", "deals.edit",
    "contacts.view", "contacts.create", "contacts.edit",
    "products.view", "landing_pages.view"
  ]);

  const createInvite = trpc.invites.create.useMutation({
    onSuccess: (data: { id: number; token: string }) => {
      toast.success("Convite criado com sucesso!");
      const inviteUrl = `${window.location.origin}/invite/${data.token}`;
      navigator.clipboard.writeText(inviteUrl);
      toast.info("Link do convite copiado para a área de transferência!");
      onOpenChange(false);
      setEmail("");
      setName("");
      setRole("seller");
      onSuccess();
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast.error("Email e nome são obrigatórios");
      return;
    }
    createInvite.mutate({ email, name, role, permissions });
  };

  const togglePermission = (permId: string) => {
    setPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convidar Membro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div className="space-y-2">
            <Label>Função</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "seller")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seller">Vendedor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Permissões</Label>
            <div className="grid grid-cols-2 gap-2 p-4 rounded-lg bg-secondary/50 max-h-48 overflow-y-auto">
              {allPermissions.map((perm) => (
                <div key={perm.id} className="flex items-center gap-2">
                  <Checkbox
                    id={perm.id}
                    checked={permissions.includes(perm.id)}
                    onCheckedChange={() => togglePermission(perm.id)}
                  />
                  <Label htmlFor={perm.id} className="text-xs font-normal cursor-pointer">
                    {perm.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createInvite.isPending}>
              {createInvite.isPending ? "Criando..." : "Criar Convite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Team() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Redirect non-admins
  if (user && user.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const { data: members, isLoading: membersLoading, refetch: refetchMembers } = trpc.team.list.useQuery();
  const { data: invites, isLoading: invitesLoading, refetch: refetchInvites } = trpc.invites.list.useQuery();
  const { data: ranking } = trpc.team.getSellerRanking.useQuery();

  const revokeInvite = trpc.invites.revoke.useMutation({
    onSuccess: () => {
      toast.success("Convite revogado!");
      refetchInvites();
    },
  });

  const filteredMembers = members?.filter((m: Member) =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingInvites = invites?.filter((i: Invite) => i.status === "pending");

  if (membersLoading || invitesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Equipe</h1>
          <p className="text-muted-foreground">{members?.length || 0} membros ativos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar membros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button className="gap-2" onClick={() => setInviteDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Convidar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-lg">Membros da Equipe</h2>
          {filteredMembers && filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMembers.map((member: Member) => {
                const memberRanking = ranking?.find((r) => r.id === member.id);
                return (
                  <Card key={member.id} className="hover:shadow-lg transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {member.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold truncate">{member.name || "Usuário"}</h3>
                            {member.role === "admin" && (
                              <Crown className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                          <Badge variant="secondary" className="mt-2">
                            {member.role === "admin" ? "Administrador" : "Vendedor"}
                          </Badge>
                        </div>
                      </div>

                      {member.role === "seller" && memberRanking && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Meta mensal</span>
                            <span className="font-medium">{memberRanking.progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={Math.min(memberRanking.progress, 100)} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(memberRanking.totalValue)} de {formatCurrency(50000)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum membro encontrado</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pending Invites */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Convites Pendentes</h2>
          {pendingInvites && pendingInvites.length > 0 ? (
            <div className="space-y-3">
              {pendingInvites.map((invite: Invite) => (
                <Card key={invite.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{invite.name}</p>
                        <p className="text-sm text-muted-foreground">{invite.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {invite.role === "admin" ? "Admin" : "Vendedor"}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expira em {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/invite/${invite.token}`);
                            toast.success("Link copiado!");
                          }}>
                            <Copy className="w-4 h-4 mr-2" /> Copiar Link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => revokeInvite.mutate({ id: invite.id })}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Revogar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">Nenhum convite pendente</p>
              </CardContent>
            </Card>
          )}

          {/* Used Invites */}
          <h2 className="font-bold text-lg mt-6">Histórico de Convites</h2>
          {invites && invites.filter((i: Invite) => i.status !== "pending").length > 0 ? (
            <div className="space-y-2">
              {invites.filter((i: Invite) => i.status !== "pending").slice(0, 5).map((invite: Invite) => (
                <div key={invite.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  {invite.status === "used" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{invite.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {invite.status === "used" ? "Aceito" : "Expirado"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum histórico</p>
          )}
        </div>
      </div>

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={() => { refetchInvites(); refetchMembers(); }}
      />
    </div>
  );
}
