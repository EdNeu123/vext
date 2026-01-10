import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Smartphone,
  Eye,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Palette,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";

const themeColors = [
  { id: "indigo", label: "Índigo", color: "bg-indigo-500" },
  { id: "emerald", label: "Esmeralda", color: "bg-emerald-500" },
  { id: "rose", label: "Rosa", color: "bg-rose-500" },
  { id: "amber", label: "Âmbar", color: "bg-amber-500" },
  { id: "blue", label: "Azul", color: "bg-blue-500" },
  { id: "purple", label: "Roxo", color: "bg-purple-500" },
];

type ThemeColor = "indigo" | "emerald" | "rose" | "amber" | "blue" | "purple";

interface LandingPage {
  id: number;
  title: string;
  slug: string;
  themeColor: ThemeColor;
  headline: string;
  subheadline: string | null;
  ctaText: string | null;
  productId: number | null;
  views: number | null;
  conversions: number | null;
  isActive: boolean | null;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
}

function LandingPageCard({ page, onEdit, onDelete }: {
  page: LandingPage;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const themeInfo = themeColors.find((t) => t.id === page.themeColor);
  const views = page.views || 0;
  const conversions = page.conversions || 0;
  const conversionRate = views > 0 ? ((conversions / views) * 100).toFixed(1) : "0";

  return (
    <Card className="hover:shadow-lg transition-all group overflow-hidden">
      <div className={`h-32 ${themeInfo?.color || "bg-slate-500"} flex items-center justify-center relative`}>
        <Smartphone className="w-12 h-12 text-white/50" />
        {page.isActive && (
          <Badge className="absolute top-2 right-2 bg-emerald-500">Ativa</Badge>
        )}
      </div>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold">{page.title}</h3>
            <p className="text-xs text-muted-foreground">/{page.slug}</p>
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
              <Link href={`/landing-pages/${page.id}`}>
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" /> Visualizar
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/p/${page.slug}`);
                toast.success("Link copiado!");
              }}>
                <Copy className="w-4 h-4 mr-2" /> Copiar Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{page.headline}</p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Views</p>
              <p className="font-bold">{views}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Conversões</p>
              <p className="font-bold">{conversions}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taxa</p>
              <p className="font-bold">{conversionRate}%</p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Palette className="w-3 h-3" />
            {themeInfo?.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function LandingPageDialog({ page, open, onOpenChange, onSuccess }: {
  page?: LandingPage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(page?.title || "");
  const [slug, setSlug] = useState(page?.slug || "");
  const [themeColor, setThemeColor] = useState<ThemeColor>(page?.themeColor || "indigo");
  const [headline, setHeadline] = useState(page?.headline || "");
  const [subheadline, setSubheadline] = useState(page?.subheadline || "");
  const [ctaText, setCtaText] = useState(page?.ctaText || "");

  const createPage = trpc.landingPages.create.useMutation({
    onSuccess: () => {
      toast.success("Landing page criada!");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updatePage = trpc.landingPages.update.useMutation({
    onSuccess: () => {
      toast.success("Landing page atualizada!");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !headline) {
      toast.error("Título, slug e headline são obrigatórios");
      return;
    }

    const data = {
      title,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      headline,
      themeColor,
      subheadline: subheadline || undefined,
      ctaText: ctaText || undefined,
    };

    if (page) {
      updatePage.mutate({ id: page.id, ...data });
    } else {
      createPage.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{page ? "Editar Landing Page" : "Nova Landing Page"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome da página" />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL) *</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="minha-pagina"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor do Tema</Label>
            <Select value={themeColor} onValueChange={(v) => setThemeColor(v as ThemeColor)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themeColors.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${t.color}`} />
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Headline *</Label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Título principal da página" />
          </div>

          <div className="space-y-2">
            <Label>Subheadline</Label>
            <Textarea value={subheadline} onChange={(e) => setSubheadline(e.target.value)} placeholder="Descrição ou subtítulo" rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Texto do CTA</Label>
            <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Ex: Começar Agora" />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createPage.isPending || updatePage.isPending}>
              {(createPage.isPending || updatePage.isPending) ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function LandingPages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<LandingPage | undefined>();

  const { data: pages, isLoading, refetch } = trpc.landingPages.list.useQuery();

  const deletePage = trpc.landingPages.delete.useMutation({
    onSuccess: () => {
      toast.success("Landing page excluída!");
      refetch();
    },
  });

  const filteredPages = pages?.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (page: LandingPage) => {
    setEditingPage(page);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingPage(undefined);
    setDialogOpen(true);
  };

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
          <h1 className="text-2xl font-bold">Vext Pages</h1>
          <p className="text-muted-foreground">{pages?.length || 0} landing pages criadas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar páginas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button className="gap-2" onClick={handleNew}>
            <Plus className="w-4 h-4" />
            Nova Página
          </Button>
        </div>
      </div>

      {filteredPages && filteredPages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.map((page) => (
            <LandingPageCard
              key={page.id}
              page={page as LandingPage}
              onEdit={() => handleEdit(page as LandingPage)}
              onDelete={() => {
                if (confirm("Excluir esta landing page?")) {
                  deletePage.mutate({ id: page.id });
                }
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Smartphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-bold text-lg mb-2">Nenhuma landing page encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Tente uma busca diferente" : "Crie sua primeira landing page"}
            </p>
            {!searchQuery && (
              <Button className="gap-2" onClick={handleNew}>
                <Plus className="w-4 h-4" />
                Nova Página
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <LandingPageDialog
        page={editingPage}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
