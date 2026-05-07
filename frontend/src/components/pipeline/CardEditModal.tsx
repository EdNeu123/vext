import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Clock, Plus, Tag as TagIcon, ArrowRightLeft, FileText, Phone, Mail, Users, Calendar as CalIcon, Check } from 'lucide-react';

import { cardService, contactService, tagService, taskService } from '../../services';
import type { CardEvent } from '../../services/card.service';
import type { Card, CardStage } from '../../models';
import { formatCurrency } from '../../utils/format';
import { initialsOf, colorForName } from '../../utils/avatar';

import Avatar from '../ui/Avatar';
import PrimaryButton from '../ui/PrimaryButton';
import { FormField, Input, Select, Textarea } from '../ui/Form';

interface Props {
  open: boolean;
  card: Card | null;
  onClose: () => void;
}

const STAGES: { key: CardStage; label: string; color: string }[] = [
  { key: 'prospecting',   label: 'Prospecção',   color: '#93C5FD' },
  { key: 'qualification', label: 'Qualificação', color: '#FCD34D' },
  { key: 'presentation',  label: 'Apresentação', color: '#C4B5FD' },
  { key: 'negotiation',   label: 'Negociação',   color: '#FCA5A5' },
  { key: 'won',           label: 'Ganho',        color: '#5DCAA5' },
  { key: 'lost',          label: 'Perdido',      color: '#9CA3AF' },
];

type Tab = 'details' | 'history' | 'tasks';

const TASK_TYPES: { value: string; label: string; icon: typeof Phone }[] = [
  { value: 'call',      label: 'Ligação',  icon: Phone },
  { value: 'meeting',   label: 'Reunião',  icon: Users },
  { value: 'email',     label: 'E-mail',   icon: Mail },
  { value: 'follow_up', label: 'Follow-up', icon: CalIcon },
  { value: 'other',     label: 'Outro',    icon: FileText },
];

