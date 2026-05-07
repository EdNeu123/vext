import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from 'react';

type Variant = 'default' | 'green' | 'yellow' | 'red' | 'blue';

const VARIANT_CLASSES: Record<Variant, string> = {
  default: 'bg-surface-2 text-text-2 border-border',
  green:   'bg-success-bg text-success border-transparent',
  yellow:  'bg-warning-bg text-warning border-transparent',
  red:     'bg-danger-bg text-danger border-transparent',
  blue:    'bg-accent-bg text-accent border-transparent',
};

export function Badge({ variant = 'default', children }: { variant?: Variant; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${VARIANT_CLASSES[variant]}`}>
      {children}
    </span>
  );
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-[12px] font-medium text-text-2 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 rounded-md text-[13px] bg-surface-2 border border-border text-text-1 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition ${props.className ?? ''}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 rounded-md text-[13px] bg-surface-2 border border-border text-text-1 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition ${props.className ?? ''}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-3 py-2 rounded-md text-[13px] bg-surface-2 border border-border text-text-1 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition resize-y ${props.className ?? ''}`}
    />
  );
}
