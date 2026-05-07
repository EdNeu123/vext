import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '../../models';

interface Props {
  /** Mês exibido — primeiro dia do mês */
  visibleMonth: Date;
  /** Dia selecionado */
  selectedDate: Date;
  /** Tasks do mês (ou de qualquer período — só usadas pra contagem visual de bolinhas) */
  tasks: Task[];
  onSelectDate: (date: Date) => void;
  onChangeMonth: (delta: -1 | 1) => void;
  onGoToToday?: () => void;
}

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function MonthCalendar({
  visibleMonth,
  selectedDate,
  tasks,
  onSelectDate,
  onChangeMonth,
  onGoToToday,
}: Props) {
  const today = new Date();

  // Gera grid 6x7 começando no domingo da semana do dia 1.
  const grid = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstOfMonth.getDay(); // 0 = dom

    const cells: { date: Date; inMonth: boolean }[] = [];
    // Dias do mês anterior
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, 1 - (i + 1));
      cells.push({ date: d, inMonth: false });
    }
    // Dias do mês corrente
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true });
    }
    // Completa até 42 (6 semanas)
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
      cells.push({ date: next, inMonth: false });
    }
    return cells;
  }, [visibleMonth]);

  // Map de tasks por dia (yyyy-mm-dd -> count pendentes / count completas)
  const taskCountByDay = useMemo(() => {
    const map: Record<string, { pending: number; total: number }> = {};
    tasks.forEach(t => {
      const d = new Date(t.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = { pending: 0, total: 0 };
      map[key].total += 1;
      if (t.status === 'pending') map[key].pending += 1;
    });
    return map;
  }, [tasks]);

  const monthLabel = `${MONTH_NAMES[visibleMonth.getMonth()]} de ${visibleMonth.getFullYear()}`;

  return (
    <div className="bg-surface border border-border rounded-xl p-3 sm:p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <button
          onClick={() => onChangeMonth(-1)}
          className="p-1.5 rounded-md text-text-2 hover:text-text-1 hover:bg-surface-2 transition"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <div className="text-[13px] font-semibold text-text-1 capitalize leading-none">{monthLabel}</div>
          {onGoToToday && (
            <button
              onClick={onGoToToday}
              className="text-[10px] text-accent font-medium hover:opacity-80 transition mt-1"
            >
              Hoje
            </button>
          )}
        </div>
        <button
          onClick={() => onChangeMonth(1)}
          className="p-1.5 rounded-md text-text-2 hover:text-text-1 hover:bg-surface-2 transition"
          aria-label="Próximo mês"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-1 flex-shrink-0">
        {WEEK_DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-text-3 py-1 uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((cell, idx) => {
          const isToday = sameDay(cell.date, today);
          const isSelected = sameDay(cell.date, selectedDate);
          const key = `${cell.date.getFullYear()}-${String(cell.date.getMonth()).padStart(2, '0')}-${String(cell.date.getDate()).padStart(2, '0')}`;
          const count = taskCountByDay[key];

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(cell.date)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-md transition text-[12px] font-medium ${
                isSelected
                  ? 'bg-accent text-white font-semibold'
                  : isToday
                    ? 'bg-accent-bg text-accent font-semibold'
                    : cell.inMonth
                      ? 'text-text-1 hover:bg-surface-2'
                      : 'text-text-3 hover:bg-surface-2'
              }`}
              aria-label={cell.date.toLocaleDateString('pt-BR')}
              aria-pressed={isSelected}
            >
              <span>{cell.date.getDate()}</span>
              {/* Indicador de tasks */}
              {count && count.total > 0 && (
                <span className="absolute bottom-1 flex gap-0.5">
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{
                      background: isSelected
                        ? 'rgba(255,255,255,0.85)'
                        : count.pending > 0
                          ? 'var(--accent)'
                          : 'var(--text-3)',
                    }}
                  />
                  {count.total > 1 && (
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{
                        background: isSelected
                          ? 'rgba(255,255,255,0.55)'
                          : count.pending > 0
                            ? 'var(--accent)'
                            : 'var(--text-3)',
                        opacity: 0.6,
                      }}
                    />
                  )}
                  {count.total > 2 && (
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{
                        background: isSelected
                          ? 'rgba(255,255,255,0.35)'
                          : count.pending > 0
                            ? 'var(--accent)'
                            : 'var(--text-3)',
                        opacity: 0.4,
                      }}
                    />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
