import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagService } from '../services';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Tag as TagIcon } from 'lucide-react';
import type { Tag } from '../models';

const DEFAULT_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function Tags() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['tags'], queryFn: () => tagService.list() });
  const tags = (data || []) as Tag[];
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [form, setForm] = useState({ label: '', color: '#3b82f6' });

  const createMut = useMutation({
    mutationFn: (d: any) => tagService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); closeModal(); toast.success('Tag criada!'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => tagService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); closeModal(); toast.success('Tag atualizada!'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => tagService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success('Tag removida!'); },
  });

  const openCreate = () => { setEditing(null); setForm({ label: '', color: '#3b82f6' }); setShowModal(true); };
  const openEdit = (t: Tag) => { setEditing(t); setForm({ label: t.label, color: t.color }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tags</h1>
          <p className="text-gray-500 mt-1">Gerencie as tags dos seus deals</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition">
          <Plus size={16} /> Nova Tag
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : tags.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Nenhuma tag criada</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tags.map((tag) => (
            <div key={tag.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: tag.color + '20' }}>
                  <TagIcon size={18} style={{ color: tag.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{tag.label}</p>
                  <p className="text-xs text-gray-500">{tag.color}</p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => openEdit(tag)} className="flex-1 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg transition">Editar</button>
                <button onClick={() => { if (confirm('Remover tag?')) deleteMut.mutate(tag.id); }}
                  className="py-1.5 px-3 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={closeModal} title={editing ? 'Editar Tag' : 'Nova Tag'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome</label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-lg transition ring-2 ${form.color === c ? 'ring-white scale-110' : 'ring-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="mt-2 w-full h-10 rounded-lg cursor-pointer bg-transparent" />
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
            <div className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: form.color + '20', color: form.color }}>
              {form.label || 'Preview'}
            </div>
          </div>
          <button type="submit" disabled={createMut.isPending || updateMut.isPending}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition disabled:opacity-50">
            {createMut.isPending || updateMut.isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
