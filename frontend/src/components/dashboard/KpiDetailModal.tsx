import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboard.service';
import type { TimeseriesMetric, TimeseriesPeriod } from '../../services/dashboard.service';
import { formatCurrency, formatCurrencyShort } from '../../utils/format';
import Modal from '../ui/Modal';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  metric: TimeseriesMetric;
  title: string;
}

const PERIODS: { key: TimeseriesPeriod; label: string }[] = [
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: '12m', label: '12 meses' },
];

/**
 * Formata o valor de acordo com a métrica.
 * - pipeline / won / avgTicket: moeda BRL
 * - conversion: percentual
 */
function fmtValue(metric: TimeseriesMetric, value: number, short = false): string {
  if (metric === 'conversion') return `${value.toFixed(0)}%`;
  return short ? formatCurrencyShort(value) : formatCurrency(value);
}

function fmtDate(metric: TimeseriesPeriod, dateStr: string): string {
  if (metric === '12m') {
    // YYYY-MM
    const [y, m] = dateStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[Number(m) - 1]}/${y.slice(2)}`;
  }
  // YYYY-MM-DD
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

export default function KpiDetailModal({ open, onClose, metric, title }: Props) {
  const [period, setPeriod] = useState<TimeseriesPeriod>('30d');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-timeseries', metric, period],
    queryFn: () => dashboardService.getTimeseries(metric, period),
    enabled: open,
  });

  const points = data?.points ?? [];
  const cmp = data?.comparison;

  // SVG chart geometry
  const chartW = 720;
  const chartH = 220;
  const padL = 50;
  const padR = 16;
  const padT = 20;
  const padB = 32;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const { yMax, yMin, pathD, areaD, dotsXY } = useMemo(() => {
    if (points.length === 0) return { yMax: 0, yMin: 0, pathD: '', areaD: '', dotsXY: [] };
    const values = points.map(p => p.value);
    const max = Math.max(...values, 1);
    const min = 0; // sempre começa do zero pra honestidade visual
    const range = max - min || 1;
    const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;
    const xy = points.map((p, i) => {
      const x = padL + i * stepX;
      const y = padT + innerH - ((p.value - min) / range) * innerH;
      return { x, y, value: p.value, date: p.date };
    });
    const path = xy.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const area = path + ` L${xy[xy.length - 1].x.toFixed(1)},${(padT + innerH).toFixed(1)} L${xy[0].x.toFixed(1)},${(padT + innerH).toFixed(1)} Z`;
    return { yMax: max, yMin: min, pathD: path, areaD: area, dotsXY: xy };
  }, [points, innerW, innerH, padL, padT]);

  // Y-axis ticks (0, mid, max)
  const yTicks = [yMin, (yMin + yMax) / 2, yMax];

  // Direção do delta
  const delta = cmp?.deltaPct ?? null;
  const trendIcon = delta === null
    ? <Minus size={14} />
    : delta > 0 ? <TrendingUp size={14} /> : delta < 0 ? <TrendingDown size={14} /> : <Minus size={14} />;
  const trendColor = delta === null
    ? 'var(--text-3)'
    : delta > 0 ? 'var(--green)' : delta < 0 ? 'var(--red)' : 'var(--text-3)';

  return (
    <Modal open={open} onClose={onClose} title={title} size="xl">
      {/* Period switcher */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex border border-border rounded-md overflow-hidden">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-[12px] font-medium transition ${
                period === p.key ? 'bg-accent text-white' : 'bg-transparent text-text-2 hover:bg-surface-2'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {cmp && (
          <div className="flex items-center gap-3 text-[12px]">
            <div>
              <div className="text-text-3">Período atual</div>
              <div className="font-semibold text-text-1 text-[14px]">{fmtValue(metric, cmp.current)}</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-text-3">Período anterior</div>
              <div className="font-semibold text-text-1 text-[14px]">{fmtValue(metric, cmp.previous)}</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-1.5" style={{ color: trendColor }}>
              {trendIcon}
              <span className="font-semibold text-[14px]">
                {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta}%`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="bg-surface-2 rounded-lg p-4 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-[220px] text-[13px] text-text-3">
            Carregando…
          </div>
        ) : points.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-[13px] text-text-3">
            Sem dados pro período selecionado
          </div>
        ) : (
          <>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto" preserveAspectRatio="none">
              {/* Grid lines + Y labels */}
              {yTicks.map((t, i) => {
                const y = padT + innerH - ((t - yMin) / (yMax - yMin || 1)) * innerH;
                return (
                  <g key={i}>
                    <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="var(--border)" strokeDasharray="3 3" />
                    <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--text-3)">
                      {fmtValue(metric, t, true)}
                    </text>
                  </g>
                );
              })}

              {/* Area + Line */}
              <path d={areaD} fill="var(--accent)" fillOpacity="0.08" />
              <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

              {/* Dots */}
              {dotsXY.map((c, i) => (
                <g key={i}>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={hoverIdx === i ? 5 : 3}
                    fill="var(--accent)"
                    stroke="var(--surface)"
                    strokeWidth="2"
                    style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                  />
                  {/* Hit area maior pra hover */}
                  <rect
                    x={c.x - 16}
                    y={padT}
                    width={32}
                    height={innerH}
                    fill="transparent"
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(null)}
                    style={{ cursor: 'pointer' }}
                  />
                </g>
              ))}

              {/* X labels - de 4 em 4 pra não polluir */}
              {dotsXY.map((c, i) => {
                const everyN = period === '7d' ? 1 : period === '30d' ? 5 : 1;
                if (i % everyN !== 0 && i !== dotsXY.length - 1) return null;
                return (
                  <text key={i} x={c.x} y={chartH - 10} textAnchor="middle" fontSize="10" fill="var(--text-3)">
                    {fmtDate(period, c.date)}
                  </text>
                );
              })}
            </svg>

            {/* Tooltip */}
            {hoverIdx !== null && dotsXY[hoverIdx] && (
              <div
                className="absolute pointer-events-none bg-surface border border-border rounded-md px-3 py-2 shadow-lg"
                style={{
                  left: `${(dotsXY[hoverIdx].x / chartW) * 100}%`,
                  top: `${(dotsXY[hoverIdx].y / chartH) * 100}%`,
                  transform: 'translate(-50%, -120%)',
                }}
              >
                <div className="text-[10px] text-text-3 mb-0.5">{fmtDate(period, dotsXY[hoverIdx].date)}</div>
                <div className="text-[13px] font-semibold text-text-1">
                  {fmtValue(metric, dotsXY[hoverIdx].value)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Insights */}
      {cmp && points.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Stat label="Máximo" value={fmtValue(metric, Math.max(...points.map(p => p.value)))} />
          <Stat label="Mínimo" value={fmtValue(metric, Math.min(...points.map(p => p.value)))} />
          <Stat
            label="Média"
            value={fmtValue(metric, points.reduce((a, p) => a + p.value, 0) / points.length)}
          />
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-2 border border-border rounded-md px-3 py-2">
      <div className="text-[10px] text-text-3 uppercase tracking-wide">{label}</div>
      <div className="text-[14px] font-semibold text-text-1 mt-0.5">{value}</div>
    </div>
  );
}
