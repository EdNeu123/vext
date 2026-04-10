import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactService } from '../services';
import { formatCurrency, formatDate } from '../utils/format';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import { Plus, Search, Edit2, Trash2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Contact } from '../models';

const CHURN_COLORS = { low: 'text-emerald-400 bg-emerald-400/10', medium: 'text-yellow-400 bg-yellow-400/10', high: 'text-red-400 bg-red-400/10' };
const CHURN_LABELS = { low: 'Baixo', medium: 'Médio', high: 'Alto' };

export default function Contacts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', position: '', source: '' });

  const { data: result, isLoading } = useQuery({
    queryKey: ['contacts', search, page],
    queryFn: () => contactService.list(search || undefined, page),
  });

  const contacts = (result?.data || []) as Contact[];
  const pagination = result?.pagination;

  const createMut = useMutation({
    mutationFn: (data: any) => contactService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); closeModal(); toast.success('Contato criado!'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => contactService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); closeModal(); toast.success('Contato atualizado!'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => contactService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contato removido!'); },
  });

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', phone: '', company: '', position: '', source: '' }); setShowModal(true); };
  const openEdit = (c: Contact) => { setEditing(c); setForm({ name: c.name, email: c.email || '', phone: c.phone || '', company: c.company || '', position: c.position || '', source: c.source || '' }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, email: form.email || null, phone: form.phone || null, company: form.company || null, position: form.position || null, source: form.source || null };
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contatos</h1>
          <p className="text-gray-500 mt-1">{pagination?.total || 0} registros</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition">
          <Plus size={16} /> Novo Contato
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por nome, email ou empresa..."
          className="w-full pl-11 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium hidden md:table-cell">Empresa</th>
                <th className="px-6 py-3 font-medium hidden lg:table-cell">Email</th>
                <th className="px-6 py-3 font-medium">Churn</th>
                <th className="px-6 py-3 font-medium hidden lg:table-cell">LTV</th>
                <th className="px-6 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Carregando...</td></tr>
              ) : contacts.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Nenhum contato encontrado</td></tr>
              ) : contacts.map((c) => (
                <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-6 py-3">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.position}</p>
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell text-gray-400">{c.company || '-'}</td>
                  <td className="px-6 py-3 hidden lg:table-cell text-gray-400">{c.email || '-'}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${CHURN_COLORS[c.churnRisk]}`}>
                      {c.churnRisk === 'high' && <AlertCircle size={10} className="inline mr-1" />}
                      {CHURN_LABELS[c.churnRisk]}
                    </span>
                  </td>
                  <td className="px-6 py-3 hidden lg:table-cell text-gray-400">{formatCurrency(Number(c.ltv) || 0)}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-indigo-400 transition"><Edit2 size={16} /></button>
                      <button onClick={() => { if (confirm('Remover contato?')) deleteMut.mutate(c.id); }} className="text-gray-400 hover:text-red-400 transition"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800">
            <span className="text-xs text-gray-500">Página {pagination.page} de {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrev}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 transition"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNext}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 transition"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={closeModal} title={editing ? 'Editar Contato' : 'Novo Contato'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {['name', 'email', 'phone', 'company', 'position', 'source'].map((field) => (
            <div key={field}>
              <label className="block text-sm text-gray-400 mb-1 capitalize">{field === 'name' ? 'Nome *' : field === 'phone' ? 'Telefone' : field === 'company' ? 'Empresa' : field === 'position' ? 'Cargo' : field === 'source' ? 'Origem' : 'Email'}</label>
              <input value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required={field === 'name'} type={field === 'email' ? 'email' : 'text'}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          ))}
          <button type="submit" disabled={createMut.isPending || updateMut.isPending}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition disabled:opacity-50">
            {(createMut.isPending || updateMut.isPending) ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
