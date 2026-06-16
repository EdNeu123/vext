import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

import { taskService, contactService, cardService } from '../services';
import type { Task, TaskType, TaskPriority } from '../models';

import Modal from '../components/ui/Modal';
import PrimaryButton from '../components/ui/PrimaryButton';
import { FormField, Input, Select, Textarea } from '../components/ui/Form';
import MonthCalendar from '../components/calendar/MonthCalendar';
import DayTimeline from '../components/calendar/DayTimeline';

const TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: 'call',      label: 'Ligação' },
  { value: 'meeting',   label: 'Reunião' },
  { value: 'email',     label: 'E-mail' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'other',     label: 'Outro' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low',    label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high',   label: 'Alta' },
];

function toLocalDateTimeInput(date: Date): string {
  // YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function Calendar() {
  const qc = useQueryClient();

  // Data atual selecionada (ponto de partida = hoje)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Detecta mobile pra reordenar timeline / mês
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Carrega tasks do mês visível (pra pintar bolinhas no calendário do mês)
  const monthYear = visibleMonth.getFullYear();
  const monthIdx  = visibleMonth.getMonth(); // 0-indexed, 0-11
  const { data: monthTasks } = useQuery({
    queryKey: ['tasks-by-month', monthYear, monthIdx],
    queryFn: () => taskService.getByMonth(monthYear, monthIdx),
  });

  // Tasks do dia selecionado (mais detalhe — vem do mesmo set ou da chamada by-date pra garantir freshness)
  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const { data: dayTasksData } = useQuery({
    queryKey: ['tasks-by-date', selectedDateStr],
    queryFn: () => taskService.getByDate(selectedDateStr),
  });

  // Lista pra dropdowns do modal de criação
  const { data: contactsResult } = useQuery({
    queryKey: ['contacts-list'],
    queryFn: () => contactService.list('', 1, 200),
  });
  const { data: cardsResult } = useQuery({
    queryKey: ['cards'],
    queryFn: () => cardService.list(1, 200),
  });
  const contactList = ((contactsResult as any)?.data || []) as { id: number; name: string; company: string | null }[];
  const cardList = ((cardsResult as any)?.data || []) as { id: number; title: string }[];

  // Source de tasks visíveis: prefer dayTasks; fallback monthTasks
  const monthTasksList = useMemo(() => {
    if (Array.isArray(monthTasks)) return monthTasks as Task[];
    return [] as Task[];
  }, [monthTasks]);
  const dayTasksList = useMemo(() => {
    if (Array.isArray(dayTasksData)) return dayTasksData as Task[];
    return [] as Task[];
  }, [dayTasksData]);

  // Mutations
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => taskService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks-by-date', selectedDateStr] });
      qc.invalidateQueries({ queryKey: ['tasks-by-month'] });
      qc.invalidateQueries({ queryKey: ['dashboard-today-tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks-upcoming'] });
    },
  });

  const handleToggleComplete = (id: number) => {
    const t = dayTasksList.find(x => x.id === id);
    if (!t) return;
    const next = t.status === 'completed' ? 'pending' : 'completed';
    updateMut.mutate({
      id,
      data: {
        status: next,
        completedAt: next === 'completed' ? new Date().toISOString() : null,
      },
    });
    toast.success(next === 'completed' ? 'Tarefa concluída' : 'Tarefa reaberta');
  };

  // Modal de criação
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'follow_up' as TaskType,
    priority: 'medium' as TaskPriority,
    dueDate: '',
    description: '',
    contactId: '',
    cardId: '',
  });

  const openCreateModal = () => {
    // Pré-preenche horário sugerido = data selecionada às 09:00 (ou hora atual + 1h se for hoje)
    const base = new Date(selectedDate);
    const today = new Date();
    if (base.getFullYear() === today.getFullYear() && base.getMonth() === today.getMonth() && base.getDate() === today.getDate()) {
      base.setHours(today.getHours() + 1, 0, 0, 0);
    } else {
      base.setHours(9, 0, 0, 0);
    }
    setForm(f => ({ ...f, dueDate: toLocalDateTimeInput(base) }));
    setShowModal(true);
  };

  const createMut = useMutation({
    mutationFn: (data: any) => taskService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks-by-date', selectedDateStr] });
      qc.invalidateQueries({ queryKey: ['tasks-by-month'] });
      qc.invalidateQueries({ queryKey: ['dashboard-today-tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks-upcoming'] });
      setShowModal(false);
      setForm({
        title: '', type: 'follow_up', priority: 'medium',
        dueDate: '', description: '', contactId: '', cardId: '',
      });
      toast.success('Tarefa criada');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao criar tarefa'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({
      title: form.title,
      type: form.type,
      priority: form.priority,
      status: 'pending',
      dueDate: new Date(form.dueDate).toISOString(),
      description: form.description || null,
      contactId: form.contactId ? parseInt(form.contactId) : null,
      cardId: form.cardId ? parseInt(form.cardId) : null,
    });
  };

  // Mês navigator
  const handleChangeMonth = (delta: -1 | 1) => {
    setVisibleMonth(d => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  const goToToday = () => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    setSelectedDate(todayStart);
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const pendingDay = dayTasksList.filter(t => t.status === 'pending').length;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header da página */}
      <div className="flex items-start justify-between mb-3 sm:mb-4 flex-wrap gap-3 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-text-1 tracking-tight">Agenda</h1>
          <p className="text-[12px] sm:text-[13px] text-text-3 mt-1">
            {selectedDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
            {' · '}
            {pendingDay} pendente{pendingDay !== 1 ? 's' : ''}
          </p>
        </div>
        <PrimaryButton onClick={openCreateModal}>
          <Plus size={14} strokeWidth={2.5} />
          <span className="hidden sm:inline">Nova tarefa</span>
          <span className="sm:hidden">Nova</span>
        </PrimaryButton>
      </div>

      {/* Layout responsivo:
          - Desktop: timeline à esquerda (flex-1), mês à direita (largura fixa 320px)
          - Mobile: timeline em cima (altura fixa), mês embaixo */}
      {isMobile ? (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          {/* Timeline ocupa altura fixa em mobile pra dar espaço ao mês embaixo */}
          <div className="h-[420px] flex-shrink-0">
            <DayTimeline
              date={selectedDate}
              tasks={dayTasksList}
              onToggleComplete={handleToggleComplete}
            />
          </div>
          <div className="flex-shrink-0">
            <MonthCalendar
              visibleMonth={visibleMonth}
              selectedDate={selectedDate}
              tasks={monthTasksList}
              onSelectDate={setSelectedDate}
              onChangeMonth={handleChangeMonth}
              onGoToToday={goToToday}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_320px] gap-4 flex-1 min-h-0">
          <DayTimeline
            date={selectedDate}
            tasks={dayTasksList}
            onToggleComplete={handleToggleComplete}
          />
          <div>
            <MonthCalendar
              visibleMonth={visibleMonth}
              selectedDate={selectedDate}
              tasks={monthTasksList}
              onSelectDate={setSelectedDate}
              onChangeMonth={handleChangeMonth}
              onGoToToday={goToToday}
            />
          </div>
        </div>
      )}

      {/* Modal de criação */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nova Tarefa" size="md">
        <form onSubmit={handleCreate}>
          <FormField label="Título *">
            <Input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
              placeholder="Ex: Ligar pra confirmar proposta"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Tipo">
              <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as TaskType })}>
                {TYPE_OPTIONS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Prioridade">
              <Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Quando *">
            <Input
              type="datetime-local"
              value={form.dueDate}
              onChange={e => setForm({ ...form, dueDate: e.target.value })}
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Contato (opcional)">
              <Select value={form.contactId} onChange={e => setForm({ ...form, contactId: e.target.value })}>
                <option value="">Nenhum</option>
                {contactList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.company ? ` (${c.company})` : ''}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Card (opcional)">
              <Select value={form.cardId} onChange={e => setForm({ ...form, cardId: e.target.value })}>
                <option value="">Nenhum</option>
                {cardList.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Descrição">
            <Textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Detalhes (opcional)"
            />
          </FormField>

          <PrimaryButton type="submit" fullWidth disabled={createMut.isPending}>
            {createMut.isPending ? 'Criando...' : 'Criar tarefa'}
          </PrimaryButton>
        </form>
      </Modal>
    </div>
  );
}
