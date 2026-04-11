import { Construction } from 'lucide-react';

export default function DevBanner() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-300">
      <Construction size={18} className="shrink-0" />
      <p className="text-sm font-medium">
        Esta funcionalidade está em desenvolvimento e será disponibilizada em breve.
      </p>
    </div>
  );
}