// Mapa de tipo de evento -> { ícone, label, cor }
const EVENT_VISUAL: Record<string, { icon: typeof Plus; label: string; color: string }> = {
  created:         { icon: Plus,           label: 'Criado',           color: 'var(--green)' },
  stage_changed:   { icon: ArrowRightLeft, label: 'Mudou estágio',    color: 'var(--accent)' },
  value_changed:   { icon: ArrowRightLeft, label: 'Alterou valor',    color: 'var(--accent)' },
  contact_changed: { icon: Users,          label: 'Mudou contato',    color: 'var(--accent)' },
  tags_changed:    { icon: TagIcon,        label: 'Atualizou tags',   color: 'var(--accent)' },
  note_added:      { icon: FileText,       label: 'Anotou',           color: 'var(--text-2)' },
  task_scheduled:  { icon: CalIcon,        label: 'Agendou tarefa',   color: 'var(--accent)' },
  closed_won:      { icon: Check,          label: 'Fechou (ganho)',   color: 'var(--green)' },
  closed_lost:     { icon: X,              label: 'Perdeu',           color: 'var(--red)' },
  reopened:        { icon: ArrowRightLeft, label: 'Reabriu',          color: 'var(--yellow)' },
  edited:          { icon: FileText,       label: 'Editou',           color: 'var(--text-2)' },
};

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const h = Math.floor(min / 60);
  const d = Math.floor(h / 24);
  if (sec < 60) return 'agora';
  if (min < 60) return `${min} min atrás`;
  if (h < 24) return `${h}h atrás`;
  if (d < 7) return `${d}d atrás`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CardEditModal({ open, card, onClose }: Props) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('details');

  // Form state
  const [form, setForm] = useState({
    title: '',
    value: '',
    contactId: '',
    stage: 'prospecting' as CardStage,
    probability: 10,
    notes: '',
    nextFollowUpDate: '',
    tagIds: [] as number[],
  });

  // Resetar form quando card muda
  useEffect(() => {
    if (card) {
      setForm({
        title: card.title ?? '',
        value: String(card.value ?? ''),
        contactId: String(card.contactId ?? ''),
        stage: card.stage ?? 'prospecting',
        probability: card.probability ?? 10,
        notes: card.notes ?? '',
        nextFollowUpDate: card.nextFollowUpDate ? card.nextFollowUpDate.slice(0, 10) : '',
        tagIds: (card.tags ?? []).map(t => t.id),
      });
      setTab('details');
    }
  }, [card?.id]);

  // Queries pra dropdowns
  const { data: contactsResult } = useQuery({
    queryKey: ['contacts-list'],
    queryFn: () => contactService.list('', 1, 200),
    enabled: open,
  });
  const { data: tags } = useQuery({
    queryKey: ['tags-list-active'],
    queryFn: () => tagService.list(false),
    enabled: open,
  });
  const { data: events } = useQuery({
    queryKey: ['card-events', card?.id],
    queryFn: () => cardService.getEvents(card!.id),
    enabled: open && !!card?.id && tab === 'history',
  });

  const contactList = (((contactsResult as any)?.data) || []) as { id: number; name: string; company: string | null }[];
  const tagList = (tags ?? []) as { id: number; label: string; color: string; isActive: boolean }[];

  // Update mutation
  const updateMut = useMutation({
    mutationFn: (data: any) => cardService.update(card!.id, data),
    onSuccess: () => {
      // Invalidate cache pra refletir em todas as telas
      qc.invalidateQueries({ queryKey: ['cards'] });
      qc.invalidateQueries({ queryKey: ['card-events', card?.id] });
      qc.invalidateQueries({ queryKey: ['card-stats'] });
      qc.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Card atualizado');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao atualizar'),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMut.mutate({
      title: form.title,
      value: parseFloat(form.value || '0'),
      contactId: parseInt(form.contactId),
      stage: form.stage,
      probability: form.probability,
      notes: form.notes || null,
      nextFollowUpDate: form.nextFollowUpDate || null,
      tagIds: form.tagIds,
    });
  };

  // ── TASK CREATION (aba Agenda) ──
  const [taskForm, setTaskForm] = useState({
    title: '',
    type: 'follow_up',
    dueDate: '',
    description: '',
  });

  const createTaskMut = useMutation({
    mutationFn: (data: any) => taskService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks-upcoming'] });
      qc.invalidateQueries({ queryKey: ['dashboard-today-tasks'] });
      qc.invalidateQueries({ queryKey: ['card-events', card?.id] });
      setTaskForm({ title: '', type: 'follow_up', dueDate: '', description: '' });
      toast.success('Tarefa agendada');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao agendar'),
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    createTaskMut.mutate({
      title: taskForm.title,
      type: taskForm.type,
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(taskForm.dueDate).toISOString(),
      description: taskForm.description || null,
      cardId: card.id,
      contactId: card.contactId,
    });
  };

  // Tags toggle
  const toggleTag = (id: number) => {
    setForm(f => ({
      ...f,
      tagIds: f.tagIds.includes(id) ? f.tagIds.filter(t => t !== id) : [...f.tagIds, id],
    }));
  };

  if (!open || !card) return null;

  const stageInfo = STAGES.find(s => s.key === card.stage);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal — full screen em mobile, alinhado ao topo em desktop com respiro acima */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:pt-16 sm:px-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-surface w-full h-full sm:h-auto sm:max-h-[calc(100vh-6rem)] sm:max-w-3xl sm:rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-3 px-4 sm:px-6 py-4 border-b border-border flex-shrink-0">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
              style={{ background: stageInfo?.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-text-3 uppercase tracking-wider font-semibold">
                {stageInfo?.label} · {formatCurrency(Number(card.value))}
              </div>
              <h2 className="text-[16px] sm:text-[18px] font-bold text-text-1 truncate mt-0.5">
                {card.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-text-3 hover:text-text-1 transition flex-shrink-0 p-1"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border flex-shrink-0 overflow-x-auto">
            {([
              { key: 'details' as Tab, label: 'Detalhes' },
              { key: 'history' as Tab, label: 'Histórico' },
              { key: 'tasks' as Tab,   label: 'Agendar tarefa' },
            ]).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-[13px] font-medium transition border-b-2 whitespace-nowrap ${
                  tab === t.key
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-3 hover:text-text-1'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content (scroll interno) */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {tab === 'details' && (
              <form onSubmit={handleSave}>
                <FormField label="Título *">
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Valor (R$) *">
                    <Input
                      type="number"
                      step="0.01"
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                      required
                    />
                  </FormField>
                  <FormField label="Probabilidade (%)">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.probability}
                      onChange={(e) => setForm({ ...form, probability: parseInt(e.target.value) || 0 })}
                    />
                  </FormField>
                </div>

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
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Próxima ação (data)">
                  <Input
                    type="date"
                    value={form.nextFollowUpDate}
                    onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })}
                  />
                </FormField>

                <FormField label="Tags">
                  <div className="flex flex-wrap gap-1.5 p-2 border border-border rounded-md min-h-[44px] bg-surface">
                    {tagList.length === 0 && (
                      <span className="text-[12px] text-text-3 self-center px-1">Nenhuma tag disponível</span>
                    )}
                    {tagList.map((tag) => {
                      const selected = form.tagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className="text-[11px] px-2 py-0.5 rounded-full font-medium transition"
                          style={{
                            background: selected ? tag.color + '33' : 'var(--surface-2)',
                            color: selected ? tag.color : 'var(--text-3)',
                            border: `1px solid ${selected ? tag.color + '66' : 'var(--border)'}`,
                          }}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </FormField>

                <FormField label="Descrição / notas">
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={4}
                    placeholder="Anotações sobre a oportunidade..."
                  />
                </FormField>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-[13px] font-medium text-text-2 hover:text-text-1 transition"
                  >
                    Cancelar
                  </button>
                  <PrimaryButton type="submit" disabled={updateMut.isPending}>
                    {updateMut.isPending ? 'Salvando...' : 'Salvar alterações'}
                  </PrimaryButton>
                </div>
              </form>
            )}

            {tab === 'history' && (
              <div>
                {!events && (
                  <div className="py-10 text-center text-[12px] text-text-3">Carregando histórico...</div>
                )}
                {events && events.length === 0 && (
                  <div className="py-10 text-center text-[12px] text-text-3">
                    Nenhum evento registrado ainda.
                  </div>
                )}
                {events && events.length > 0 && (
                  <ol className="relative ml-3 border-l border-border">
                    {(events as CardEvent[]).map((ev) => {
                      const visual = EVENT_VISUAL[ev.type] ?? EVENT_VISUAL.edited;
                      const Icon = visual.icon;
                      return (
                        <li key={ev.id} className="ml-4 mb-4 last:mb-0">
                          <span
                            className="absolute -left-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--surface)', border: `1.5px solid ${visual.color}` }}
                          >
                            <Icon size={10} style={{ color: visual.color }} strokeWidth={2.2} />
                          </span>
                          <div className="bg-surface-2 border border-border rounded-md px-3 py-2">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[12px] font-semibold text-text-1">{visual.label}</span>
                              <span className="text-[10px] text-text-3 whitespace-nowrap">
                                {fmtRelative(ev.createdAt)}
                              </span>
                            </div>
                            {(ev.fromValue || ev.toValue) && (
                              <div className="text-[12px] text-text-2">
                                {ev.fromValue && <span className="line-through text-text-3">{ev.fromValue}</span>}
                                {ev.fromValue && ev.toValue && <span className="mx-1.5 text-text-3">→</span>}
                                {ev.toValue && <span className="font-medium">{ev.toValue}</span>}
                              </div>
                            )}
                            {ev.description && (
                              <div className="text-[12px] text-text-2 mt-1">{ev.description}</div>
                            )}
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Avatar
                                initials={initialsOf(ev.userName)}
                                size={16}
                                color={colorForName(ev.userName)}
                              />
                              <span className="text-[10px] text-text-3">{ev.userName}</span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            )}

            {tab === 'tasks' && (
              <form onSubmit={handleCreateTask}>
                <p className="text-[12px] text-text-3 mb-3">
                  A tarefa fica vinculada a este card e ao contato. Aparece na agenda e no dashboard.
                </p>

                <FormField label="Título *">
                  <Input
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    required
                    placeholder="Ex: Ligar para confirmar proposta"
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Tipo">
                    <Select
                      value={taskForm.type}
                      onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                    >
                      {TASK_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Quando *">
                    <Input
                      type="datetime-local"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      required
                    />
                  </FormField>
                </div>

                <FormField label="Descrição">
                  <Textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    rows={3}
                    placeholder="Detalhes (opcional)"
                  />
                </FormField>

                <div className="flex items-center gap-2 mt-3 p-3 bg-surface-2 rounded-md text-[12px] text-text-2">
                  <Clock size={14} className="text-text-3 flex-shrink-0" />
                  Vinculado a <strong className="text-text-1">{card.title}</strong>
                  {card.contact && <> · contato <strong className="text-text-1">{card.contact.name}</strong></>}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <PrimaryButton type="submit" disabled={createTaskMut.isPending}>
                    {createTaskMut.isPending ? 'Agendando...' : 'Agendar tarefa'}
                  </PrimaryButton>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
