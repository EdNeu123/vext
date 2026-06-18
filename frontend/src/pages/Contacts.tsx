import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactService } from '../services';
import { useTeamStore } from '../store/teamStore';
import { formatCurrency } from '../utils/format';
import { initialsOf, colorForName } from '../utils/avatar';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import PrimaryButton from '../components/ui/PrimaryButton';
import { Badge, FormField, Input } from '../components/ui/Form';
import Avatar from '../components/ui/Avatar';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import type { Contact } from '../models';

const CHURN_VARIANT: Record<Contact['churnRisk'], 'green' | 'yellow' | 'red'> = {
  low: 'green',
  medium: 'yellow',
  high: 'red',
};
const CHURN_LABEL: Record<Contact['churnRisk'], string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
};

const EMPTY_FORM = { name: '', email: '', phone: '', company: '', position: '' };

export default function Contacts() {
  const qc = useQueryClient();
  const { activeTeam } = useTeamStore();
  const activeTeamId = activeTeam?.id;
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: result } = useQuery({
    queryKey: ['contacts', activeTeamId, search],
    queryFn: () => contactService.list(search, 1, 200),
    enabled: !!activeTeamId,
  });
  const contacts = ((result as any)?.data || []) as Contact[];

  const createMut = useMutation({
    mutationFn: (data: any) => contactService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts', activeTeamId] });
      qc.invalidateQueries({ queryKey: ['contacts-list', activeTeamId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      toast.success('Contato criado!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao criar contato'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => contactService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts', activeTeamId] });
      qc.invalidateQueries({ queryKey: ['contacts-list', activeTeamId] });
      setShowModal(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      toast.success('Contato atualizado!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao atualizar'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => contactService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts', activeTeamId] });
      qc.invalidateQueries({ queryKey: ['contacts-list', activeTeamId] });
      toast.success('Contato removido');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao remover'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };
  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email ?? '',
      phone: c.phone ?? '',
      company: c.company ?? '',
      position: c.position ?? '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };

  return (
    <div className="max-w-[1100px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-1 tracking-tight">Contatos</h1>
          <p className="text-[13px] text-text-3 mt-1">{contacts.length} registros</p>
        </div>
        <PrimaryButton onClick={openCreate}>
          <Plus size={14} strokeWidth={2.5} />
          Novo Contato
        </PrimaryButton>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, email ou empresa..."
          className="w-full pl-10 pr-3 py-2.5 rounded-md bg-surface border border-border text-text-1 placeholder:text-text-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition"
        />
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              {['Nome', 'Empresa', 'Email', 'Risco Churn', 'LTV', ''].map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-3 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-3">
                  {search ? 'Nenhum contato encontrado' : 'Sem contatos ainda. Clique em "Novo Contato".'}
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-2 transition">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={initialsOf(c.name)} size={28} color={colorForName(c.name)} />
                      <div>
                        <div className="font-medium text-text-1">{c.name}</div>
                        {c.position && (
                          <div className="text-[11px] text-text-3">{c.position}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-text-2">{c.company ?? '—'}</td>
                  <td className="px-4 py-2.5 text-text-2">{c.email ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={CHURN_VARIANT[c.churnRisk]}>{CHURN_LABEL[c.churnRisk]}</Badge>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-text-1">{formatCurrency(c.ltv)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-text-3 hover:text-text-1 transition p-1"
                        aria-label="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir contato "${c.name}"?`)) deleteMut.mutate(c.id);
                        }}
                        className="text-text-3 hover:text-danger transition p-1"
                        aria-label="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        title={editing ? 'Editar Contato' : 'Novo Contato'}
      >
        <form onSubmit={handleSubmit}>
          <FormField label="Nome *">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FormField>
          <FormField label="Telefone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </FormField>
          <FormField label="Empresa">
            <Input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </FormField>
          <FormField label="Cargo">
            <Input
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </FormField>
          <PrimaryButton
            type="submit"
            fullWidth
            disabled={createMut.isPending || updateMut.isPending}
          >
            {(createMut.isPending || updateMut.isPending)
              ? 'Salvando...'
              : editing ? 'Atualizar' : 'Criar Contato'}
          </PrimaryButton>
        </form>
      </Modal>
    </div>
  );
}
