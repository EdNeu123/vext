import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, LayoutGrid, List, ChevronLeft } from 'lucide-react';

import { cardService, contactService, teamService } from '../services';
import type { Card, CardStage } from '../models';
import { formatCurrency, formatCurrencyShort } from '../utils/format';
import { useTeamStore } from '../store/teamStore';

import Modal from '../components/ui/Modal';
import PrimaryButton from '../components/ui/PrimaryButton';
import { FormField, Input, Select } from '../components/ui/Form';
import CardEditModal from '../components/pipeline/CardEditModal';

type StageDef = { key: CardStage; label: string; accent: string };

const STAGES: StageDef[] = [
  { key: 'prospecting',   label: 'Prospecção',   accent: '#93C5FD' },
  { key: 'qualification', label: 'Qualificação', accent: '#FCD34D' },
  { key: 'presentation',  label: 'Apresentação', accent: '#C4B5FD' },
  { key: 'negotiation',   label: 'Negociação',   accent: '#FCA5A5' },
  { key: 'won',           label: 'Ganho',        accent: '#5DCAA5' },
  { key: 'lost',          label: 'Perdido',      accent: '#9CA3AF' },
];

interface KanbanCardProps {
  card: Card;
  onDragStart: () => void;
  onClick: () => void;
}

function KanbanCard({ card, onDragStart, onClick }: KanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-surface border border-border rounded-lg p-3 mb-2 cursor-pointer hover:border-accent hover:shadow-sm transition-all active:scale-[0.98]"
    >
      <div className="text-[13px] font-semibold text-text-1 mb-0.5">{card.title}</div>
      <div className="text-[11px] text-text-3 mb-2 truncate">
        {card.contact?.name ?? '—'}
        {card.contact?.company ? ` · ${card.contact.company}` : ''}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold" style={{ color: 'var(--green)' }}>
          {formatCurrency(Number(card.value))}
        </span>
        <span className="text-[10px] text-text-3 flex-shrink-0">{card.probability}%</span>
      </div>
      {card.tags && card.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-2">
          {card.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: tag.color + '22', color: tag.color }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Pipeline() {
  const qc = useQueryClient();
  const { activeTeam } = useTeamStore();
  const activeTeamId = activeTeam?.id;
  // Filtro por vendedor é um recurso de gestão: ADMIN ou MODERATOR da equipe ativa
  const isAdmin = activeTeam?.role === 'admin' || activeTeam?.role === 'moderator';

  // Detecta mobile pra mudar layout
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Filtro de vendedor (só admin vê)
  const [sellerFilter, setSellerFilter] = useState<'all' | number>('all');

  const { data: cardsResult } = useQuery({
    queryKey: ['cards', activeTeamId],
    queryFn: () => cardService.list(1, 200),
    enabled: !!activeTeamId,
  });
  const { data: contactsResult } = useQuery({
    queryKey: ['contacts-list', activeTeamId],
    queryFn: () => contactService.list('', 1, 200),
    enabled: !!activeTeamId,
  });
  const { data: team } = useQuery({
    queryKey: ['team-members', activeTeamId],
    queryFn: () => teamService.list(),
    enabled: isAdmin && !!activeTeamId,
  });

  const allCards = ((cardsResult as any)?.data || []) as Card[];
  const contactList = ((contactsResult as any)?.data || []) as { id: number; name: string; company: string | null }[];
  const teamList = (((team as any)?.data) || team || []) as { id: number; name: string }[];

  // Aplica filtro de vendedor (apenas admin)
  const cards = sellerFilter === 'all' ? allCards : allCards.filter(c => c.ownerId === sellerFilter);

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dragId, setDragId] = useState<number | null>(null);
  const [overStage, setOverStage] = useState<CardStage | null>(null);

  // Edit modal
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  // New card modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    value: '',
    contactId: '',
    stage: 'prospecting' as CardStage,
  });

  const createMut = useMutation({
    mutationFn: (data: any) => cardService.create(data),
    onSuccess: () => {
      // Invalida múltiplas queries pra refletir em todas as telas — fix do delay
      qc.invalidateQueries({ queryKey: ['cards', activeTeamId] });
      qc.invalidateQueries({ queryKey: ['card-stats', activeTeamId] });
      qc.invalidateQueries({ queryKey: ['dashboard-metrics', activeTeamId] });
      qc.invalidateQueries({ queryKey: ['contacts-list', activeTeamId] });
      setShowNewModal(false);
      setForm({ title: '', value: '', contactId: '', stage: 'prospecting' });
      toast.success('Card criado');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao criar card'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => cardService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cards', activeTeamId] });
      qc.invalidateQueries({ queryKey: ['card-stats', activeTeamId] });
      qc.invalidateQueries({ queryKey: ['dashboard-metrics', activeTeamId] });
    },
  });

  const handleDrop = (stage: CardStage) => {
    if (dragId !== null) {
      const card = allCards.find((c) => c.id === dragId);
      if (card && card.stage !== stage) {
        updateMut.mutate({ id: dragId, data: { stage } });
        toast.success(`"${card.title}" → ${STAGES.find((s) => s.key === stage)?.label}`);
      }
      setDragId(null);
      setOverStage(null);
    }
  };

  const toggleCollapse = (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({
      title: form.title,
      value: parseFloat(form.value),
      contactId: parseInt(form.contactId),
      stage: form.stage,
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header da página — h1 + contexto */}
      <div className="flex items-start justify-between mb-3 sm:mb-4 flex-wrap gap-3 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-text-1 tracking-tight">Pipeline</h1>
          <p className="text-[12px] sm:text-[13px] text-text-3 mt-1">
            {allCards.length} cards · {isMobile ? 'toque pra editar' : 'arraste entre colunas ou clique pra editar'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Filtro vendedor (admin) */}
          {isAdmin && teamList.length > 0 && (
            <select
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-3 py-1.5 rounded-md bg-surface-2 border border-border text-text-2 text-[13px] font-medium hover:text-text-1 transition focus:outline-none focus:border-accent"
              aria-label="Filtrar por vendedor"
            >
              <option value="all">Todos vendedores</option>
              {teamList.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          {/* View toggle - só desktop */}
          {!isMobile && (
            <div className="flex border border-border rounded-md overflow-hidden">
              {([
                { v: 'kanban' as const, Icon: LayoutGrid, label: 'Kanban' },
                { v: 'table' as const,  Icon: List,       label: 'Tabela' },
              ]).map(({ v, Icon, label }) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`px-2.5 py-1.5 transition ${
                    viewMode === v ? 'bg-accent-bg text-accent' : 'bg-transparent text-text-3 hover:text-text-2'
                  }`}
                  aria-label={label}
                >
                  <Icon size={14} strokeWidth={2} />
                </button>
              ))}
            </div>
          )}
          <PrimaryButton onClick={() => setShowNewModal(true)}>
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Novo Card</span>
            <span className="sm:hidden">Novo</span>
          </PrimaryButton>
        </div>
      </div>

      {/* === MOBILE VIEW: lista por estágio === */}
      {isMobile ? (
        <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-4">
          {STAGES.map((stage) => {
            const stageCards = cards.filter((c) => c.stage === stage.key);
            if (stageCards.length === 0) return null;
            const total = stageCards.reduce((acc, c) => acc + Number(c.value), 0);
            return (
              <div key={stage.key} className="mb-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: stage.accent }} />
                  <span className="text-[13px] font-semibold text-text-1">{stage.label}</span>
                  <span className="text-[11px] font-semibold text-text-3 bg-surface-2 border border-border rounded-full px-1.5">
                    {stageCards.length}
                  </span>
                  <span className="text-[11px] text-text-3 ml-auto">{formatCurrencyShort(total)}</span>
                </div>
                {stageCards.map(c => (
                  <KanbanCard
                    key={c.id}
                    card={c}
                    onDragStart={() => {}}
                    onClick={() => setEditingCard(c)}
                  />
                ))}
              </div>
            );
          })}
          {cards.length === 0 && (
            <div className="py-12 text-center text-[13px] text-text-3">
              Nenhum card. Toque "Novo" pra criar o primeiro.
            </div>
          )}
        </div>
      ) : (
        /* === DESKTOP === */
        <>
          {viewMode === 'kanban' ? (
            <div className="flex gap-2.5 flex-1 min-h-0 overflow-x-auto pb-2">
              {STAGES.map((stage) => {
                const stageCards = cards.filter((c) => c.stage === stage.key);
                const total = stageCards.reduce((acc, c) => acc + Number(c.value), 0);
                const isOver = overStage === stage.key;
                const isCollapsed = collapsed[stage.key];

                return (
                  <div
                    key={stage.key}
                    onDragOver={(e) => { e.preventDefault(); setOverStage(stage.key); }}
                    onDragLeave={() => setOverStage(null)}
                    onDrop={() => handleDrop(stage.key)}
                    className={`rounded-xl border flex flex-col flex-shrink-0 overflow-hidden transition-all duration-200 ${
                      isOver ? 'border-accent bg-accent-bg' : 'border-border bg-surface-2'
                    }`}
                    style={{
                      width: isCollapsed ? 48 : 240,
                      minWidth: isCollapsed ? 48 : 240,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCollapse(stage.key)}
                      className={`w-full flex items-center gap-2 cursor-pointer ${
                        isCollapsed ? 'flex-col py-3 px-2' : 'px-3 py-3'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: stage.accent }}
                      />
                      {isCollapsed ? (
                        <span
                          className="text-[10px] font-semibold text-text-2 tracking-wider"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                          {stage.label}
                        </span>
                      ) : (
                        <>
                          <span className="text-[12px] font-semibold text-text-1 flex-1 text-left">
                            {stage.label}
                          </span>
                          <span className="text-[11px] font-semibold text-text-3 bg-surface border border-border rounded-full px-1.5">
                            {stageCards.length}
                          </span>
                          <ChevronLeft size={12} className="text-text-3" />
                        </>
                      )}
                    </button>

                    {!isCollapsed && (
                      <>
                        <div className="text-[11px] text-text-3 px-3 pb-2 flex-shrink-0">
                          {formatCurrencyShort(total)}
                        </div>
                        <div className="flex-1 overflow-y-auto px-2 pb-2">
                          {stageCards.map((card) => (
                            <KanbanCard
                              key={card.id}
                              card={card}
                              onDragStart={() => setDragId(card.id)}
                              onClick={() => setEditingCard(card)}
                            />
                          ))}
                          {stageCards.length === 0 && (
                            <p className="text-[11px] text-text-3 text-center py-4">
                              Vazio
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table view */
            <div className="bg-surface border border-border rounded-xl overflow-hidden flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-surface z-10">
                  <tr className="border-b border-border">
                    {['Título', 'Contato', 'Estágio', 'Valor', 'Prob.'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-3 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cards
                    .filter((c) => c.stage !== 'won' && c.stage !== 'lost')
                    .map((card) => {
                      const stage = STAGES.find((s) => s.key === card.stage);
                      return (
                        <tr
                          key={card.id}
                          onClick={() => setEditingCard(card)}
                          className="border-b border-border hover:bg-surface-2 transition cursor-pointer"
                        >
                          <td className="px-4 py-2.5 font-medium text-text-1">{card.title}</td>
                          <td className="px-4 py-2.5 text-text-2">
                            <div>{card.contact?.name ?? '—'}</div>
                            {card.contact?.company && (
                              <div className="text-[11px] text-text-3">{card.contact.company}</div>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
                              <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ background: stage?.accent }}
                              />
                              {stage?.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-semibold" style={{ color: 'var(--green)' }}>
                            {formatCurrency(Number(card.value))}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <div className="h-1 w-14 bg-border rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-accent rounded-full"
                                  style={{ width: `${card.probability}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-text-3">{card.probability}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal de edição */}
      <CardEditModal
        open={!!editingCard}
        card={editingCard}
        onClose={() => setEditingCard(null)}
      />

      {/* New Card Modal */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="Novo Card">
        <form onSubmit={handleCreate}>
          <FormField label="Título *">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="Ex: Contrato SENAI Joinville"
            />
          </FormField>
          <FormField label="Valor (R$) *">
            <Input
              type="number"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder="0,00"
              required
            />
          </FormField>
          <FormField label="Contato *">
            <Select
              value={form.contactId}
              onChange={(e) => setForm({ ...form, contactId: e.target.value })}
              required
            >
              <option value="">Selecione...</option>
              {contactList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` (${c.company})` : ''}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Etapa">
            <Select
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value as CardStage })}
            >
              {STAGES.filter((s) => s.key !== 'won' && s.key !== 'lost').map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </Select>
          </FormField>
          <PrimaryButton type="submit" fullWidth disabled={createMut.isPending}>
            {createMut.isPending ? 'Criando...' : 'Criar Card'}
          </PrimaryButton>
        </form>
      </Modal>
    </div>
  );
}
