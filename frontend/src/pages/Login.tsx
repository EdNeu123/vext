import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useTeamStore } from "../store/teamStore";
import { toast } from "sonner";
import PrimaryButton from "../components/ui/PrimaryButton";
import { FormField, Input } from "../components/ui/Form";
import logoVext from '../assets/img/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Login realizado!");
      // Se o usuário tem apenas 1 equipe, ela já foi auto-selecionada pelo
      // authStore e podemos ir direto ao dashboard. Caso contrário (0 ou
      // várias equipes), o seletor de workspace decide o próximo passo.
      navigate(useTeamStore.getState().activeTeam ? "/dashboard" : "/workspace");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          {/* A classe 'flex-col' empilha a imagem em cima do texto */}
          <div className="flex flex-col items-center justify-center gap-2 mb-2">
            <img
              src={logoVext}
              alt="Logo Vext CRM"
              className="w-60 h-60 object-contain"
            />

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
            {loading ? "Entrando..." : "Entrar"}
          </PrimaryButton>
          <p className="text-center text-[13px] text-text-3 mt-4">
            Não tem conta?{" "}
            <Link
              to="/register"
              className="text-accent hover:opacity-80 font-medium"
            >
              Registrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
