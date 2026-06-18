import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService, inviteService } from '../services';
import { formatCurrency, formatCurrencyShort } from '../utils/format';
import { initialsOf, colorForName } from '../utils/avatar';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import PrimaryButton from '../components/ui/PrimaryButton';
import { FormField, Input, Select } from '../components/ui/Form';
import Avatar from '../components/ui/Avatar';
import { Plus, Trophy, Star } from 'lucide-react';
import type { User } from '../models';

interface RankingEntry {
  id: number;
  name: string;
  totalValue?: number;
  total?: number;
  value?: number;
  salesGoal?: number | null;
}

export default function Team() {
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'seller' });

  const { data: teamData } = useQuery({
    queryKey: ['team'],
    queryFn: () => teamService.list(),
  });
  const { data: rankingData } = useQuery({
    queryKey: ['team-ranking'],
    queryFn: () => teamService.getSellerRanking(),
  });

  const team = (teamData ?? []) as User[];
  const ranking = (() => {
    if (Array.isArray(rankingData)) return rankingData as RankingEntry[];
    if (rankingData && Array.isArray((rankingData as any).ranking)) {
      return (rankingData as any).ranking as RankingEntry[];
    }
    return [] as RankingEntry[];
  })();

  const inviteMut = useMutation({
    mutationFn: (data: any) => inviteService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      setShowInvite(false);
      setInviteForm({ name: '', email: '', role: 'seller' });
      toast.success('Convite enviado!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao enviar convite'),
  });

  const goalTotal = ranking.reduce((acc, r) => acc + (r.salesGoal ?? 0), 0) || 60000;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;
    inviteMut.mutate(inviteForm);
  };

  return (
    <div className="max-w-[1000px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-1 tracking-tight">Equipe</h1>
          <p className="text-[13px] text-text-3 mt-1">{team.length} membros ativos</p>
        </div>
        <PrimaryButton onClick={() => setShowInvite(true)}>
          <Plus size={14} strokeWidth={2.5} />
          Convidar
        </PrimaryButton>
      </div>

      {/* Member cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {team.map((m) => {
          const memberRank = ranking.find((r) => r.id === m.id);
          const memberValue = memberRank?.totalValue ?? memberRank?.total ?? memberRank?.value ?? 0;
          const memberGoal = m.salesGoal ?? 0;
          const pct = memberGoal > 0 ? Math.min((memberValue / memberGoal) * 100, 100) : 0;

          return (
            <div
              key={m.id}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar
                  initials={initialsOf(m.name)}
                  size={40}
                  color={colorForName(m.name)}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-text-1 flex items-center gap-1.5">
                    <span className="truncate">{m.name}</span>
                    {m.role === 'admin' && (
                      <Star size={11} className="text-warning flex-shrink-0" fill="currentColor" />
                    )}
                  </div>
                  <div className="text-[11px] text-text-3 truncate">{m.email}</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    m.role === 'admin'
                      ? 'bg-accent-bg text-accent'
                      : 'bg-surface-2 text-text-2'
                  }`}
                >
                  {m.role === 'admin' ? 'Administrador' : 'Vendedor'}
                </span>
                <span className="text-[11px] text-text-3">
                  {m.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              {memberGoal > 0 && (
                <div className="mt-2.5">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-text-3">Meta mensal</span>
                    <span className="text-[10px] text-text-3">{formatCurrencyShort(memberGoal)}</span>
                  </div>
                  <div className="h-[3px] bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ranking */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={16} className="text-warning" />
          <span className="text-[14px] font-semibold text-text-1">Ranking de Vendedores · do mês</span>
        </div>
        {ranking.length === 0 ? (
          <p className="text-[12px] text-text-3 py-3 text-center">Sem dados de ranking ainda.</p>
        ) : (
          ranking.map((s, i) => {
            const value = s.totalValue ?? s.total ?? s.value ?? 0;
            const pct = Math.min((value / goalTotal) * 100, 100);
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
              >
                <span className="w-6 text-center flex-shrink-0">
                  {i < 3 ? (
                    <span className="text-[16px]">{medals[i]}</span>
                  ) : (
                    <span className="text-[13px] text-text-3">{i + 1}</span>
                  )}
                </span>
                <Avatar initials={initialsOf(s.name)} size={32} color={colorForName(s.name)} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-text-1 mb-1 truncate">{s.name}</div>
                  <div className="h-[3px] bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[13px] font-semibold text-success">
                    {formatCurrencyShort(value)}
                  </div>
                  <div className="text-[10px] text-text-3">
                    {Math.round((value / goalTotal) * 100)}% da meta
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invite Modal */}
      <Modal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        title="Convidar Membro"
        size="sm"
      >
        <form onSubmit={handleInvite}>
          <FormField label="Nome *">
            <Input
              value={inviteForm.name}
              onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Email *">
            <Input
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Função">
            <Select
              value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
            >
              <option value="seller">Vendedor</option>
              <option value="admin">Administrador</option>
            </Select>
          </FormField>
          <PrimaryButton type="submit" fullWidth disabled={inviteMut.isPending}>
            {inviteMut.isPending ? 'Enviando...' : 'Enviar Convite'}
          </PrimaryButton>
        </form>
      </Modal>
    </div>
  );
}
