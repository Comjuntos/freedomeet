// Fonte única da verdade dos planos e recursos.
// A landing page, o frontend e as regras de backend devem ler daqui.

export type PlanId = "gratuito" | "negocios" | "empresarial";

export type PlanFeatures = {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  tagline: string;
  highlight: boolean;
  // ID do preço Paddle usado no checkout:
  priceId?: string;
  // Limites e recursos que o sistema pode verificar em código:
  maxMinutes: number; // Infinity = ilimitado
  maxParticipants: number;
  traducao: boolean;
  ata: boolean;
  sentimento: boolean;
  // Itens exibidos na tabela de preços (texto livre):
  features: string[];
};

export const PLANS: Record<PlanId, PlanFeatures> = {
  gratuito: {
    id: "gratuito",
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    tagline: "Para começar a se reunir agora mesmo.",
    highlight: false,
    maxMinutes: 80,
    maxParticipants: 8,
    traducao: false,
    ata: true,
    sentimento: true,
    features: [
      "Reuniões de até 1h20",
      "Até 8 participantes por sala",
      "Vídeo HD, áudio e chat",
      "Compartilhamento de tela",
      "Legendas ao vivo com IA",
      "Ata gerada por IA",
      "Análise de sentimentos",
    ],
  },
  negocios: {
    id: "negocios",
    name: "Negócios",
    price: "R$ 39",
    period: "/mês por usuário",
    tagline: "Para equipes que se reúnem todos os dias.",
    highlight: true,
    priceId: "negocios_monthly",
    maxMinutes: Infinity,
    maxParticipants: 50,
    traducao: true,
    ata: true,
    sentimento: true,
    features: [
      "Reuniões ilimitadas",
      "Até 50 participantes por sala",
      "Tudo do plano Gratuito",
      "Tradução em tempo real",
      "Ata gerada por IA ao final",
    ],
  },
  empresarial: {
    id: "empresarial",
    name: "Empresarial",
    price: "R$ 99",
    period: "/mês por usuário",
    tagline: "Para organizações que precisam de escala e controle.",
    highlight: false,
    priceId: "empresarial_monthly",
    maxMinutes: Infinity,
    maxParticipants: 100,
    traducao: true,
    ata: true,
    sentimento: true,
    features: [
      "Tudo do plano Negócios",
      "Até 100 participantes por sala",
      "Análise de engajamento com IA",
      "Salas persistentes e branding",
      "Suporte prioritário dedicado",
      "Opção de auto-hospedagem",
    ],
  },
};

export const PLAN_LIST: PlanFeatures[] = [
  PLANS.gratuito,
  PLANS.negocios,
  PLANS.empresarial,
];

export const DEFAULT_PLAN: PlanId = "gratuito";

export function getPlan(id: string | null | undefined): PlanFeatures {
  if (id && id in PLANS) return PLANS[id as PlanId];
  return PLANS[DEFAULT_PLAN];
}
