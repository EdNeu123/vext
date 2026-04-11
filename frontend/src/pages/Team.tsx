import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService, inviteService } from '../services';
import { formatCurrency, formatRelative } from '../utils/format';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import { useAuthStore } from '../store/authStore';
import { Plus, Trophy, Copy, UserX, Crown, Shield } from 'lucide-react';
import DevBanner from '../components/ui/DevBanner';

export default function Team() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const { data: members } = useQuery({ queryKey: ['team'], queryFn: () => teamService.list() });
  const { data: ranking } = useQuery({ queryKey: ['team-ranking'], queryFn: () => teamService.getSellerRanking() });
  const { data: invites } = useQuery({ queryKey: ['invites'], queryFn: () => inviteService.list(), enabled: isAdmin });

  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'seller' as 'admin' | 'seller' });

  const createInvite = useMutation({
    mutationFn: (d: any) => inviteService.create(d),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['invites'] });
      setShowInvite(false);
      toast.success(`Convite criado! Token: ${data.token}`);
      navigator.clipboard.writeText(data.token);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro'),
  });

  const revokeMut = useMutation({
    mutationFn: (id: number) => inviteService.revoke(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invites'] }); toast.success('Convite revogado!'); },
  });

  const memberList = (members || []) as any[];
  const rankingList = (ranking || []) as any[];
  const inviteList = (invites || []) as any[];

  return (
    <div className="space-y-6">
      <DevBanner />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipe</h1>
          <p className="text-gray-500 mt-1">{memberList.length} membros ativos</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition">
            <Plus size={16} /> Convidar
          </button>
        )}
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {memberList.map((m: any) => (
          <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-lg font-bold">
                {m.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{m.name}</p>
                  {m.role === 'admin' ? <Crown size={14} className="text-amber-400" /> : <Shield size={14} className="text-gray-500" />}
                </div>
                <p className="text-xs text-gray-500">{m.email}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-between text-xs text-gray-500">
              <span>{m.role === 'admin' ? 'Administrador' : 'Vendedor'}</span>
              <span>Último acesso: {m.lastSignedIn ? formatRelative(m.lastSignedIn) : 'Nunca'}</span>
            </div>
            {m.salesGoal && (
              <div className="mt-2 text-xs text-gray-500">Meta: {formatCurrency(Number(m.salesGoal))}</div>
            )}
          </div>
        ))}
      </div>

      {/* Seller Ranking */}
      {rankingList.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={20} className="text-amber-400" />
            <h3 className="text-lg font-semibold">Ranking de Vendedores</h3>
          </div>
          <div className="space-y-3">
            {rankingList.map((s: any, i: number) => (
              <div key={s.id} className="flex items-center gap-4">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-gray-400/20 text-gray-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-800 text-gray-500'}`}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${Math.min(s.progress, 100)}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{formatCurrency(s.totalValue)}</p>
                  <p className="text-[10px] text-gray-500">{s.dealsCount} cards</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invites (admin only) */}
      {isAdmin && inviteList.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Convites</h3>
          <div className="space-y-2">
            {inviteList.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                <div>
                  <p className="text-sm font-medium">{inv.name} ({inv.email})</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${inv.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' : inv.status === 'used' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                      {inv.status}
                    </span>
                    <button onClick={() => { navigator.clipboard.writeText(inv.token); toast.success('Token copiado!'); }}
                      className="text-gray-500 hover:text-white transition"><Copy size={12} /></button>
                  </div>
                </div>
                {inv.status === 'pending' && (
                  <button onClick={() => revokeMut.mutate(inv.id)} className="text-gray-500 hover:text-red-400 transition" title="Revogar">
                    <UserX size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Convidar Membro" size="sm">
        <form onSubmit={(e) => { e.preventDefault(); createInvite.mutate(inviteForm); }} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome</label>
            <input value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Função</label>
            <select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="seller">Vendedor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <button type="submit" disabled={createInvite.isPending}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition disabled:opacity-50">
            {createInvite.isPending ? 'Criando...' : 'Enviar Convite'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
