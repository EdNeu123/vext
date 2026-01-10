import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Tag,
  MoreVertical,
  Edit,
  Trash2,
  Palette,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const colorOptions = [
  { value: "#3B82F6", label: "Azul" },
  { value: "#10B981", label: "Verde" },
  { value: "#F59E0B", label: "Amarelo" },
  { value: "#EF4444", label: "Vermelho" },
  { value: "#8B5CF6", label: "Roxo" },
  { value: "#EC4899", label: "Rosa" },
  { value: "#6B7280", label: "Cinza" },
  { value: "#14B8A6", label: "Teal" },
];

interface TagItem {
  id: number;
  label: string;
  color: string;
  createdAt: Date;
}

function TagDialog({ tag, open, onOpenChange, onSuccess }: {
  tag?: TagItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [label, setLabel] = useState(tag?.label || "");
  const [color, setColor] = useState(tag?.color || "#3B82F6");

  const createTag = trpc.tags.create.useMutation({
    onSuccess: () => {
      toast.success("Tag criada!");
      onOpenChange(false);
      setLabel("");
      setColor("#3B82F6");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateTag = trpc.tags.update.useMutation({
    onSuccess: () => {
      toast.success("Tag atualizada!");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label) {
      toast.error("Nome da tag é obrigatório");
      return;
    }

    if (tag) {
      updateTag.mutate({ id: tag.id, label, color });
    } else {
      createTag.mutate({ label, color });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{tag ? "Editar Tag" : "Nova Tag"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Hot Lead" />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c.value ? "ring-2 ring-offset-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <Badge style={{ backgroundColor: color, color: "white" }}>
              {label || "Nome da tag"}
            </Badge>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createTag.isPending || updateTag.isPending}>
              {(createTag.isPending || updateTag.isPending) ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Tags() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | undefined>();

  const { data: tags, isLoading, refetch } = trpc.tags.list.useQuery();

  const deleteTag = trpc.tags.delete.useMutation({
    onSuccess: () => {
      toast.success("Tag excluída!");
      refetch();
    },
  });

  const filteredTags = tags?.filter((t: TagItem) =>
    t.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (tag: TagItem) => {
    setEditingTag(tag);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingTag(undefined);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex flex-wrap gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-32 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tags</h1>
          <p className="text-muted-foreground">{tags?.length || 0} tags cadastradas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button className="gap-2" onClick={handleNew}>
            <Plus className="w-4 h-4" />
            Nova Tag
          </Button>
        </div>
      </div>

      {filteredTags && filteredTags.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-3">
              {filteredTags.map((tag: TagItem) => (
                <div
                  key={tag.id}
                  className="group flex items-center gap-2 px-4 py-2 rounded-full border transition-all hover:shadow-md"
                  style={{ borderColor: tag.color }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="font-medium">{tag.label}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(tag)}>
                        <Edit className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm("Excluir esta tag?")) {
                            deleteTag.mutate({ id: tag.id });
                          }
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-bold text-lg mb-2">Nenhuma tag encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Tente uma busca diferente" : "Crie sua primeira tag para organizar seus dados"}
            </p>
            {!searchQuery && (
              <Button className="gap-2" onClick={handleNew}>
                <Plus className="w-4 h-4" />
                Nova Tag
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <TagDialog
        tag={editingTag}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
