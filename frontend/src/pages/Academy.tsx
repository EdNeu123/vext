import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap,
  BookOpen,
  ChevronRight,
  CheckCircle,
  LayoutDashboard,
  Trello,
  Calendar,
  Users,
  Smartphone,
  Tag,
  Package,
  Brain,
  Briefcase,
  Settings,
  Search,
  Bell,
  Plus,
  Filter,
  ArrowRight,
  MousePointer,
  Target,
  TrendingUp,
  AlertTriangle,
  FileText,
  Download,
  Upload,
} from "lucide-react";
import { useState } from "react";

// Manual sections with text and image descriptions
const manualSections = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    description: "Visão geral do seu CRM",
    content: [
      {
        title: "Visão Admin",
        text: "O Dashboard para administradores exibe métricas de Customer Success como Churn Rate, NPS, LTV e MRR. Você verá um gráfico de receita recorrente ao longo do tempo e o ranking de vendedores da equipe.",
        tips: [
          "O gráfico de linha mostra a evolução da receita nos últimos 6 meses",
          "Clique em 'Ver todos' no ranking para acessar a gestão completa da equipe",
          "Os cards de métricas são atualizados em tempo real",
        ],
      },
      {
        title: "Visão Vendedor",
        text: "Vendedores veem sua barra de progresso de meta mensal, lista de vendas ativas e lembretes do dia. O painel Vext Radar mostra alertas de churn e oportunidades de recompra identificadas pela IA.",
        tips: [
          "A barra de progresso mostra quanto falta para atingir sua meta",
          "Tarefas do dia aparecem ordenadas por prioridade",
          "Alertas do Vext Radar ajudam a priorizar contatos",
        ],
      },
    ],
  },
  {
    id: "pipeline",
    title: "Pipeline de Vendas",
    icon: Trello,
    description: "Gerenciamento de oportunidades",
    content: [
      {
        title: "Visualização Kanban",
        text: "O Pipeline exibe suas oportunidades em colunas que representam cada estágio do funil: Lead, Contato, Proposta, Negociação e Fechado. Arraste e solte os cards para mover oportunidades entre estágios.",
        tips: [
          "Clique e segure um card para arrastá-lo",
          "Ao mover para 'Fechado', escolha se foi Ganho ou Perdido",
          "O valor total de cada coluna é exibido no topo",
        ],
      },
      {
        title: "Visualização Lista",
        text: "Alterne para a visualização em lista clicando no ícone correspondente. Esta visão permite ordenar e filtrar oportunidades por diferentes critérios como valor, data de criação ou probabilidade.",
        tips: [
          "Use os filtros para encontrar oportunidades específicas",
          "Clique nos cabeçalhos das colunas para ordenar",
          "A visualização lista é ideal para análises detalhadas",
        ],
      },
      {
        title: "Metodologia BANT",
        text: "Cada oportunidade pode ser qualificada usando a metodologia BANT: Budget (Orçamento), Authority (Autoridade/Decisor), Need (Necessidade/Dores) e Timeline (Prazo). A IA calcula automaticamente a probabilidade de fechamento baseada nesses critérios.",
        tips: [
          "Preencha todos os campos BANT para melhor precisão da IA",
          "O score de probabilidade vai de 0% a 100%",
          "Oportunidades com alta probabilidade aparecem destacadas",
        ],
      },
      {
        title: "Criando Nova Oportunidade",
        text: "Clique no botão '+ Nova Oportunidade' para abrir o formulário. Preencha o título, valor estimado, selecione o contato associado, o estágio inicial e os campos BANT. Você também pode adicionar tags para categorização.",
        tips: [
          "O campo 'Valor' aceita valores em reais",
          "Associe sempre a um contato existente para histórico completo",
          "Tags ajudam a filtrar e organizar suas oportunidades",
        ],
      },
    ],
  },
  {
    id: "calendar",
    title: "Agenda",
    icon: Calendar,
    description: "Calendário e tarefas",
    content: [
      {
        title: "Calendário Interativo",
        text: "A Agenda exibe um calendário mensal com todas as suas tarefas e compromissos. Clique em um dia para ver os detalhes ou criar uma nova tarefa. Tarefas são coloridas por tipo: ligação, reunião, follow-up, etc.",
        tips: [
          "Navegue entre meses usando as setas no topo",
          "Dias com tarefas mostram indicadores coloridos",
          "Clique em uma tarefa para ver detalhes completos",
        ],
      },
      {
        title: "Reagendamento Drag & Drop",
        text: "Para reagendar uma tarefa, arraste-a de um dia para outro no calendário. O sistema solicitará um motivo para o reagendamento, que será registrado no histórico de auditoria.",
        tips: [
          "O motivo do reagendamento é obrigatório (compliance)",
          "Todas as alterações ficam registradas no histórico",
          "Você pode ver o histórico de reagendamentos de cada tarefa",
        ],
      },
      {
        title: "Tipos de Tarefas",
        text: "Crie diferentes tipos de tarefas: Ligação, Reunião, E-mail, Follow-up, Visita ou Outro. Cada tipo tem uma cor específica para fácil identificação no calendário.",
        tips: [
          "Defina prioridade: Baixa, Média ou Alta",
          "Associe tarefas a oportunidades ou contatos",
          "Configure lembretes para não perder compromissos",
        ],
      },
    ],
  },
  {
    id: "contacts",
    title: "Clientes",
    icon: Users,
    description: "Gestão de contatos 360°",
    content: [
      {
        title: "Listagem de Contatos",
        text: "A página de Clientes exibe todos os seus contatos com informações como nome, empresa, cargo, e-mail e telefone. Use a busca e filtros para encontrar contatos específicos.",
        tips: [
          "A busca funciona em todos os campos do contato",
          "Filtre por risco de churn: Baixo, Médio ou Alto",
          "Ordene por nome, empresa ou data de criação",
        ],
      },
      {
        title: "Perfil 360° do Cliente",
        text: "Clique em um contato para ver seu perfil completo. Você verá métricas como LTV (Lifetime Value), Ticket Médio, histórico de compras, score NPS e risco de churn. O melhor horário para contato também é sugerido.",
        tips: [
          "O LTV é calculado automaticamente com base nas compras",
          "O risco de churn é atualizado pela IA periodicamente",
          "Veja todo o histórico de interações com o cliente",
        ],
      },
      {
        title: "Importação CSV",
        text: "Importe contatos em massa usando arquivos CSV. Clique em 'Importar CSV', faça download do modelo, preencha com seus dados e faça upload. O sistema validará os dados antes de importar.",
        tips: [
          "Baixe o modelo CSV para garantir o formato correto",
          "Campos obrigatórios: Nome e E-mail",
          "Contatos duplicados (mesmo e-mail) serão atualizados",
        ],
      },
    ],
  },
  {
    id: "vext-radar",
    title: "Vext Radar (IA)",
    icon: Brain,
    description: "Inteligência artificial preditiva",
    content: [
      {
        title: "Alertas de Churn",
        text: "O Vext Radar analisa o comportamento dos seus clientes e identifica aqueles com alto risco de churn (cancelamento). A IA considera fatores como tempo desde última compra, frequência de interações e score NPS.",
        tips: [
          "Priorize contato com clientes em risco alto",
          "Veja o motivo estimado do risco de churn",
          "Ações preventivas podem reverter o risco",
        ],
      },
      {
        title: "Oportunidades de Recompra",
        text: "A IA identifica clientes com alta probabilidade de realizar uma nova compra baseado no histórico de compras, ciclo médio de recompra e comportamento similar de outros clientes.",
        tips: [
          "Oportunidades são ordenadas por probabilidade",
          "Veja o valor estimado da próxima compra",
          "Entre em contato no momento certo",
        ],
      },
      {
        title: "Análise BANT por IA",
        text: "Para cada oportunidade no pipeline, a IA pode analisar os campos BANT preenchidos e calcular uma probabilidade de fechamento. Quanto mais informações você fornecer, mais precisa será a análise.",
        tips: [
          "Clique em 'Analisar com IA' na oportunidade",
          "A análise considera dados históricos de deals similares",
          "Use as sugestões da IA para melhorar sua abordagem",
        ],
      },
    ],
  },
  {
    id: "landing-pages",
    title: "Vext Pages",
    icon: Smartphone,
    description: "Gerador de landing pages",
    content: [
      {
        title: "Criando uma Landing Page",
        text: "Clique em '+ Nova Landing Page' para criar uma página de captura. Defina o título (headline), subtítulo, texto do botão CTA e o slug (URL amigável). Escolha um tema de cores para sua página.",
        tips: [
          "O slug será a URL: seusite.com/lp/seu-slug",
          "Escolha headlines curtas e impactantes",
          "O CTA deve ter uma ação clara: 'Quero Saber Mais'",
        ],
      },
      {
        title: "Preview Mobile",
        text: "Visualize como sua landing page ficará em dispositivos móveis em tempo real. O preview é atualizado conforme você edita os campos do formulário.",
        tips: [
          "Mais de 60% dos acessos vêm de mobile",
          "Teste a legibilidade do texto no preview",
          "Cores de alto contraste funcionam melhor",
        ],
      },
      {
        title: "Temas e Cores",
        text: "Escolha entre diferentes temas de cores para sua landing page: Azul, Verde, Roxo, Laranja ou personalizado. O tema afeta o fundo, botões e elementos de destaque.",
        tips: [
          "Mantenha consistência com sua marca",
          "Cores quentes (laranja, vermelho) geram mais urgência",
          "Cores frias (azul, verde) transmitem confiança",
        ],
      },
    ],
  },
  {
    id: "team",
    title: "Gestão de Equipe",
    icon: Briefcase,
    description: "Administração de usuários (Admin)",
    content: [
      {
        title: "Convidando Membros",
        text: "Administradores podem convidar novos membros clicando em '+ Convidar'. Informe o e-mail, nome e função (Admin ou Vendedor). Um convite seguro por token será enviado com validade de 7 dias.",
        tips: [
          "Convites expiram após 7 dias",
          "O convidado receberá um link único de cadastro",
          "Você pode reenviar ou revogar convites pendentes",
        ],
      },
      {
        title: "Permissões Granulares",
        text: "Defina permissões específicas para cada membro usando o checklist de permissões. Controle acesso a módulos como Pipeline, Contatos, Relatórios, Configurações e mais.",
        tips: [
          "Admins têm acesso total por padrão",
          "Vendedores podem ter permissões customizadas",
          "Revise permissões periodicamente",
        ],
      },
      {
        title: "Definindo Metas",
        text: "Configure metas de vendas mensais para cada vendedor. A meta aparecerá no dashboard do vendedor com uma barra de progresso mostrando quanto falta para atingir.",
        tips: [
          "Metas devem ser desafiadoras mas alcançáveis",
          "Acompanhe o progresso no ranking de vendedores",
          "Ajuste metas conforme o desempenho histórico",
        ],
      },
    ],
  },
  {
    id: "tags",
    title: "Tags",
    icon: Tag,
    description: "Organização e categorização",
    content: [
      {
        title: "Criando Tags",
        text: "Tags são etiquetas coloridas para categorizar oportunidades e contatos. Crie tags como 'Hot Lead', 'VIP', 'Urgente', 'Recompra', etc. Escolha uma cor para fácil identificação visual.",
        tips: [
          "Use cores consistentes: vermelho para urgente, verde para VIP",
          "Mantenha nomes curtos e descritivos",
          "Limite o número de tags para evitar confusão",
        ],
      },
      {
        title: "Aplicando Tags",
        text: "Adicione tags a oportunidades no Pipeline ou a contatos na página de Clientes. Uma oportunidade pode ter múltiplas tags. Use tags para filtrar e encontrar itens rapidamente.",
        tips: [
          "Clique no ícone de tag para adicionar/remover",
          "Filtre o pipeline por tags específicas",
          "Tags aparecem como badges coloridos nos cards",
        ],
      },
    ],
  },
  {
    id: "products",
    title: "Produtos",
    icon: Package,
    description: "Catálogo de produtos",
    content: [
      {
        title: "Cadastrando Produtos",
        text: "Cadastre seus produtos e serviços com nome, descrição, preço, SKU e categoria. Produtos cadastrados podem ser associados a oportunidades no pipeline.",
        tips: [
          "Use SKUs únicos para cada produto",
          "Organize por categorias para fácil busca",
          "Mantenha preços atualizados",
        ],
      },
      {
        title: "Associando a Oportunidades",
        text: "Ao criar ou editar uma oportunidade, você pode associar produtos do catálogo. O valor da oportunidade pode ser calculado automaticamente com base nos produtos selecionados.",
        tips: [
          "Adicione quantidades para cada produto",
          "Aplique descontos quando necessário",
          "O histórico de produtos vendidos fica no perfil do cliente",
        ],
      },
    ],
  },
];

