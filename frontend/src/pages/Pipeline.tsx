import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealService, contactService } from '../services';
import { formatCurrency } from '../utils/format';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { Plus, GripVertical, DollarSign } from 'lucide-react';
import type { Deal, DealStage } from '../models';

const STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: 'prospecting', label: 'Prospecção', color: 'border-blue-500/30 bg-blue-500/5' },
  { key: 'qualification', label: 'Qualificação', color: 'border-yellow-500/30 bg-yellow-500/5' },
  { key: 'presentation', label: 'Apresentação', color: 'border-purple-500/30 bg-purple-500/5' },
  { key: 'negotiation', label: 'Negociação', color: 'border-orange-500/30 bg-orange-500/5' },
  { key: 'won', label: 'Ganhos ✅', color: 'border-emerald-500/30 bg-emerald-500/5' },
  { key: 'lost', label: 'Perdidos ❌', color: 'border-red-500/30 bg-red-500/5' },
];

export default function Pipeline() {
  const qc = useQueryClient();
  const { data: result } = useQuery({ queryKey: ['deals'], queryFn: () => dealService.list(1, 200) });
  const { data: contacts } = useQuery({ queryKey: ['contacts-list'], queryFn: () => contactService.list('', 1, 200) });
  const deals = (result?.data || []) as Deal[];
  const contactList = (contacts?.data || []) as any[];

  const [showModal, setShowModal] = useState(false);
  const [dragDeal, setDragDeal] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', value: '', contactId: '', stage: 'prospecting' as DealStage });

  const createMut = useMutation({
    mutationFn: (data: any) => dealService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deals'] }); setShowModal(false); toast.success('Deal criado!'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => dealService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deals'] }); },
  });

  const handleDragStart = (dealId: number) => setDragDeal(dealId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (stage: DealStage) => {
    if (dragDeal) {
      const deal = deals.find((d) => d.id === dragDeal);
      if (deal && deal.stage !== stage) {
        updateMut.mutate({ id: dragDeal, data: { stage } });
        toast.success(`Deal movido para ${STAGES.find((s) => s.key === stage)?.label}`);
      }
      setDragDeal(null);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ title: form.title, value: parseFloat(form.value), contactId: parseInt(form.contactId), stage: form.stage });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-gray-500 mt-1">Arraste os deals entre as colunas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition">
          <Plus size={16} /> Novo Deal
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key);
          const totalValue = stageDeals.reduce((acc, d) => acc + Number(d.value), 0);

          return (
            <div key={stage.key}
              className={`min-w-[280px] w-[280px] flex-shrink-0 border rounded-2xl p-4 ${stage.color}`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.key)}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{stage.label}</h3>
                <span className="text-xs text-gray-500">{stageDeals.length}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{formatCurrency(totalValue)}</p>

              <div className="space-y-2">
                {stageDeals.map((deal) => (
                  <div key={deal.id} draggable onDragStart={() => handleDragStart(deal.id)}
                    className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-gray-600 transition group">
                    <div className="flex items-start gap-2">
                      <GripVertical size={14} className="text-gray-600 mt-0.5 opacity-0 group-hover:opacity-100 transition" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{deal.title}</p>
                        <p className="text-xs text-gray-500 truncate">{deal.contact?.name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <DollarSign size={12} className="text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400">{formatCurrency(Number(deal.value))}</span>
                          <span className="text-[10px] text-gray-600 ml-auto">{deal.probability}%</span>
                        </div>
                        {deal.tags && deal.tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {deal.tags.map((tag) => (
                              <span key={tag.id} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: tag.color + '20', color: tag.color }}>
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Deal">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Título</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Valor</label>
            <input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Contato</label>
            <select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })} required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Selecione...</option>
              {contactList.map((c: any) => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Etapa</label>
            <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as DealStage })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {STAGES.filter((s) => !['won', 'lost'].includes(s.key)).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <button type="submit" disabled={createMut.isPending}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition disabled:opacity-50">
            {createMut.isPending ? 'Criando...' : 'Criar Deal'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
