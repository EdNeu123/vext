import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Smartphone, Monitor, ExternalLink } from "lucide-react";
import { useState } from "react";

const themeStyles: Record<string, { bg: string; accent: string; text: string }> = {
  indigo: { bg: "from-indigo-600 to-indigo-800", accent: "bg-indigo-500", text: "text-indigo-500" },
  emerald: { bg: "from-emerald-600 to-emerald-800", accent: "bg-emerald-500", text: "text-emerald-500" },
  rose: { bg: "from-rose-600 to-rose-800", accent: "bg-rose-500", text: "text-rose-500" },
  amber: { bg: "from-amber-600 to-amber-800", accent: "bg-amber-500", text: "text-amber-500" },
  blue: { bg: "from-blue-600 to-blue-800", accent: "bg-blue-500", text: "text-blue-500" },
  purple: { bg: "from-purple-600 to-purple-800", accent: "bg-purple-500", text: "text-purple-500" },
};

export default function LandingPageView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  const { data: page, isLoading } = trpc.landingPages.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-12 w-48 mb-8" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Página não encontrada</h1>
          <Button onClick={() => setLocation("/landing-pages")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const theme = themeStyles[page.themeColor] || themeStyles.indigo;

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/landing-pages")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="h-6 w-px bg-border" />
          <h1 className="font-bold">{page.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "desktop" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("desktop")}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "mobile" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("mobile")}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
          <Button size="sm" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Abrir Link
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="p-8 flex justify-center">
        <div
          className={`bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
            viewMode === "mobile" ? "w-[375px]" : "w-full max-w-5xl"
          }`}
        >
          {/* Hero Section */}
          <div className={`bg-gradient-to-br ${theme.bg} text-white py-20 px-8`}>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className={`${viewMode === "mobile" ? "text-3xl" : "text-5xl"} font-bold mb-6`}>
                {page.headline}
              </h1>
              {page.subheadline && (
                <p className={`${viewMode === "mobile" ? "text-lg" : "text-xl"} opacity-90 mb-8`}>
                  {page.subheadline}
                </p>
              )}
              {page.ctaText && (
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                  {page.ctaText}
                </Button>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div className="py-16 px-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                Por que escolher nossa solução?
              </h2>
              <div className={`grid ${viewMode === "mobile" ? "grid-cols-1" : "grid-cols-3"} gap-8`}>
                {[
                  { icon: "🚀", title: "Rápido", desc: "Implementação em minutos" },
                  { icon: "🔒", title: "Seguro", desc: "Dados protegidos" },
                  { icon: "📈", title: "Escalável", desc: "Cresce com você" },
                ].map((feature, i) => (
                  <div key={i} className="text-center">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className={`${theme.accent} py-16 px-8 text-white text-center`}>
            <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
            <p className="text-lg opacity-90 mb-8">
              Junte-se a milhares de empresas que já transformaram seus resultados
            </p>
            <Button size="lg" variant="secondary">
              {page.ctaText || "Começar Agora"}
            </Button>
          </div>

          {/* Footer */}
          <div className="py-8 px-8 bg-gray-900 text-gray-400 text-center text-sm">
            <p>© 2024 {page.title}. Todos os direitos reservados.</p>
            <p className="mt-2 text-xs">Criado com Vext Pages</p>
          </div>
        </div>
      </div>
    </div>
  );
}
