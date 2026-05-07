import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import PrimaryButton from '../components/ui/PrimaryButton';
import { FormField, Input } from '../components/ui/Form';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login realizado!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <svg width="36" height="36" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="28" height="28" rx="7" fill="var(--accent)" />
              <path d="M7 9L11.5 19L14 13.5L16.5 19L21 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="14" cy="20" r="1.5" fill="white" fillOpacity="0.5" />
            </svg>
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-text-1">Vext</span>
              <span className="text-accent"> CRM</span>
            </span>
          </div>
          <p className="text-text-3 text-[13px]">Acesse sua conta</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-xl p-7"
        >
          <FormField label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </FormField>
          <FormField label="Senha">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </FormField>
          <PrimaryButton type="submit" fullWidth disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </PrimaryButton>
          <p className="text-center text-[13px] text-text-3 mt-4">
            Não tem conta?{' '}
            <Link to="/register" className="text-accent hover:opacity-80 font-medium">
              Registrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
