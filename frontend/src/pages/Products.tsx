import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Package, TrendingUp, ShoppingBag, Archive } from 'lucide-react';

import { productService } from '../services';
import type { Product } from '../models';
import { useAuthStore } from '../store/authStore';
import { useTeamStore } from '../store/teamStore';
import { formatCurrency, formatCurrencyShort } from '../utils/format';

import Modal from '../components/ui/Modal';
import PrimaryButton from '../components/ui/PrimaryButton';
import { FormField, Input, Textarea } from '../components/ui/Form';

const EMPTY_FORM = { name: '', price: '', description: '' };

export default function Products() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { activeTeam } = useTeamStore();
  const activeTeamId = activeTeam?.id;
  const isAdmin = activeTeam?.role === 'admin' || activeTeam?.role === 'moderator';

  // Dados
  const { data: list } = useQuery({
    queryKey: ['products', activeTeamId],
    queryFn: () => productService.list(),
    enabled: !!activeTeamId,
  });
  const { data: stats } = useQuery({
    queryKey: ['products-stats', activeTeamId],
    queryFn: () => productService.getStats(),
    enabled: !!activeTeamId,
  });

  const products = (list ?? []) as Product[];
  const productStats = stats?.products ?? [];

  // CRUD modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, price: String(p.price), description: p.description ?? '' });
    setShowModal(true);
  };

  const createMut = useMutation({
    mutationFn: (data: any) => productService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', activeTeamId] });
      qc.invalidateQueries({ queryKey: ['products-stats', activeTeamId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      toast.success('Produto criado');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao criar'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => productService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', activeTeamId] });
      qc.invalidateQueries({ queryKey: ['products-stats', activeTeamId] });
      setShowModal(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      toast.success('Produto atualizado');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao atualizar'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => productService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', activeTeamId] });
      qc.invalidateQueries({ queryKey: ['products-stats', activeTeamId] });
      toast.success('Produto removido');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao remover'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      price: parseFloat(form.price || '0'),
      description: form.description || null,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const handleDelete = (p: Product) => {
    if (!confirm(`Remover "${p.name}"?`)) return;
    deleteMut.mutate(p.id);
  };

  // KPIs (vêm de stats)
  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalSales = stats?.totalSales ?? 0;
  const activeCount = products.filter(p => p.isActive).length;
  const topProduct = productStats[0]; // já vem ordenado

  // Indicador de vendas/produto (pra mostrar no cartão)
  const statsById = new Map(productStats.map(s => [s.id, s]));

  // Maior receita pra normalizar barra
  const maxRevenue = Math.max(...productStats.map(s => s.totalRevenue), 1);

  return (
    <div>
      {/* Header da página */}
      <div className="flex items-start justify-between mb-3 sm:mb-4 flex-wrap gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-text-1 tracking-tight">Produtos</h1>
          <p className="text-[12px] sm:text-[13px] text-text-3 mt-1">
            {activeCount} ativo{activeCount !== 1 ? 's' : ''}
            {totalSales > 0 && ` · ${totalSales} venda${totalSales > 1 ? 's' : ''} fechada${totalSales > 1 ? 's' : ''}`}
          </p>
        </div>
        {isAdmin && (
          <PrimaryButton onClick={openCreate}>
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Novo produto</span>
            <span className="sm:hidden">Novo</span>
          </PrimaryButton>
        )}
      </div>

      {/* KPIs de vendas — 2 cols mobile, 3 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <KPI
          icon={TrendingUp}
          label="Receita total"
          value={formatCurrency(totalRevenue)}
          sub="cards fechados"
        />
        <KPI
          icon={ShoppingBag}
          label="Vendas"
          value={String(totalSales)}
          sub={totalSales === 0 ? 'nenhuma ainda' : 'no histórico'}
        />
        <div className="col-span-2 lg:col-span-1">
          <KPI
            icon={Package}
            label="Top produto"
            value={topProduct?.name ?? '—'}
            sub={topProduct ? formatCurrencyShort(topProduct.totalRevenue) : 'sem vendas ainda'}
          />
        </div>
      </div>

      {/* Vendas por produto — gráfico horizontal */}
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 mb-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <div className="text-[13px] font-semibold text-text-1">Vendas por produto</div>
            <div className="text-[11px] text-text-3 mt-0.5">Receita total fechada</div>
          </div>
        </div>

        {productStats.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-text-3">
            Sem vendas registradas. Quando cards forem fechados como ganhos com produto vinculado, aparecem aqui.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {productStats.map(p => {
              const pct = (p.totalRevenue / maxRevenue) * 100;
              return (
                <li key={p.id} className="grid grid-cols-[1fr_auto] gap-x-3 items-center">
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[12px] font-medium text-text-1 truncate">{p.name}</span>
                      <span className="text-[11px] text-text-3 flex-shrink-0">
                        {p.salesCount} venda{p.salesCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-[12px] font-semibold text-text-1 tabular-nums whitespace-nowrap">
                    {formatCurrencyShort(p.totalRevenue)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Catálogo — grid de cards */}
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[13px] font-semibold text-text-1">Catálogo</div>
            <div className="text-[11px] text-text-3 mt-0.5">{products.length} produto{products.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-12 text-center">
            <Archive size={32} className="text-text-3 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[13px] text-text-2 mb-1">Nenhum produto cadastrado</p>
            {isAdmin && <p className="text-[12px] text-text-3">Clique em "Novo produto" para começar</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map(p => {
              const sales = statsById.get(p.id);
              return (
                <div
                  key={p.id}
                  className={`bg-surface-2 border border-border rounded-lg p-3 transition hover:border-border-2 ${
                    !p.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-text-1 truncate">{p.name}</div>
                      <div className="text-[11px] text-text-3 mt-0.5">
                        {formatCurrency(Number(p.price))}
                      </div>
                    </div>
                    {!p.isActive && (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold bg-surface text-text-3 border border-border flex-shrink-0">
                        inativo
                      </span>
                    )}
                  </div>

                  {p.description && (
                    <p className="text-[11px] text-text-3 leading-relaxed mb-2 line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  {/* Stats do produto */}
                  {sales && sales.salesCount > 0 ? (
                    <div className="text-[11px] text-text-2 border-t border-border pt-2 mt-2 flex items-center gap-3">
                      <span>
                        <strong className="text-text-1">{sales.salesCount}</strong> venda{sales.salesCount > 1 ? 's' : ''}
                      </span>
                      <span className="text-text-3">·</span>
                      <span style={{ color: 'var(--green)' }}>
                        {formatCurrencyShort(sales.totalRevenue)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-text-3 border-t border-border pt-2 mt-2">
                      Sem vendas ainda
                    </div>
                  )}

                  {isAdmin && (
                    <div className="flex gap-1 mt-2 -mb-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-text-2 hover:text-text-1 hover:bg-surface px-2 py-1 rounded transition"
                      >
                        <Pencil size={11} /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="inline-flex items-center justify-center gap-1 text-[11px] font-medium text-text-3 hover:text-danger hover:bg-surface px-2 py-1 rounded transition"
                        aria-label="Remover"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal create/edit */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        title={editing ? 'Editar produto' : 'Novo produto'}
      >
        <form onSubmit={handleSubmit}>
          <FormField label="Nome *">
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Ex: Plano Premium"
            />
          </FormField>
          <FormField label="Preço (R$) *">
            <Input
              type="number"
              step="0.01"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              required
              placeholder="0,00"
            />
          </FormField>
          <FormField label="Descrição">
            <Textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Descreva o que está incluso"
            />
          </FormField>
          <PrimaryButton type="submit" fullWidth disabled={createMut.isPending || updateMut.isPending}>
            {(createMut.isPending || updateMut.isPending)
              ? 'Salvando...'
              : (editing ? 'Salvar alterações' : 'Criar produto')}
          </PrimaryButton>
        </form>
      </Modal>
    </div>
  );
}

interface KPIProps {
  icon: typeof Package;
  label: string;
  value: string;
  sub?: string;
}

function KPI({ icon: Icon, label, value, sub }: KPIProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-md bg-surface-2 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-text-3" strokeWidth={1.8} />
        </div>
        <span className="text-[10px] sm:text-[11px] font-semibold text-text-3 uppercase tracking-wider truncate">
          {label}
        </span>
      </div>
      <div className="text-[18px] sm:text-[22px] font-bold text-text-1 leading-tight tracking-tight truncate">
        {value}
      </div>
      {sub && <div className="text-[11px] text-text-3 mt-1 truncate">{sub}</div>}
    </div>
  );
}