export default function Academy() {
  const [selectedSection, setSelectedSection] = useState(manualSections[0]);
  const [expandedContent, setExpandedContent] = useState<number | null>(0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-primary" />
            Vext Academy
          </h1>
          <p className="text-muted-foreground">Manual operacional da plataforma</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Módulos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-1 p-2">
                  {manualSections.map((section) => {
                    const Icon = section.icon;
                    const isSelected = selectedSection.id === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          setSelectedSection(section);
                          setExpandedContent(0);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-secondary text-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{section.title}</p>
                          <p className={`text-xs truncate ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {section.description}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <selectedSection.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{selectedSection.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedSection.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-4 pr-4">
                  {selectedSection.content.map((item, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedContent(expandedContent === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {index + 1}
                          </div>
                          <span className="font-medium">{item.title}</span>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedContent === index ? "rotate-90" : ""}`} />
                      </button>
                      
                      {expandedContent === index && (
                        <div className="px-4 pb-4 pt-0">
                          <Separator className="mb-4" />
                          
                          {/* Text Content */}
                          <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
                            <p className="text-muted-foreground leading-relaxed">
                              {item.text}
                            </p>
                          </div>

                          {/* Visual Illustration */}
                          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 mb-4 border border-primary/20">
                            <div className="flex items-center justify-center">
                              <div className="text-center">
                                <selectedSection.icon className="w-16 h-16 text-primary/40 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">
                                  Ilustração: {item.title}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Tips */}
                          <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                              <Target className="w-4 h-4" />
                              Dicas Importantes
                            </h4>
                            <ul className="space-y-2">
                              {item.tips.map((tip, tipIndex) => (
                                <li key={tipIndex} className="flex items-start gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-muted-foreground">{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
