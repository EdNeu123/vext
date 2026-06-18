import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagService } from '../services';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import PrimaryButton from '../components/ui/PrimaryButton';
import { FormField, Input } from '../components/ui/Form';
import { Plus, Pencil, Trash2, Tag as TagIcon } from 'lucide-react';
import type { Tag } from '../models';

const COLOR_PALETTE = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

const EMPTY_FORM = { label: '', color: '#3b82f6' };

export default function Tags() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagService.list(),
  });
  const tags = (data ?? []) as Tag[];

  const createMut = useMutation({
    mutationFn: (d: any) => tagService.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      toast.success('Tag criada!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => tagService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      setShowModal(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      toast.success('Tag atualizada!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => tagService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag removida');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };
  const openEdit = (t: Tag) => {
    setEditing(t);
    setForm({ label: t.label, color: t.color });
    setShowModal(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim()) return;
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };

  return (
    <div className="max-w-[900px]">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-1 tracking-tight">Tags</h1>
          <p className="text-[13px] text-text-3 mt-1">Gerencie as tags dos seus cards</p>
        </div>
        <PrimaryButton onClick={openCreate}>
          <Plus size={14} strokeWidth={2.5} />
          Nova Tag
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {tags.length === 0 ? (
          <div className="col-span-full bg-surface border border-border rounded-xl p-8 text-center text-text-3">
            Sem tags ainda.
          </div>
        ) : (
          tags.map((tag) => (
            <div
              key={tag.id}
              className="bg-surface border border-border rounded-xl p-4 relative group"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: tag.color + '22' }}
                >
                  <TagIcon size={16} style={{ color: tag.color }} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-text-1 truncate">{tag.label}</div>
                  <div className="text-[10px] text-text-3 font-mono">{tag.color}</div>
                </div>
              </div>
              <span
                className="text-[12px] px-2.5 py-0.5 rounded-full font-medium"
                style={{ background: tag.color + '22', color: tag.color }}
              >
                {tag.label}
              </span>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => openEdit(tag)}
                  className="bg-surface-2 border border-border rounded p-1 text-text-2 hover:text-text-1 transition"
                  aria-label="Editar"
                >
                  <Pencil size={11} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Excluir tag "${tag.label}"?`)) deleteMut.mutate(tag.id);
                  }}
                  className="bg-danger-bg border border-border rounded p-1 text-danger transition"
                  aria-label="Excluir"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        title={editing ? 'Editar Tag' : 'Nova Tag'}
        size="sm"
      >
        <form onSubmit={handleSubmit}>
          <FormField label="Nome *">
            <Input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Cor">
            <div className="flex gap-2 flex-wrap mb-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className="w-7 h-7 rounded-md cursor-pointer transition-all"
                  style={{
                    background: c,
                    border: form.color === c ? '2px solid var(--text-1)' : '2px solid transparent',
                    transform: form.color === c ? 'scale(1.1)' : 'scale(1)',
                  }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </FormField>
          <div className="px-3 py-2.5 bg-surface-2 rounded-md mb-3.5">
            <span
              className="text-[13px] font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: form.color + '22', color: form.color }}
            >
              {form.label || 'Preview'}
            </span>
          </div>
          <PrimaryButton type="submit" fullWidth disabled={createMut.isPending || updateMut.isPending}>
            {(createMut.isPending || updateMut.isPending)
              ? 'Salvando...'
              : editing ? 'Atualizar' : 'Criar Tag'}
          </PrimaryButton>
        </form>
      </Modal>
    </div>
  );
}
