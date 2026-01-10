import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, getSignUpUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, BarChart3, Users, Target, Sparkles, CheckCircle } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const features = [
    {
      icon: Target,
      title: "Pipeline Inteligente",
      description: "Visualize e gerencie suas oportunidades com Kanban e metodologia BANT integrada.",
    },
    {
      icon: Users,
      title: "Gestão 360º de Clientes",
      description: "Perfil completo com LTV, histórico de compras e análise de churn.",
    },
    {
      icon: BarChart3,
      title: "Dashboard CS & Vendas",
      description: "Métricas de Customer Success e metas de vendas em tempo real.",
    },
    {
      icon: Sparkles,
      title: "Vext Radar",
      description: "IA preditiva que identifica oportunidades de recompra e riscos de churn.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        {/* Header */}
        <header className="relative z-10 container mx-auto px-6 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-2xl tracking-tight">Vext CRM</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => (window.location.href = getSignUpUrl())} size="lg" className="rounded-full px-6">
                Cadastrar
              </Button>
              <Button onClick={() => (window.location.href = getLoginUrl())} size="lg" className="gap-2 rounded-full px-6">
                Entrar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </nav>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Inteligência Artificial Integrada
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
              O CRM que{" "}
              <span className="text-primary">acelera</span> suas vendas B2B
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Gerencie seu pipeline, acompanhe métricas de Customer Success e deixe a IA identificar 
              as melhores oportunidades de negócio para sua equipe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => (window.location.href = getSignUpUrl())}
                size="lg"
                className="gap-2 rounded-full px-8 text-base shadow-lg shadow-primary/30"
              >
                Começar Agora
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="rounded-full px-8 text-base"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Já tenho conta
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Tudo que você precisa para vender mais</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas para gestão de vendas e relacionamento com clientes.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Por que escolher o Vext CRM?</h2>
              <div className="space-y-4">
                {[
                  "Pipeline visual com drag & drop e metodologia BANT",
                  "Dashboard diferenciado para Admin e Vendedor",
                  "Sistema de auditoria completo com histórico de alterações",
                  "Agenda inteligente com compliance obrigatório",
                  "Importação em massa de contatos via CSV",
                  "Gerador de Landing Pages com preview mobile",
                  "IA preditiva para identificar oportunidades",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Preview do Dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para transformar suas vendas?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Junte-se a milhares de empresas que já usam o Vext CRM para acelerar seus resultados.
          </p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            size="lg"
            className="gap-2 rounded-full px-8 text-base shadow-lg shadow-primary/30"
          >
            Começar Gratuitamente
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-bold">Vext CRM</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Vext. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
