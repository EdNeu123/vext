import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Upload,
  User,
  Mail,
  Phone,
  Building,
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

interface Contact {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  ownerId: number;
  source: string | null;
  notes: string | null;
  ltv: string | null;
  averageTicket: string | null;
  totalPurchases: number | null;
  lastPurchaseAt: Date | null;
  bestContactTime: string | null;
  churnRisk: "low" | "medium" | "high" | null;
  npsScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

function ContactCard({ contact, onEdit, onDelete }: { contact: Contact; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="hover:shadow-lg transition-shadow group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold">{contact.name}</h3>
              {contact.position && contact.company && (
                <p className="text-sm text-muted-foreground">
                  {contact.position} @ {contact.company}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 text-sm">
          {contact.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{contact.phone}</span>
            </div>
          )}
          {contact.company && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="w-4 h-4" />
              <span>{contact.company}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">LTV</p>
            <p className="font-bold text-sm">{contact.ltv ? formatCurrency(Number(contact.ltv)) : "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ticket Médio</p>
            <p className="font-bold text-sm">{contact.averageTicket ? formatCurrency(Number(contact.averageTicket)) : "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Compras</p>
            <p className="font-bold text-sm">{contact.totalPurchases || 0}</p>
          </div>
        </div>

        {contact.churnRisk && contact.churnRisk !== "low" && (
          <div className="mt-3">
            <Badge
              variant={contact.churnRisk === "high" ? "destructive" : "default"}
              className="w-full justify-center"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              Risco de Churn: {contact.churnRisk === "high" ? "Alto" : "Médio"}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NewContactDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  const createContact = trpc.contacts.create.useMutation({
    onSuccess: () => {
      toast.success("Contato criado com sucesso!");
      setOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setPosition("");
      setSource("");
      setNotes("");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Nome é obrigatório");
      return;
    }
    createContact.mutate({
      name,
      email: email || undefined,
      phone: phone || undefined,
      company: company || undefined,
      position: position || undefined,
      source: source || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Contato
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Contato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nome da empresa" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Ex: Diretor" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Origem</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Indicação</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="event">Evento</SelectItem>
                <SelectItem value="cold_call">Cold Call</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anotações sobre o contato..." rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createContact.isPending}>
              {createContact.isPending ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImportCSVDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [csvData, setCsvData] = useState<Array<{ name: string; email?: string; phone?: string; company?: string; position?: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkImport = trpc.contacts.bulkImport.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.imported} contatos importados com sucesso!`);
      setOpen(false);
      setCsvData([]);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

      const data = lines.slice(1).filter((line) => line.trim()).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const contact: { name: string; email?: string; phone?: string; company?: string; position?: string } = {
          name: values[headers.indexOf("name")] || values[headers.indexOf("nome")] || "",
        };
        const emailIdx = headers.indexOf("email") !== -1 ? headers.indexOf("email") : headers.indexOf("e-mail");
        if (emailIdx !== -1 && values[emailIdx]) contact.email = values[emailIdx];
        const phoneIdx = headers.indexOf("phone") !== -1 ? headers.indexOf("phone") : headers.indexOf("telefone");
        if (phoneIdx !== -1 && values[phoneIdx]) contact.phone = values[phoneIdx];
        const companyIdx = headers.indexOf("company") !== -1 ? headers.indexOf("company") : headers.indexOf("empresa");
        if (companyIdx !== -1 && values[companyIdx]) contact.company = values[companyIdx];
        const positionIdx = headers.indexOf("position") !== -1 ? headers.indexOf("position") : headers.indexOf("cargo");
        if (positionIdx !== -1 && values[positionIdx]) contact.position = values[positionIdx];
        return contact;
      }).filter((c) => c.name);

      setCsvData(data);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (csvData.length === 0) {
      toast.error("Nenhum contato para importar");
      return;
    }
    bulkImport.mutate(csvData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Contatos via CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/50 text-sm">
            <p className="font-medium mb-2">Formato esperado:</p>
            <code className="text-xs">name,email,phone,company,position</code>
            <p className="text-muted-foreground mt-2 text-xs">
              Também aceita: nome, e-mail, telefone, empresa, cargo
            </p>
          </div>

          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Selecionar arquivo CSV
          </Button>

          {csvData.length > 0 && (
            <div className="p-4 rounded-lg border">
              <p className="font-medium mb-2">{csvData.length} contatos encontrados</p>
              <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
                {csvData.slice(0, 5).map((c, i) => (
                  <div key={i} className="text-muted-foreground">
                    {c.name} {c.email && `- ${c.email}`}
                  </div>
                ))}
                {csvData.length > 5 && (
                  <p className="text-muted-foreground">... e mais {csvData.length - 5} contatos</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={csvData.length === 0 || bulkImport.isPending}>
              {bulkImport.isPending ? "Importando..." : `Importar ${csvData.length} contatos`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditContactDialog({ contact, open, onOpenChange, onSuccess }: {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email || "");
  const [phone, setPhone] = useState(contact.phone || "");
  const [company, setCompany] = useState(contact.company || "");
  const [position, setPosition] = useState(contact.position || "");
  const [notes, setNotes] = useState(contact.notes || "");
  const [ltv, setLtv] = useState(contact.ltv || "");
  const [averageTicket, setAverageTicket] = useState(contact.averageTicket || "");
  const [npsScore, setNpsScore] = useState(contact.npsScore?.toString() || "");
  const [churnRisk, setChurnRisk] = useState<"low" | "medium" | "high">(contact.churnRisk || "low");

  const updateContact = trpc.contacts.update.useMutation({
    onSuccess: () => {
      toast.success("Contato atualizado!");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateContact.mutate({
      id: contact.id,
      name,
      email: email || undefined,
      phone: phone || undefined,
      company: company || undefined,
      position: position || undefined,
      notes: notes || undefined,
      ltv: ltv ? Number(ltv) : undefined,
      averageTicket: averageTicket ? Number(averageTicket) : undefined,
      npsScore: npsScore ? Number(npsScore) : undefined,
      churnRisk: churnRisk as "low" | "medium" | "high",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Contato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50 space-y-4">
            <p className="text-sm font-medium">Métricas do Cliente</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">LTV (R$)</Label>
                <Input type="number" value={ltv} onChange={(e) => setLtv(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Ticket Médio (R$)</Label>
                <Input type="number" value={averageTicket} onChange={(e) => setAverageTicket(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">NPS (0-10)</Label>
                <Input type="number" min="0" max="10" value={npsScore} onChange={(e) => setNpsScore(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Risco de Churn</Label>
              <Select value={churnRisk} onValueChange={(v) => setChurnRisk(v as "low" | "medium" | "high")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixo</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateContact.isPending}>
              {updateContact.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const { data: contacts, isLoading, refetch } = trpc.contacts.list.useQuery();
  const { data: searchResults } = trpc.contacts.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 2 }
  );

  const deleteContact = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contato excluído!");
      refetch();
    },
  });

  const displayContacts = searchQuery.length > 2 ? searchResults : contacts;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">{contacts?.length || 0} contatos cadastrados</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contatos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <ImportCSVDialog onSuccess={refetch} />
          <NewContactDialog onSuccess={refetch} />
        </div>
      </div>

      {displayContacts && displayContacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={() => setEditingContact(contact)}
              onDelete={() => {
                if (confirm("Tem certeza que deseja excluir este contato?")) {
                  deleteContact.mutate({ id: contact.id });
                }
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-bold text-lg mb-2">Nenhum contato encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Tente uma busca diferente" : "Comece adicionando seu primeiro contato"}
            </p>
            {!searchQuery && <NewContactDialog onSuccess={refetch} />}
          </CardContent>
        </Card>
      )}

      {editingContact && (
        <EditContactDialog
          contact={editingContact}
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
