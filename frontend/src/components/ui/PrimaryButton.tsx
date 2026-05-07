import { ButtonHTMLAttributes, ReactNode } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
}

export default function PrimaryButton({
  children, fullWidth, className = '', ...rest
}: PrimaryButtonProps) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-[13px] font-semibold text-white bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
