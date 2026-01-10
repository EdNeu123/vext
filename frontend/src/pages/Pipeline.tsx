import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  DollarSign,
  User,
  Calendar,
  MoreVertical,
  Sparkles,
  History,
  Trash2,
  Edit,
  GripVertical,
  Filter,
  X,
  Building,
  Phone,
  Mail,
  Target,
  Clock,
  AlertCircle,
  CheckCircle2,
  Tag,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const stages = [
  { id: "prospecting", label: "Prospecção", color: "bg-slate-500", textColor: "text-slate-500" },
  { id: "qualification", label: "Qualificação", color: "bg-blue-500", textColor: "text-blue-500" },
  { id: "presentation", label: "Apresentação", color: "bg-amber-500", textColor: "text-amber-500" },
  { id: "negotiation", label: "Negociação", color: "bg-purple-500", textColor: "text-purple-500" },
  { id: "won", label: "Ganho", color: "bg-emerald-500", textColor: "text-emerald-500" },
  { id: "lost", label: "Perdido", color: "bg-red-500", textColor: "text-red-500" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

interface Deal {
  id: number;
  title: string;
  value: string;
  stage: string;
  probability: number | null;
  contactId: number;
  ownerId: number;
  productId: number | null;
  budgetConfirmed: boolean | null;
  decisionMakerIdentified: boolean | null;
  painPoints: string | null;
  competitors: string | null;
  timeline: string | null;
  nextFollowUpDate: Date | null;
  notes: string | null;
  closedAt: Date | null;
  lostReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{ id: number; label: string; color: string }>;
}

function DealCard({ deal, onEdit, onDelete, onAnalyze }: { 
  deal: Deal; 
  onEdit: () => void; 
  onDelete: () => void;
  onAnalyze: () => void;
}) {
  const stageInfo = stages.find((s) => s.id === deal.stage);
  const bantScore = [
    deal.budgetConfirmed,
    deal.decisionMakerIdentified,
    deal.painPoints,
    deal.timeline,
  ].filter(Boolean).length;

  return (
    <div className="p-3 bg-card rounded-lg border border-border hover:border-primary/30 hover:shadow-md transition-all group cursor-grab active:cursor-grabbing">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          <h4 className="font-medium text-sm truncate">{deal.title}</h4>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAnalyze}>
              <Sparkles className="w-4 h-4 mr-2" /> Analisar com IA
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="font-bold">{formatCurrency(Number(deal.value))}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <User className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">Contato #{deal.contactId}</span>
      </div>

      {deal.tags && deal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {deal.tags.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.label}
            </span>
          ))}
          {deal.tags.length > 2 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground bg-muted">
              +{deal.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* BANT + Probability Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-1" title="BANT Score">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${i < bantScore ? "bg-emerald-500" : "bg-muted"}`}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">{bantScore}/4</span>
        </div>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {deal.probability || 0}%
        </Badge>
      </div>
    </div>
  );
}

function NewDealDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [contactId, setContactId] = useState("");
  const [productId, setProductId] = useState("");
  const [stage, setStage] = useState("prospecting");
  const [notes, setNotes] = useState("");
  // BANT fields
  const [budgetConfirmed, setBudgetConfirmed] = useState(false);
  const [budgetValue, setBudgetValue] = useState("");
  const [decisionMakerIdentified, setDecisionMakerIdentified] = useState(false);
  const [decisionMakerName, setDecisionMakerName] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [timeline, setTimeline] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  const { data: contacts } = trpc.contacts.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();

  const createDeal = trpc.deals.create.useMutation({
    onSuccess: () => {
      toast.success("Oportunidade criada com sucesso!");
      setOpen(false);
      resetForm();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setTitle("");
    setValue("");
    setContactId("");
    setProductId("");
    setStage("prospecting");
    setNotes("");
    setBudgetConfirmed(false);
    setBudgetValue("");
    setDecisionMakerIdentified(false);
    setDecisionMakerName("");
    setPainPoints("");
    setCompetitors("");
    setTimeline("");
    setNextFollowUpDate("");
    setSelectedTags([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !value || !contactId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createDeal.mutate({
      title,
      value: Number(value),
      contactId: Number(contactId),
      productId: productId ? Number(productId) : undefined,
      stage: stage as "prospecting" | "qualification" | "presentation" | "negotiation" | "won" | "lost",
      notes: notes || undefined,
      budgetConfirmed,
      decisionMakerIdentified,
      painPoints: painPoints || undefined,
      competitors: competitors || undefined,
      timeline: timeline || undefined,
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Oportunidade
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nova Oportunidade</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Informações Básicas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Oportunidade *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Projeto de implementação ERP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Valor Estimado (R$) *</Label>
                  <Input
                    id="value"
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Ex: 50000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact">Cliente/Contato *</Label>
                  <Select value={contactId} onValueChange={setContactId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts?.map((contact) => (
                        <SelectItem key={contact.id} value={String(contact.id)}>
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            {contact.name} {contact.company && `- ${contact.company}`}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Estágio Inicial</Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.filter(s => s.id !== "won" && s.id !== "lost").map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${s.color}`} />
                            {s.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Produto/Serviço</Label>
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={String(product.id)}>
                          {product.name} - {formatCurrency(Number(product.price))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followup">Próximo Follow-up</Label>
                  <Input
                    id="followup"
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* BANT Qualification */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Target className="w-4 h-4" />
                Qualificação BANT
              </h3>
              
              {/* Budget */}
              <div className="p-4 rounded-lg border bg-secondary/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <Label className="font-medium">Budget (Orçamento)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="budgetConfirmed"
                      checked={budgetConfirmed}
                      onCheckedChange={(checked) => setBudgetConfirmed(checked as boolean)}
                    />
                    <Label htmlFor="budgetConfirmed" className="text-sm">Orçamento confirmado</Label>
                  </div>
                </div>
                <Input
                  placeholder="Valor do orçamento disponível (opcional)"
                  value={budgetValue}
                  onChange={(e) => setBudgetValue(e.target.value)}
                />
              </div>

              {/* Authority */}
              <div className="p-4 rounded-lg border bg-secondary/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <Label className="font-medium">Authority (Decisor)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="decisionMaker"
                      checked={decisionMakerIdentified}
                      onCheckedChange={(checked) => setDecisionMakerIdentified(checked as boolean)}
                    />
                    <Label htmlFor="decisionMaker" className="text-sm">Decisor identificado</Label>
                  </div>
                </div>
                <Input
                  placeholder="Nome do decisor (opcional)"
                  value={decisionMakerName}
                  onChange={(e) => setDecisionMakerName(e.target.value)}
                />
              </div>

              {/* Need */}
              <div className="p-4 rounded-lg border bg-secondary/30">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <Label className="font-medium">Need (Dores/Necessidades)</Label>
                </div>
                <Textarea
                  placeholder="Descreva as dores e necessidades do cliente..."
                  value={painPoints}
                  onChange={(e) => setPainPoints(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Timeline */}
              <div className="p-4 rounded-lg border bg-secondary/30">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <Label className="font-medium">Timeline (Prazo)</Label>
                </div>
                <Input
                  placeholder="Ex: Q1 2025, Março/2025, Urgente..."
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                />
              </div>

              {/* Competitors */}
              <div className="space-y-2">
                <Label>Concorrentes</Label>
                <Input
                  placeholder="Quais concorrentes estão na disputa?"
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags?.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag.id)
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedTags.includes(tag.id)
                        ? "ring-2 ring-offset-2 ring-primary"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações adicionais sobre a oportunidade..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createDeal.isPending}>
                {createDeal.isPending ? "Criando..." : "Criar Oportunidade"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function EditDealDialog({ deal, open, onOpenChange, onSuccess }: { 
  deal: Deal; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(deal.title);
  const [value, setValue] = useState(String(deal.value));
  const [stage, setStage] = useState(deal.stage);
  const [notes, setNotes] = useState(deal.notes || "");
  const [budgetConfirmed, setBudgetConfirmed] = useState(deal.budgetConfirmed || false);
  const [decisionMakerIdentified, setDecisionMakerIdentified] = useState(deal.decisionMakerIdentified || false);
  const [painPoints, setPainPoints] = useState(deal.painPoints || "");
  const [competitors, setCompetitors] = useState(deal.competitors || "");
  const [timeline, setTimeline] = useState(deal.timeline || "");
  const [lostReason, setLostReason] = useState(deal.lostReason || "");

  const updateDeal = trpc.deals.update.useMutation({
    onSuccess: () => {
      toast.success("Oportunidade atualizada!");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDeal.mutate({
      id: deal.id,
      title,
      value: Number(value),
      stage: stage as "prospecting" | "qualification" | "presentation" | "negotiation" | "won" | "lost",
      notes: notes || undefined,
      budgetConfirmed,
      decisionMakerIdentified,
      painPoints: painPoints || undefined,
      competitors: competitors || undefined,
      timeline: timeline || undefined,
      lostReason: stage === "lost" ? lostReason : undefined,
      reason: "Atualização manual",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Oportunidade</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título *</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-value">Valor (R$) *</Label>
                <Input
                  id="edit-value"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estágio</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${s.color}`} />
                        {s.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {stage === "lost" && (
              <div className="space-y-2">
                <Label htmlFor="lostReason">Motivo da Perda *</Label>
                <Textarea
                  id="lostReason"
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  placeholder="Por que esta oportunidade foi perdida?"
                  rows={2}
                />
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Qualificação BANT</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 rounded-lg border">
                  <Checkbox
                    id="edit-budget"
                    checked={budgetConfirmed}
                    onCheckedChange={(checked) => setBudgetConfirmed(checked as boolean)}
                  />
                  <Label htmlFor="edit-budget" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Orçamento Confirmado
                  </Label>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg border">
                  <Checkbox
                    id="edit-decision"
                    checked={decisionMakerIdentified}
                    onCheckedChange={(checked) => setDecisionMakerIdentified(checked as boolean)}
                  />
                  <Label htmlFor="edit-decision" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    Decisor Identificado
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dores/Necessidades</Label>
                <Textarea
                  value={painPoints}
                  onChange={(e) => setPainPoints(e.target.value)}
                  placeholder="Descreva as dores do cliente..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timeline/Prazo</Label>
                  <Input
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="Ex: Q1 2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Concorrentes</Label>
                  <Input
                    value={competitors}
                    onChange={(e) => setCompetitors(e.target.value)}
                    placeholder="Concorrentes na disputa"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateDeal.isPending}>
                {updateDeal.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function Pipeline() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [probabilityFilter, setProbabilityFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: deals, isLoading, refetch } = trpc.deals.list.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();

  const updateDeal = trpc.deals.update.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteDeal = trpc.deals.delete.useMutation({
    onSuccess: () => {
      toast.success("Oportunidade excluída!");
      refetch();
    },
  });

  const analyzeDeal = trpc.ai.analyzeDeal.useMutation({
    onSuccess: (data) => {
      toast.success(`Análise concluída! Probabilidade: ${data.probability}%`);
      refetch();
    },
    onError: () => {
      toast.error("Erro ao analisar oportunidade");
    },
  });

  const filteredDeals = useMemo(() => {
    if (!deals) return [];
    return deals.filter((deal) => {
      const matchesSearch = deal.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStage = stageFilter === "all" || deal.stage === stageFilter;
      const matchesProbability = probabilityFilter === "all" || 
        (probabilityFilter === "high" && (deal.probability || 0) >= 70) ||
        (probabilityFilter === "medium" && (deal.probability || 0) >= 30 && (deal.probability || 0) < 70) ||
        (probabilityFilter === "low" && (deal.probability || 0) < 30);
      return matchesSearch && matchesStage && matchesProbability;
    });
  }, [deals, searchQuery, stageFilter, probabilityFilter]);

  const dealsByStage = useMemo(() => {
    const grouped: Record<string, Deal[]> = {};
    stages.forEach((stage) => {
      grouped[stage.id] = filteredDeals.filter((deal) => deal.stage === stage.id);
    });
    return grouped;
  }, [filteredDeals]);

  const stageStats = useMemo(() => {
    const stats: Record<string, { count: number; value: number }> = {};
    stages.forEach((stage) => {
      const stageDeals = dealsByStage[stage.id] || [];
      stats[stage.id] = {
        count: stageDeals.length,
        value: stageDeals.reduce((acc, d) => acc + Number(d.value), 0),
      };
    });
    return stats;
  }, [dealsByStage]);

  const handleDragStart = (e: React.DragEvent, dealId: number) => {
    e.dataTransfer.setData("dealId", String(dealId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("ring-2", "ring-primary", "ring-inset");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("ring-2", "ring-primary", "ring-inset");
  };

  const handleDrop = (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove("ring-2", "ring-primary", "ring-inset");
    const dealId = Number(e.dataTransfer.getData("dealId"));
    const deal = deals?.find((d) => d.id === dealId);
    if (deal && deal.stage !== newStage) {
      updateDeal.mutate({
        id: dealId,
        stage: newStage as "prospecting" | "qualification" | "presentation" | "negotiation" | "won" | "lost",
        reason: `Movido de ${stages.find((s) => s.id === deal.stage)?.label} para ${stages.find((s) => s.id === newStage)?.label}`,
      });
      toast.success("Oportunidade movida!");
    }
  };

  const clearFilters = () => {
    setStageFilter("all");
    setProbabilityFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters = stageFilter !== "all" || probabilityFilter !== "all" || searchQuery !== "";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-96 w-72 flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Pipeline de Vendas</h1>
            <p className="text-muted-foreground">
              {filteredDeals.length} oportunidades • {formatCurrency(filteredDeals.reduce((acc, d) => acc + Number(d.value), 0))} total
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NewDealDialog onSuccess={refetch} />
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar oportunidades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Stage Filter */}
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Estágio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estágios</SelectItem>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${s.color}`} />
                    {s.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Probability Filter */}
          <Select value={probabilityFilter} onValueChange={setProbabilityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Probabilidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta (70%+)</SelectItem>
              <SelectItem value="medium">Média (30-70%)</SelectItem>
              <SelectItem value="low">Baixa (&lt;30%)</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="rounded-none"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="w-4 h-4" />
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="w-72 flex-shrink-0 bg-secondary/30 rounded-xl p-3 transition-all"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <h3 className="font-semibold text-sm">{stage.label}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {stageStats[stage.id]?.count || 0}
                  </Badge>
                </div>
              </div>
              
              {/* Column Value */}
              <div className="px-1 mb-3">
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stageStats[stage.id]?.value || 0)}
                </p>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[200px]">
                {dealsByStage[stage.id]?.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                  >
                    <DealCard
                      deal={deal}
                      onEdit={() => setEditingDeal(deal)}
                      onDelete={() => {
                        if (confirm("Tem certeza que deseja excluir esta oportunidade?")) {
                          deleteDeal.mutate({ id: deal.id });
                        }
                      }}
                      onAnalyze={() => analyzeDeal.mutate({ dealId: deal.id })}
                    />
                  </div>
                ))}
                {dealsByStage[stage.id]?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhuma oportunidade
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-sm">Título</th>
                    <th className="text-left p-4 font-medium text-sm">Valor</th>
                    <th className="text-left p-4 font-medium text-sm">Estágio</th>
                    <th className="text-left p-4 font-medium text-sm">Probabilidade</th>
                    <th className="text-left p-4 font-medium text-sm">BANT</th>
                    <th className="text-left p-4 font-medium text-sm">Tags</th>
                    <th className="text-right p-4 font-medium text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((deal) => {
                    const stageInfo = stages.find((s) => s.id === deal.stage);
                    const bantScore = [
                      deal.budgetConfirmed,
                      deal.decisionMakerIdentified,
                      deal.painPoints,
                      deal.timeline,
                    ].filter(Boolean).length;
                    return (
                      <tr key={deal.id} className="border-b hover:bg-secondary/50">
                        <td className="p-4">
                          <p className="font-medium">{deal.title}</p>
                          <p className="text-xs text-muted-foreground">Contato #{deal.contactId}</p>
                        </td>
                        <td className="p-4 font-bold">{formatCurrency(Number(deal.value))}</td>
                        <td className="p-4">
                          <Badge className={`${stageInfo?.color} text-white`}>
                            {stageInfo?.label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ width: `${deal.probability || 0}%` }}
                              />
                            </div>
                            <span className="text-sm">{deal.probability || 0}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            {[0, 1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${i < bantScore ? "bg-emerald-500" : "bg-muted"}`}
                              />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">{bantScore}/4</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {deal.tags && deal.tags.length > 0 && (
                            <div className="flex gap-1">
                              {deal.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="px-2 py-0.5 rounded text-[10px]"
                                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                                >
                                  {tag.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingDeal(deal)}>
                                <Edit className="w-4 h-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => analyzeDeal.mutate({ dealId: deal.id })}>
                                <Sparkles className="w-4 h-4 mr-2" /> Analisar com IA
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm("Excluir esta oportunidade?")) {
                                    deleteDeal.mutate({ id: deal.id });
                                  }
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDeals.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Nenhuma oportunidade encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingDeal && (
        <EditDealDialog
          deal={editingDeal}
          open={!!editingDeal}
          onOpenChange={(open) => !open && setEditingDeal(null)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
