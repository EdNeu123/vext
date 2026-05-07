import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contactService } from '../services';
import { formatCurrencyShort } from '../utils/format';
import { initialsOf, colorForName } from '../utils/avatar';
import Avatar from '../components/ui/Avatar';
import { Radar, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import type { Contact } from '../models';

export default function VextRadar() {
  const qc = useQueryClient();

  const { data: churnData, isFetching: loadingChurn } = useQuery({
    queryKey: ['radar-churn'],
    queryFn: () => contactService.getHighChurnRisk(),
  });
  const { data: repurchaseData, isFetching: loadingRep } = useQuery({
    queryKey: ['radar-repurchase'],
    queryFn: () => contactService.getRepurchaseOpportunities(),
  });

  const churn = (churnData ?? []) as Contact[];
  const repurchase = (repurchaseData ?? []) as Contact[];
  const isRefreshing = loadingChurn || loadingRep;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['radar-churn'] });
    qc.invalidateQueries({ queryKey: ['radar-repurchase'] });
  };

  return (
    <div className="max-w-[1000px]">
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-6 flex-wrap">
        <div className="w-11 h-11 rounded-xl bg-accent-bg flex items-center justify-center flex-shrink-0">
          <Radar size={22} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-1 tracking-tight">Vext Radar</h1>
          <p className="text-[13px] text-text-3 mt-0.5">
            Inteligência de churn e oportunidades de recompra
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 rounded-md text-[12px] font-medium bg-surface border border-border text-text-2 hover:text-text-1 hover:border-border-2 disabled:opacity-50 transition flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Churn Alerts */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-danger" />
            <span className="text-[13px] font-semibold text-text-1">Alertas de Churn</span>
            <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-danger-bg text-danger font-semibold">
              {churn.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {churn.length === 0 ? (
              <p className="text-[12px] text-text-3 py-4 text-center">
                Nenhum risco de churn no momento. 🎉
              </p>
            ) : (
              churn.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-danger-bg"
                  style={{ borderColor: 'color-mix(in srgb, var(--red) 25%, transparent)' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-danger-bg"
                    style={{ border: '1px solid var(--red)' }}
                  >
                    <AlertTriangle size={16} className="text-danger" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-text-1 truncate">{c.name}</div>
                    <div className="text-[11px] text-text-3 truncate">{c.company ?? '—'}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[12px] font-semibold text-danger">
                      Risco {c.churnRisk === 'high' ? 'Alto' : 'Médio'}
                    </div>
                    <div className="text-[10px] text-text-3">LTV: {formatCurrencyShort(c.ltv)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Repurchase Opportunities */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-success" />
            <span className="text-[13px] font-semibold text-text-1">Oportunidades de Recompra</span>
            <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-success-bg text-success font-semibold">
              {repurchase.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {repurchase.length === 0 ? (
              <p className="text-[12px] text-text-3 py-4 text-center">
                Sem oportunidades identificadas no momento.
              </p>
            ) : (
              repurchase.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-success-bg"
                  style={{ borderColor: 'color-mix(in srgb, var(--green) 25%, transparent)' }}
                >
                  <Avatar initials={initialsOf(c.name)} size={36} color={colorForName(c.name)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-text-1 truncate">{c.name}</div>
                    <div className="text-[11px] text-text-3 truncate">
                      {c.company ?? '—'} · {c.totalPurchases} compra{c.totalPurchases === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[12px] font-semibold text-success">
                      {formatCurrencyShort(c.ltv)}
                    </div>
                    <div className="text-[10px] text-text-3">LTV total</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-accent-bg border border-border rounded-xl p-5">
        <div className="text-[13px] font-semibold text-text-1 mb-1.5">
          Como funciona o Vext Radar?
        </div>
        <p className="text-[13px] text-text-2 leading-relaxed">
          O Vext Radar analisa automaticamente seus contatos para identificar{' '}
          <strong>riscos de churn</strong> e{' '}
          <strong>oportunidades de recompra</strong>. Clientes com baixo risco e
          sem compras recentes são ordenados por LTV para priorizar suas ações.
        </p>
      </div>
    </div>
  );
}
