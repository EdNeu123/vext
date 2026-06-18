import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeamStore } from '../store/teamStore';
import { useAuthStore } from '../store/authStore';
import { workspaceService } from '../services/workspace.service';
import { toast } from 'sonner';
import PrimaryButton from '../components/ui/PrimaryButton';
import Modal from '../components/ui/Modal';
import { FormField, Input } from '../components/ui/Form';
import { Plus, LogIn, Users, Crown } from 'lucide-react';
import type { TeamMembership } from '../models';
import logoVext from '../assets/img/logo.png';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  moderator: 'Moderador',
  seller: 'Vendedor',
};

export default function WorkspaceSelector() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { setActiveTeam } = useTeamStore();
  const user = useAuthStore((s) => s.user);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [orgCode, setOrgCode] = useState('');

  const { data: memberships = [], refetch } = useQuery<TeamMembership[]>({
    queryKey: ['my-teams'],
    queryFn: () => workspaceService.listMyTeams() as Promise<TeamMembership[]>,
  });

  const createMut = useMutation({
    mutationFn: () => workspaceService.createTeam(teamName),
    onSuccess: () => {
      toast.success('Equipe criada!');
      setShowCreate(false);
      setTeamName('');
      refetch();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erro ao criar equipe'),
  });

  const joinMut = useMutation({
    mutationFn: () => workspaceService.joinByOrgCode(orgCode.toUpperCase()),
    onSuccess: () => {
      toast.success('Você entrou na equipe!');
      setShowJoin(false);
      setOrgCode('');
      refetch();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Código inválido'),
  });

  const handleSelectTeam = (m: TeamMembership) => {
    // Limpa todo o cache do React Query antes de trocar de equipe.
    // Isso garante que dados de uma equipe não apareçam brevemente em outra.
    qc.clear();

    setActiveTeam({
      id: m.team.id,
      name: m.team.name,
      slug: m.team.slug,
      ownerPlan: m.team.owner?.plan ?? 'free',
      ownerId: m.team.ownerId,
      role: m.role,
      memberCount: m.team._count?.members ?? 0,
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <img src={logoVext} alt="Vext CRM" className="w-24 h-24 object-contain mb-2" />
        <span className="text-2xl font-bold tracking-tight">
          <span className="text-text-1">Vext</span>
          <span className="text-accent"> CRM</span>
        </span>
        <p className="text-text-3 text-[13px] mt-1">
          Olá, {user?.name}. Escolha uma equipe para continuar.
        </p>
      </div>

      {/* Team list */}
      <div className="w-full max-w-md space-y-2 mb-4">
        {memberships.map((m) => (
          <button
            key={m.team.id}
            onClick={() => handleSelectTeam(m)}
            className="w-full flex items-center gap-3 bg-surface border border-border rounded-xl p-4 hover:border-accent hover:bg-accent-bg transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-accent-bg flex items-center justify-center shrink-0">
              <Users size={18} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-text-1 text-[14px] truncate">{m.team.name}</span>
                {m.role === 'admin' && <Crown size={12} className="text-accent shrink-0" />}
              </div>
              <span className="text-[12px] text-text-3">
                {m.team._count?.members ?? 0} membros · {ROLE_LABEL[m.role]}
                {m.role === 'admin' && (m.team.owner?.plan === 'premium' ? ' · Premium' : ' · Gratuito')}
              </span>
            </div>
            <LogIn size={16} className="text-text-3 shrink-0" />
          </button>
        ))}

        {memberships.length === 0 && (
          <div className="text-center py-8 text-text-3 text-[13px]">
            Você ainda não pertence a nenhuma equipe.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="w-full max-w-md flex gap-2">
        <PrimaryButton fullWidth onClick={() => setShowCreate(true)}>
          <Plus size={14} strokeWidth={2.5} />
          Nova equipe
        </PrimaryButton>
        <button
          onClick={() => setShowJoin(true)}
          className="flex-1 py-2.5 px-4 rounded-token border border-border text-text-2 text-[13px] font-medium hover:bg-surface-2 transition-colors flex items-center justify-center gap-1.5"
        >
          <LogIn size={14} />
          Entrar por código
        </button>
      </div>

      {/* Modal: Criar equipe */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nova equipe">
        <FormField label="Nome da equipe">
          <Input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Ex: Vendas SP"
            required
          />
        </FormField>
        <PrimaryButton
          fullWidth
          disabled={!teamName.trim() || createMut.isPending}
          onClick={() => createMut.mutate()}
        >
          {createMut.isPending ? 'Criando...' : 'Criar equipe'}
        </PrimaryButton>
      </Modal>

      {/* Modal: Entrar por código */}
      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Entrar por código">
        <FormField label="Código da equipe">
          <Input
            value={orgCode}
            onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
            placeholder="Ex: ABC123"
            maxLength={6}
            required
          />
        </FormField>
        <PrimaryButton
          fullWidth
          disabled={orgCode.length < 6 || joinMut.isPending}
          onClick={() => joinMut.mutate()}
        >
          {joinMut.isPending ? 'Entrando...' : 'Entrar na equipe'}
        </PrimaryButton>
      </Modal>
    </div>
  );
}
