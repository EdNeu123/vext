import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { landingPageService } from '../services';
import { formatDate } from '../utils/format';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import { Plus, Edit2, Trash2, Eye, MousePointerClick, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import type { LandingPage } from '../models';

const THEME_COLORS = ['indigo', 'emerald', 'rose', 'amber', 'blue', 'purple'];
const THEME_MAP: Record<string, string> = {
  indigo: 'bg-indigo-500', emerald: 'bg-emerald-500', rose: 'bg-rose-500',
  amber: 'bg-amber-500', blue: 'bg-blue-500', purple: 'bg-purple-500',
};

export default function LandingPages() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['landing-pages'], queryFn: () => landingPageService.list() });
  const pages = (data || []) as LandingPage[];
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LandingPage | null>(null);
  const [form, setForm] = useState({ title: '', headline: '', subheadline: '', ctaText: 'Saiba Mais', slug: '', themeColor: 'indigo' });

  const createMut = useMutation({
    mutationFn: (d: any) => landingPageService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['landing-pages'] }); closeModal(); toast.success('Landing Page criada!'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => landingPageService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['landing-pages'] }); closeModal(); toast.success('Atualizada!'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => landingPageService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['landing-pages'] }); toast.success('Removida!'); },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => landingPageService.update(id, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['landing-pages'] }); },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', headline: '', subheadline: '', ctaText: 'Saiba Mais', slug: '', themeColor: 'indigo' });
    setShowModal(true);
  };
  const openEdit = (p: LandingPage) => {
    setEditing(p);
    setForm({ title: p.title, headline: p.headline, subheadline: p.subheadline || '', ctaText: p.ctaText || '', slug: p.slug, themeColor: p.themeColor });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, subheadline: form.subheadline || undefined, ctaText: form.ctaText || undefined };
    if (editing) updateMut.mutate({ id: editing.id, data: payload });
    else createMut.mutate(payload);
  };

  const autoSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Landing Pages</h1>
          <p className="text-gray-500 mt-1">{pages.length} páginas</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition">
          <Plus size={16} /> Nova Página
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Nenhuma landing page</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => {
            const convRate = page.views > 0 ? ((page.conversions / page.views) * 100).toFixed(1) : '0.0';
            return (
              <div key={page.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition group">
                <div className={`h-2 ${THEME_MAP[page.themeColor] || 'bg-indigo-500'}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{page.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">/{page.slug}</p>
                    </div>
                    <button onClick={() => toggleActive.mutate({ id: page.id, isActive: !page.isActive })}
                      className={page.isActive ? 'text-emerald-400' : 'text-gray-600'}>
                      {page.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                  </div>

                  <p className="text-sm text-gray-400 mt-2 line-clamp-2">{page.headline}</p>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-400">
                        <Eye size={14} />
                        <span className="text-lg font-bold">{page.views}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">Views</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-emerald-400">
                        <MousePointerClick size={14} />
                        <span className="text-lg font-bold">{page.conversions}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">Conversões</p>
                    </div>
                    <div className="text-center">
                      <span className="text-lg font-bold text-purple-400">{convRate}%</span>
                      <p className="text-[10px] text-gray-500">Taxa</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-800">
                    <button onClick={() => openEdit(page)} className="flex-1 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg transition flex items-center justify-center gap-1">
                      <Edit2 size={12} /> Editar
                    </button>
                    <button onClick={() => { if (confirm('Remover?')) deleteMut.mutate(page.id); }}
                      className="py-1.5 px-3 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={closeModal} title={editing ? 'Editar Landing Page' : 'Nova Landing Page'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Título</label>
              <input value={form.title} onChange={(e) => {
                setForm({ ...form, title: e.target.value, slug: editing ? form.slug : autoSlug(e.target.value) });
              }} required className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Headline</label>
            <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Subheadline</label>
            <textarea value={form.subheadline} onChange={(e) => setForm({ ...form, subheadline: e.target.value })} rows={2}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">CTA Text</label>
              <input value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tema</label>
              <div className="flex gap-2 mt-2">
                {THEME_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, themeColor: c })}
                    className={`w-8 h-8 rounded-lg ${THEME_MAP[c]} transition ring-2 ${form.themeColor === c ? 'ring-white scale-110' : 'ring-transparent'}`} />
                ))}
              </div>
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
