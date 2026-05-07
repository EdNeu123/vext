import { useEffect, useRef } from 'react';
import { Phone, Users, Mail, Calendar as CalIcon, MoreHorizontal, Check } from 'lucide-react';
import type { Task, TaskType, TaskPriority } from '../../models';

interface Props {
  date: Date;
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onTaskClick?: (task: Task) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 8-20h
const HOUR_H = 56; // px por hora
const TIMELINE_H = HOUR_H * HOURS.length;

const TYPE_ICON: Record<TaskType, typeof Phone> = {
  call: Phone,
  meeting: Users,
  email: Mail,
  follow_up: CalIcon,
  other: MoreHorizontal,
};

const TYPE_LABEL: Record<TaskType, string> = {
  call: 'Ligação',
  meeting: 'Reunião',
  email: 'E-mail',
  follow_up: 'Follow-up',
  other: 'Outro',
};

const PRIORITY_ACCENT: Record<TaskPriority, string> = {
  low: '#9CA3AF',
  medium: 'var(--accent)',
  high: '#EA580C',
};

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DayTimeline({ date, tasks, onToggleComplete, onTaskClick }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const isToday = isSameDay(date, today);

  // Tasks do dia
  const dayTasks = tasks.filter(t => isSameDay(new Date(t.dueDate), date));

  // Scroll automático pra hora atual quando é hoje (só na primeira renderização do dia)
  useEffect(() => {
    if (!isToday || !scrollerRef.current) return;
    const nowH = today.getHours() + today.getMinutes() / 60;
    const offset = Math.max(0, (nowH - 8 - 1) * HOUR_H);
    scrollerRef.current.scrollTop = offset;
  }, [date.getTime(), isToday]);

  const getTaskTop = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours() + d.getMinutes() / 60;
    return Math.max(0, (h - 8) * HOUR_H);
  };

  // Posição da linha "agora"
  const nowH = today.getHours() + today.getMinutes() / 60;
  const nowTop = (nowH - 8) * HOUR_H;
  const showNowLine = isToday && nowH >= 8 && nowH <= 20;

  const dateLabel = date.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const dateLabelCap = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
  const pendingCount = dayTasks.filter(t => t.status === 'pending').length;

  return (
    <div className="bg-surface border border-border rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-text-1 capitalize truncate">{dateLabelCap}</div>
          <div className="text-[11px] text-text-3 mt-0.5">
            {dayTasks.length === 0
              ? 'Sem tarefas'
              : `${dayTasks.length} tarefa${dayTasks.length > 1 ? 's' : ''} · ${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      {/* Timeline com scroll interno */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto">
        <div className="flex relative" style={{ height: TIMELINE_H }}>
          {/* Eixo das horas */}
          <div className="w-12 flex-shrink-0 border-r border-border relative">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute left-0 right-0 px-2 text-right"
                style={{ top: (h - 8) * HOUR_H - 6 }}
              >
                <span className="text-[10px] text-text-3 font-medium tabular-nums">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Grid + tasks */}
          <div className="flex-1 relative">
            {/* Linhas das horas */}
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-border"
                style={{ top: (h - 8) * HOUR_H }}
              />
            ))}
            {/* Linhas das meias-horas */}
            {HOURS.map(h => (
              <div
                key={`half-${h}`}
                className="absolute left-0 right-0 border-t border-dashed border-border"
                style={{ top: (h - 8) * HOUR_H + HOUR_H / 2, opacity: 0.5 }}
              />
            ))}

            {/* Linha do "agora" */}
            {showNowLine && (
              <div
                className="absolute left-0 right-0 z-[2]"
                style={{ top: nowTop, borderTop: '2px solid var(--accent)' }}
              >
                <span
                  className="absolute w-2 h-2 rounded-full"
                  style={{ background: 'var(--accent)', top: -5, left: -4 }}
                />
              </div>
            )}

            {/* Tasks */}
            {dayTasks.map(t => {
              const top = getTaskTop(t.dueDate);
              const Icon = TYPE_ICON[t.type] ?? MoreHorizontal;
              const isCompleted = t.status === 'completed';
              const minH = t.type === 'meeting' ? HOUR_H : HOUR_H * 0.6;
              return (
                <div
                  key={t.id}
                  className="absolute left-2 right-2 rounded-md border flex items-start gap-2 px-2.5 py-1.5 cursor-pointer transition overflow-hidden z-[1]"
                  style={{
                    top,
                    height: minH,
                    background: isCompleted ? 'var(--surface-2)' : 'var(--accent-bg)',
                    borderColor: isCompleted ? 'var(--border)' : 'var(--accent)',
                    borderLeft: `3px solid ${PRIORITY_ACCENT[t.priority]}`,
                    opacity: isCompleted ? 0.6 : 1,
                  }}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    onTaskClick?.(t);
                  }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleComplete(t.id); }}
                    className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center transition"
                    style={{
                      borderColor: isCompleted ? 'var(--green)' : 'var(--border-2)',
                      background: isCompleted ? 'var(--green)' : 'transparent',
                    }}
                    aria-label={isCompleted ? 'Reabrir' : 'Concluir'}
                  >
                    {isCompleted && <Check size={10} color="white" strokeWidth={3} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[12px] font-semibold text-text-1 truncate"
                      style={{ textDecoration: isCompleted ? 'line-through' : 'none' }}
                    >
                      {t.title}
                    </div>
                    <div className="text-[10px] text-text-3 truncate flex items-center gap-1 mt-0.5">
                      <Icon size={10} strokeWidth={1.8} />
                      {new Date(t.dueDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{TYPE_LABEL[t.type]}
                      {t.contact ? ` · ${t.contact.name}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}

            {dayTasks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-[12px] text-text-3 text-center px-4">
                  Nenhuma tarefa neste dia
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
