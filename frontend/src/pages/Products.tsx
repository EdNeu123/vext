import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services';
import { formatCurrency } from '../utils/format';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import type { Product } from '../models';

export default function Products() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['products'], queryFn: () => productService.list() });
  const products = (data || []) as Product[];
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', price: '', description: '' });

  const createMut = useMutation({
    mutationFn: (d: any) => productService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); closeModal(); toast.success('Produto criado!'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => productService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); closeModal(); toast.success('Produto atualizado!'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => productService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Produto desativado!'); },
  });

  const openCreate = () => { setEditing(null); setForm({ name: '', price: '', description: '' }); setShowModal(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ name: p.name, price: String(p.price), description: p.description || '' }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = { name: form.name, price: parseFloat(form.price), description: form.description || undefined };
    if (editing) updateMut.mutate({ id: editing.id, data: d });
    else createMut.mutate(d);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Produtos</h1><p className="text-gray-500 mt-1">{products.length} produtos ativos</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition"><Plus size={16} /> Novo Produto</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? <div className="col-span-full text-center py-12 text-gray-500">Carregando...</div> :
          products.map((p) => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-2xl font-bold text-emerald-400 mt-2">{formatCurrency(Number(p.price))}</p>
                  {p.description && <p className="text-sm text-gray-500 mt-2">{p.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-indigo-400"><Edit2 size={16} /></button>
                  <button onClick={() => { if (confirm('Desativar produto?')) deleteMut.mutate(p.id); }} className="text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
      </div>

      <Modal open={showModal} onClose={closeModal} title={editing ? 'Editar Produto' : 'Novo Produto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm text-gray-400 mb-1">Nome *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-sm text-gray-400 mb-1">Preço *</label><input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-sm text-gray-400 mb-1">Descrição</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500" /></div>
          <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition disabled:opacity-50">
            {(createMut.isPending || updateMut.isPending) ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
