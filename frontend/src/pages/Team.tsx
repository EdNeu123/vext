import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteService, workspaceService } from '../services';
import { useTeamStore } from '../store/teamStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrencyShort } from '../utils/format';
import { initialsOf, colorForName } from '../utils/avatar';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import PrimaryButton from '../components/ui/PrimaryButton';
import { FormField, Input, Select } from '../components/ui/Form';
import Avatar from '../components/ui/Avatar';
import { Plus, Trophy, Crown, Shield, MoreVertical } from 'lucide-react';
import type { TeamMember } from '../models';

interface RankingEntry {
  id: number;
  name: string;
  totalValue?: number;
  total?: number;
  value?: number;
  salesGoal?: number | null;
}

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  admin:     { label: 'Administrador', className: 'bg-accent-bg text-accent' },
  moderator: { label: 'Moderador',     className: 'bg-warning-bg text-warning' },
  seller:    { label: 'Vendedor',      className: 'bg-surface-2 text-text-2' },
};

export default function Team() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { activeTeam } = useTeamStore();
  const [showInvite, setShowInvite] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTarget, setTransferTarget] = useState<TeamMember | null>(null);
  const [openMenuFor, setOpenMenuFor] = useState<number | null>(null);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'seller' });

  const isAdmin     = activeTeam?.role === 'admin';
  const isModerator = activeTeam?.role === 'moderator';
  const canManage   = isAdmin || isModerator;

  const { data: teamDetails } = useQuery({
    queryKey: ['team-details', activeTeam?.id],
    queryFn: () => workspaceService.getTeam(activeTeam!.id),
    enabled: !!activeTeam,
  });

  const { data: membersData = [] } = useQuery<TeamMember[]>({
    queryKey: ['team-members', activeTeam?.id],
    queryFn: () => workspaceService.listMembers(activeTeam!.id) as Promise<TeamMember[]>,
    enabled: !!activeTeam,
  });

  const { data: rankingData } = useQuery({
    queryKey: ['team-ranking', activeTeam?.id],
    queryFn: () => workspaceService.getSellerRanking(activeTeam!.id),
    enabled: !!activeTeam,
  });

  const memberLimit = (teamDetails as any)?.memberLimit ?? 6;

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
      setShowInvite(false);
      setInviteForm({ name: '', email: '', role: 'seller' });
      toast.success('Convite enviado!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao enviar convite'),
  });

  const updateRoleMut = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: 'moderator' | 'seller' }) =>
      workspaceService.updateMember(activeTeam!.id, userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-members', activeTeam?.id] });
      toast.success('Papel atualizado!');
      setOpenMenuFor(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao atualizar papel'),
  });

  const removeMemberMut = useMutation({
    mutationFn: (userId: number) => workspaceService.removeMember(activeTeam!.id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-members', activeTeam?.id] });
      qc.invalidateQueries({ queryKey: ['team-details', activeTeam?.id] });
      toast.success('Membro removido');
      setOpenMenuFor(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao remover membro'),
  });

  const transferMut = useMutation({
    mutationFn: (newOwnerUserId: number) =>
      workspaceService.transferOwnership(activeTeam!.id, newOwnerUserId),
    onSuccess: () => {
      toast.success('Posse da equipe transferida! Suas permissões serão atualizadas na próxima ação.');
      setShowTransfer(false);
      setTransferTarget(null);
      qc.invalidateQueries({ queryKey: ['team-members', activeTeam?.id] });
      qc.invalidateQueries({ queryKey: ['team-details', activeTeam?.id] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao transferir posse'),
  });

  const goalTotal = ranking.reduce((acc, r) => acc + (r.salesGoal ?? 0), 0) || 60000;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;
    if (membersData.length >= memberLimit) {
      toast.error(`Limite de ${memberLimit} membros do plano atingido. Faça upgrade para convidar mais pessoas.`);
      return;
    }
    inviteMut.mutate(inviteForm);
  };

  return (
    <div className="max-w-[1000px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-1 tracking-tight">Equipe</h1>
          <p className="text-[13px] text-text-3 mt-1">
            {membersData.length} / {memberLimit} membros
            {membersData.length >= memberLimit && (
              <span className="text-warning ml-1.5">· limite do plano atingido</span>
            )}
          </p>
        </div>
        {canManage && (
          <PrimaryButton onClick={() => setShowInvite(true)}>
            <Plus size={14} strokeWidth={2.5} />
            Convidar
          </PrimaryButton>
        )}
      </div>

      {/* Member cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {membersData.map((m) => {
          const memberRank = ranking.find((r) => r.id === m.user.id);
          const memberValue = memberRank?.totalValue ?? memberRank?.total ?? memberRank?.value ?? 0;
          const memberGoal = m.user.salesGoal ?? 0;
          const pct = memberGoal > 0 ? Math.min((memberValue / memberGoal) * 100, 100) : 0;
          const roleCfg = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.seller;
          const isSelf = m.userId === user?.id;

          return (
            <div
              key={m.userId}
              className="bg-surface border border-border rounded-xl p-4 relative"
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar
                  initials={initialsOf(m.user.name)}
                  size={40}
                  color={colorForName(m.user.name)}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-text-1 flex items-center gap-1.5">
                    <span className="truncate">{m.user.name}</span>
                    {m.role === 'admin' && (
                      <Crown size={11} className="text-warning flex-shrink-0" fill="currentColor" />
                    )}
                    {m.role === 'moderator' && (
                      <Shield size={11} className="text-warning flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] text-text-3 truncate">{m.user.email}</div>
                </div>

                {/* Menu de gerenciamento — oculto para o próprio card e para quem não pode gerenciar */}
                {canManage && !isSelf && m.role !== 'admin' && (
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setOpenMenuFor(openMenuFor === m.userId ? null : m.userId)}
                      className="p-1 rounded hover:bg-surface-2 text-text-3"
                    >
                      <MoreVertical size={14} />
                    </button>

                    {openMenuFor === m.userId && (
                      <div className="absolute right-0 top-7 z-10 w-48 bg-surface border border-border rounded-lg shadow-lg py-1 text-[12px]">
                        {isAdmin && (
                          <button
                            className="w-full text-left px-3 py-2 hover:bg-surface-2 text-text-1"
                            onClick={() =>
                              updateRoleMut.mutate({
                                userId: m.userId,
                                role: m.role === 'moderator' ? 'seller' : 'moderator',
                              })
                            }
                          >
                            {m.role === 'moderator' ? 'Rebaixar para Vendedor' : 'Promover a Moderador'}
                          </button>
                        )}
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-surface-2 text-danger"
                          onClick={() => {
                            if (confirm(`Remover ${m.user.name} da equipe?`)) removeMemberMut.mutate(m.userId);
                          }}
                        >
                          Remover da equipe
                        </button>
                        {isAdmin && (
                          <button
                            className="w-full text-left px-3 py-2 hover:bg-surface-2 text-text-1"
                            onClick={() => {
                              setTransferTarget(m);
                              setShowTransfer(true);
                              setOpenMenuFor(null);
                            }}
                          >
                            Transferir administração
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${roleCfg.className}`}>
                  {roleCfg.label}
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
              <option value="moderator">Moderador</option>
              {/* 'admin' nunca é atribuível por convite — apenas via transferência de posse */}
            </Select>
          </FormField>
          <PrimaryButton type="submit" fullWidth disabled={inviteMut.isPending}>
            {inviteMut.isPending ? 'Enviando...' : 'Enviar Convite'}
          </PrimaryButton>
        </form>
      </Modal>

      {/* Transfer Ownership Modal */}
      <Modal
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        title="Transferir administração"
        size="sm"
      >
        <p className="text-[13px] text-text-2 mb-4">
          Você está prestes a transferir a administração desta equipe para{' '}
          <strong>{transferTarget?.user.name}</strong>. Você se tornará <strong>Moderador</strong> e
          perderá os poderes de administrador. Esta ação não pode ser desfeita por você sozinho —
          apenas o novo administrador poderá transferir de volta.
        </p>
        <PrimaryButton
          fullWidth
          disabled={transferMut.isPending}
          onClick={() => transferTarget && transferMut.mutate(transferTarget.userId)}
        >
          {transferMut.isPending ? 'Transferindo...' : 'Confirmar transferência'}
        </PrimaryButton>
      </Modal>
    </div>
  );
}
