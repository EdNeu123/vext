import { Link } from 'react-router-dom';
import { Calendar, Phone, Mail, Users, MoreHorizontal } from 'lucide-react';
import type { Task } from '../../models';

interface Props {
  tasks: Task[];
  daysAhead?: number;
}

const TYPE_ICON: Record<string, typeof Phone> = {
  call: Phone,
  meeting: Users,
  email: Mail,
  follow_up: Calendar,
  other: MoreHorizontal,
};

const TYPE_LABEL: Record<string, string> = {
  call: 'Ligação',
  meeting: 'Reunião',
  email: 'E-mail',
  follow_up: 'Follow-up',
  other: 'Outro',
};

function fmtDay(date: Date, today: Date): string {
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = (startTarget - startToday) / (24 * 60 * 60 * 1000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/**
 * Widget de próximas ações.
 * Altura FIXA — se tiver muitas tasks, scroll dentro do widget.
 */
export default function UpcomingTasksWidget({ tasks, daysAhead = 3 }: Props) {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead, 23, 59, 59);

  // Todas as upcoming — quem rola é o widget
  const upcoming = tasks
    .filter(t => t.status === 'pending')
    .filter(t => {
      const d = new Date(t.dueDate);
      return d >= now && d <= cutoff;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 h-[320px] flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar size={15} className="text-text-3 flex-shrink-0" strokeWidth={1.8} />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-text-1">Próximas ações</div>
            <div className="text-[11px] text-text-3 mt-0.5 truncate">
              Próximos {daysAhead} dias
              {upcoming.length > 0 && ` · ${upcoming.length}`}
            </div>
          </div>
        </div>
        <Link to="/calendar" className="text-[11px] text-accent font-medium hover:opacity-80 flex-shrink-0">
          Ver agenda →
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        {upcoming.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-4">
            <p className="text-[12px] text-text-3">
              Nenhuma tarefa nos próximos {daysAhead} dias.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {upcoming.map(t => {
              const Icon = TYPE_ICON[t.type] ?? MoreHorizontal;
              const date = new Date(t.dueDate);
              return (
                <li key={t.id} className="py-2.5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-surface-2 flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-text-3" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-text-1 truncate">{t.title}</div>
                    <div className="text-[11px] text-text-3 truncate">
                      {TYPE_LABEL[t.type]}
                      {t.contact ? ` · ${t.contact.name}` : ''}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[12px] font-semibold text-text-1">{fmtDay(date, now)}</div>
                    <div className="text-[10px] text-text-3">
                      {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
