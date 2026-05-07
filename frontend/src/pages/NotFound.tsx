import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-accent tracking-tight">404</p>
        <p className="text-text-1 text-lg font-semibold mt-3">Página não encontrada</p>
        <p className="text-text-3 text-[13px] mt-1">A rota que você tentou acessar não existe.</p>
        <Link
          to="/dashboard"
          className="inline-block mt-5 px-4 py-2 rounded-md bg-accent text-white text-[13px] font-semibold hover:opacity-90 transition"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
