import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Props {
  /** YYYY-MM format */
  value: string;
  onChange: (v: string) => void;
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function buildLast12(): { value: string; label: string }[] {
  const now = new Date();
  const out: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    out.push({
      value: `${yyyy}-${mm}`,
      label: `${MONTHS_PT[d.getMonth()]} ${yyyy}`,
    });
  }
  return out;
}

export default function MonthDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const months = buildLast12();
  const current = months.find(m => m.value === value) ?? months[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-2 border border-border text-text-2 text-[13px] font-medium hover:text-text-1 transition"
      >
        {current.label}
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-44 max-h-72 overflow-y-auto rounded-md border border-border bg-surface shadow-xl z-30">
          {months.map(m => (
            <button
              key={m.value}
              onClick={() => { onChange(m.value); setOpen(false); }}
              className={`flex items-center justify-between w-full px-3 py-1.5 text-[13px] transition ${
                m.value === value
                  ? 'bg-accent-bg text-accent font-semibold'
                  : 'text-text-1 hover:bg-surface-2'
              }`}
            >
              {m.label}
              {m.value === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
