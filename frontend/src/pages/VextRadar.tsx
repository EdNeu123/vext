import { useQuery } from '@tanstack/react-query';
import { aiService } from '../services';
import { formatCurrency } from '../utils/format';
import { Radar, AlertTriangle, TrendingUp, User, DollarSign, ShieldAlert, RefreshCw } from 'lucide-react';
import DevBanner from '../components/ui/DevBanner';

const CHURN_COLORS = { low: 'text-emerald-400', medium: 'text-yellow-400', high: 'text-red-400' };

export default function VextRadar() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vext-radar'],
    queryFn: () => aiService.getVextRadar(),
  });

  const radar = data as any;
  const churnAlerts = radar?.churnAlerts || [];
  const repurchaseOpportunities = radar?.repurchaseOpportunities || [];

  return (
    <div className="space-y-6">
      <DevBanner />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
            <Radar size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Vext Radar</h1>
            <p className="text-gray-500 mt-0.5">Inteligência de churn e oportunidades de recompra</p>
          </div>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Analisando dados...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Churn Alerts */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <ShieldAlert size={20} className="text-red-400" />
              <h3 className="text-lg font-semibold">Alertas de Churn</h3>
              <span className="ml-auto text-xs px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full">{churnAlerts.length}</span>
            </div>

            {churnAlerts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Nenhum alerta de churn no momento</p>
            ) : (
              <div className="space-y-3">
                {churnAlerts.map((contact: any) => (
                  <div key={contact.id} className="flex items-center gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <AlertTriangle size={18} className="text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-gray-500">{contact.company || contact.email || 'Sem empresa'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${CHURN_COLORS[contact.churnRisk as keyof typeof CHURN_COLORS] || 'text-red-400'}`}>
                        Risco Alto
                      </p>
                      <p className="text-[10px] text-gray-500">LTV: {formatCurrency(Number(contact.ltv) || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Repurchase Opportunities */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={20} className="text-emerald-400" />
              <h3 className="text-lg font-semibold">Oportunidades de Recompra</h3>
              <span className="ml-auto text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">{repurchaseOpportunities.length}</span>
            </div>

            {repurchaseOpportunities.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Nenhuma oportunidade identificada</p>
            ) : (
              <div className="space-y-3">
                {repurchaseOpportunities.map((contact: any) => (
                  <div key={contact.id} className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <DollarSign size={18} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-gray-500">{contact.company || contact.email || 'Sem empresa'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-400">
                        {formatCurrency(Number(contact.ltv) || 0)}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {contact.totalPurchases} compras
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-2">Como funciona o Vext Radar?</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          O Vext Radar analisa automaticamente seus contatos para identificar riscos de churn (clientes com alta probabilidade de cancelamento)
          e oportunidades de recompra (clientes com baixo risco de churn que não compram há mais de 30 dias, ordenados por LTV).
          Use esses insights para priorizar suas ações de retenção e upsell.
        </p>
      </div>
    </div>
  );
}
