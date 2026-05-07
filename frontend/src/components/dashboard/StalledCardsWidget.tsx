import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { formatCurrencyShort } from '../../utils/format';
import type { Card } from '../../models';

interface Props {
  cards: Card[];
  thresholdDays?: number;
}

const STAGE_LABEL: Record<string, string> = {
  prospecting: 'Prospecção',
  qualification: 'Qualificação',
  presentation: 'Apresentação',
  negotiation: 'Negociação',
};

const STAGE_COLOR: Record<string, string> = {
  prospecting: '#93C5FD',
  qualification: '#6EE7B7',
  presentation: '#C4B5FD',
  negotiation: '#6B7280',
};

/**
 * Widget de cards parados.
 * Altura FIXA — se houver muitos cards, scroll dentro do widget.
 */
export default function StalledCardsWidget({ cards, thresholdDays = 7 }: Props) {
  const now = Date.now();
  const cutoff = now - thresholdDays * 24 * 60 * 60 * 1000;

  // Todos os cards parados (sem limite — quem rola é o widget)
  const stalled = cards
    .filter(c => !['won', 'lost'].includes(c.stage))
    .filter(c => new Date(c.updatedAt).getTime() < cutoff)
    .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 h-[320px] flex flex-col">
      {/* Header fixo */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <AlertCircle size={15} className="text-text-3 flex-shrink-0" strokeWidth={1.8} />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-text-1">Cards parados</div>
            <div className="text-[11px] text-text-3 mt-0.5 truncate">
              Sem atualização há {thresholdDays}+ dias
              {stalled.length > 0 && ` · ${stalled.length}`}
            </div>
          </div>
        </div>
        <Link to="/pipeline" className="text-[11px] text-accent font-medium hover:opacity-80 flex-shrink-0">
          Ver todos →
        </Link>
      </div>

      {/* Lista com scroll interno */}
      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        {stalled.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-4">
            <p className="text-[12px] text-text-3">
              Tudo em dia. Nenhum card parado.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {stalled.map(c => {
              const daysAgo = Math.floor((now - new Date(c.updatedAt).getTime()) / (24 * 60 * 60 * 1000));
              return (
                <li key={c.id} className="py-2.5 flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: STAGE_COLOR[c.stage] ?? '#9CA3AF' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-text-1 truncate">{c.title}</div>
                    <div className="text-[11px] text-text-3 truncate">
                      {STAGE_LABEL[c.stage]} · {c.contact?.name ?? '—'}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[12px] font-semibold text-text-1">
                      {formatCurrencyShort(Number(c.value))}
                    </div>
                    <div className="text-[10px] text-text-3">há {daysAgo}d</div>
                  </div>
                  <Link
                    to="/pipeline"
                    className="text-text-3 hover:text-accent transition flex-shrink-0"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
