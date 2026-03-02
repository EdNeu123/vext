import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">404</h1>
        <p className="text-xl text-gray-400 mt-4">Página não encontrada</p>
        <Link to="/dashboard" className="inline-block mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition">
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
