import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, contactService, cardService } from '../services';
import { formatDateTime } from '../utils/format';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import { Plus, Check, Clock, Phone, Mail, Users, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '../models';

const TYPE_ICONS: Record<string, any> = { call: Phone, meeting: Users, email: Mail, follow_up: Clock, other: MoreHorizontal };
const PRIORITY_COLORS = { low: 'border-l-gray-500', medium: 'border-l-yellow-500', high: 'border-l-red-500' };
const STATUS_COLORS = { pending: 'bg-yellow-400/10 text-yellow-400', completed: 'bg-emerald-400/10 text-emerald-400', cancelled: 'bg-gray-400/10 text-gray-400' };

export default function Calendar() {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'other', priority: 'medium', dueDate: '', contactId: '', cardId: '' });

  const { data: tasks } = useQuery({
    queryKey: ['tasks-by-date', selectedDate],
    queryFn: () => taskService.getByDate(selectedDate),
  });
  const { data: contacts } = useQuery({ queryKey: ['contacts-mini'], queryFn: () => contactService.list('', 1, 100) });
  const { data: cards } = useQuery({ queryKey: ['cards-mini'], queryFn: () => cardService.list(1, 100) });

  const taskList = (tasks || []) as Task[];
  const contactList = (contacts?.data || []) as any[];
  const cardList = (cards?.data || []) as any[];

  const createMut = useMutation({
    mutationFn: (data: any) => taskService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks-by-date'] }); setShowModal(false); toast.success('Tarefa criada!'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro'),
  });

  const completeMut = useMutation({
    mutationFn: (id: number) => taskService.update(id, { status: 'completed' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks-by-date'] }); toast.success('Tarefa concluída!'); },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // Garante formato ISO válido — datetime-local retorna "YYYY-MM-DDTHH:mm" sem segundos
    const parsedDate = form.dueDate ? new Date(form.dueDate.length === 16 ? form.dueDate + ':00' : form.dueDate) : null;
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      toast.error('Data/Hora inválida');
      return;
    }
    const data: any = { title: form.title, type: form.type, priority: form.priority, dueDate: parsedDate.toISOString() };
    if (form.description) data.description = form.description;
    if (form.contactId) data.contactId = parseInt(form.contactId);
    if (form.cardId) data.cardId = parseInt(form.cardId);
    createMut.mutate(data);
  };

  const changeDate = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-gray-500 mt-1">{taskList.length} tarefas no dia</p>
        </div>
        <button onClick={() => { setForm({ ...form, dueDate: `${selectedDate}T09:00` }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition">
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      {/* Date Picker */}
      <div className="flex items-center gap-4">
        <button onClick={() => changeDate(-1)} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"><ChevronLeft size={18} /></button>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500" />
        <button onClick={() => changeDate(1)} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"><ChevronRight size={18} /></button>
        <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="text-sm text-indigo-400 hover:text-indigo-300">Hoje</button>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {taskList.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-500">
            Nenhuma tarefa para este dia
          </div>
        ) : (
          taskList.map((task) => {
            const Icon = TYPE_ICONS[task.type] || MoreHorizontal;
            return (
              <div key={task.id} className={`bg-gray-900 border border-gray-800 rounded-xl p-4 border-l-4 ${PRIORITY_COLORS[task.priority]} flex items-center gap-4`}>
                <button onClick={() => task.status === 'pending' && completeMut.mutate(task.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600 hover:border-indigo-500'}`}>
                  {task.status === 'completed' && <Check size={14} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Icon size={12} /> {task.type}</span>
                    <span>{formatDateTime(task.dueDate)}</span>
                    {task.contact && <span>→ {task.contact.name}</span>}
                    {task.card && <span>• {task.card.title}</span>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[task.status]}`}>{task.status}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nova Tarefa">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Título *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white">
                <option value="call">Ligação</option><option value="meeting">Reunião</option><option value="email">Email</option>
                <option value="follow_up">Follow-up</option><option value="other">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Prioridade</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white">
                <option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Data/Hora *</label>
            <input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Contato</label>
              <select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white">
                <option value="">Nenhum</option>
                {contactList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Card</label>
              <select value={form.cardId} onChange={(e) => setForm({ ...form, cardId: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white">
                <option value="">Nenhum</option>
                {cardList.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={createMut.isPending}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition disabled:opacity-50">
            {createMut.isPending ? 'Criando...' : 'Criar Tarefa'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
