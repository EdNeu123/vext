import { GoogleGenAI } from "@google/genai";

/**
 * Gemini AI Service for predictive analytics
 */

interface PredictionResult {
  score: number; // 0-100
  reason: string;
  suggestedAction: string;
  confidence: number; // 0-1
}

interface DealData {
  title: string;
  value: number;
  stage: string;
  budgetConfirmed: boolean;
  decisionMakerIdentified: boolean;
  painPoints: string | null;
  competitors: string | null;
  timeline: string | null;
  contactData?: {
    ltv: number;
    avgTicket: number;
    totalPurchases: number;
    lastPurchaseDate: Date | null;
    churnRisk: string;
    nps: number | null;
  };
}

/**
 * Predict deal closing probability using Gemini AI
 */
export async function predictDealProbability(
  dealData: DealData,
  apiKey: string
): Promise<PredictionResult> {
  const prompt = `
Você é um analista de vendas B2B especializado em prever probabilidade de fechamento de negócios.

Analise os dados abaixo e retorne uma previsão de probabilidade de fechamento:

DADOS DO NEGÓCIO:
- Título: ${dealData.title}
- Valor: R$ ${dealData.value.toLocaleString("pt-BR")}
- Estágio: ${dealData.stage}
- Orçamento Confirmado: ${dealData.budgetConfirmed ? "Sim" : "Não"}
- Tomador de Decisão Identificado: ${dealData.decisionMakerIdentified ? "Sim" : "Não"}
- Dores do Cliente: ${dealData.painPoints || "Não informado"}
- Concorrentes: ${dealData.competitors || "Não informado"}
- Timeline: ${dealData.timeline || "Não informado"}

${
  dealData.contactData
    ? `
DADOS DO CLIENTE:
- LTV: R$ ${dealData.contactData.ltv.toLocaleString("pt-BR")}
- Ticket Médio: R$ ${dealData.contactData.avgTicket.toLocaleString("pt-BR")}
- Total de Compras: ${dealData.contactData.totalPurchases}
- Última Compra: ${dealData.contactData.lastPurchaseDate?.toLocaleDateString("pt-BR") || "Nunca"}
- Risco de Churn: ${dealData.contactData.churnRisk}
- NPS: ${dealData.contactData.nps || "Não avaliado"}
`
    : ""
}

RETORNE APENAS JSON VÁLIDO NO FORMATO:
{
  "score": 75,
  "reason": "Motivo detalhado da pontuação",
  "suggestedAction": "Ação recomendada para aumentar a probabilidade",
  "confidence": 0.85
}
`.trim();

  const responseSchema = {
    type: "object",
    properties: {
      score: { type: "number" },
      reason: { type: "string" },
      suggestedAction: { type: "string" },
      confidence: { type: "number" },
    },
    required: ["score", "reason", "suggestedAction", "confidence"],
  };

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
    });

    const textResult =
      typeof response.text === "function" ? await response.text() : response.text;

    if (!textResult) {
      throw new Error("Resposta vazia da IA");
    }

    let parsed: any;

    try {
      parsed = JSON.parse(textResult);
    } catch {
      // Reparo automático de JSON
      let repaired = textResult.trim();
      repaired = repaired.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");

      const lastBrace = repaired.lastIndexOf("}");
      if (lastBrace !== -1) {
        repaired = repaired.slice(0, lastBrace + 1);
      }

      parsed = JSON.parse(repaired);
    }

    return {
      score: Math.min(100, Math.max(0, parsed.score || 0)),
      reason: parsed.reason || "Análise não disponível",
      suggestedAction: parsed.suggestedAction || "Continuar acompanhamento",
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
    };
  } catch (error) {
    console.error("Erro ao prever probabilidade com Gemini:", error);
    throw new Error("Falha na análise preditiva");
  }
}

/**
 * Predict churn risk for a contact using Gemini AI
 */
export async function predictChurnRisk(
  contactData: {
    name: string;
    ltv: number;
    avgTicket: number;
    totalPurchases: number;
    lastPurchaseDate: Date | null;
    nps: number | null;
    segment: string | null;
  },
  apiKey: string
): Promise<PredictionResult> {
  const daysSinceLastPurchase = contactData.lastPurchaseDate
    ? Math.floor(
        (Date.now() - contactData.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const prompt = `
Você é um analista de Customer Success especializado em prever risco de churn.

Analise os dados abaixo e retorne uma previsão de risco de churn:

DADOS DO CLIENTE:
- Nome: ${contactData.name}
- LTV: R$ ${contactData.ltv.toLocaleString("pt-BR")}
- Ticket Médio: R$ ${contactData.avgTicket.toLocaleString("pt-BR")}
- Total de Compras: ${contactData.totalPurchases}
- Última Compra: ${daysSinceLastPurchase !== null ? `${daysSinceLastPurchase} dias atrás` : "Nunca comprou"}
- NPS: ${contactData.nps || "Não avaliado"}
- Segmento: ${contactData.segment || "Não informado"}

RETORNE APENAS JSON VÁLIDO NO FORMATO:
{
  "score": 65,
  "reason": "Motivo detalhado do risco",
  "suggestedAction": "Ação recomendada para reduzir o churn",
  "confidence": 0.80
}

Score: 0-30 = Baixo Risco, 31-70 = Médio Risco, 71-100 = Alto Risco
`.trim();

  const responseSchema = {
    type: "object",
    properties: {
      score: { type: "number" },
      reason: { type: "string" },
      suggestedAction: { type: "string" },
      confidence: { type: "number" },
    },
    required: ["score", "reason", "suggestedAction", "confidence"],
  };

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
    });

    const textResult =
      typeof response.text === "function" ? await response.text() : response.text;

    if (!textResult) {
      throw new Error("Resposta vazia da IA");
    }

    let parsed: any;

    try {
      parsed = JSON.parse(textResult);
    } catch {
      let repaired = textResult.trim();
      repaired = repaired.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");

      const lastBrace = repaired.lastIndexOf("}");
      if (lastBrace !== -1) {
        repaired = repaired.slice(0, lastBrace + 1);
      }

      parsed = JSON.parse(repaired);
    }

    return {
      score: Math.min(100, Math.max(0, parsed.score || 0)),
      reason: parsed.reason || "Análise não disponível",
      suggestedAction: parsed.suggestedAction || "Monitorar engajamento",
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
    };
  } catch (error) {
    console.error("Erro ao prever churn com Gemini:", error);
    throw new Error("Falha na análise preditiva");
  }
}

/**
 * Predict repurchase opportunity using Gemini AI
 */
export async function predictRepurchaseOpportunity(
  contactData: {
    name: string;
    ltv: number;
    avgTicket: number;
    totalPurchases: number;
    lastPurchaseDate: Date | null;
    segment: string | null;
  },
  apiKey: string
): Promise<PredictionResult> {
  const daysSinceLastPurchase = contactData.lastPurchaseDate
    ? Math.floor(
        (Date.now() - contactData.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const prompt = `
Você é um analista de vendas especializado em identificar oportunidades de recompra.

Analise os dados abaixo e retorne uma previsão de oportunidade de recompra:

DADOS DO CLIENTE:
- Nome: ${contactData.name}
- LTV: R$ ${contactData.ltv.toLocaleString("pt-BR")}
- Ticket Médio: R$ ${contactData.avgTicket.toLocaleString("pt-BR")}
- Total de Compras: ${contactData.totalPurchases}
- Última Compra: ${daysSinceLastPurchase !== null ? `${daysSinceLastPurchase} dias atrás` : "Nunca comprou"}
- Segmento: ${contactData.segment || "Não informado"}

RETORNE APENAS JSON VÁLIDO NO FORMATO:
{
  "score": 80,
  "reason": "Motivo detalhado da oportunidade",
  "suggestedAction": "Ação recomendada para aproveitar a oportunidade",
  "confidence": 0.75
}

Score: 0-30 = Baixa Oportunidade, 31-70 = Média Oportunidade, 71-100 = Alta Oportunidade
`.trim();

  const responseSchema = {
    type: "object",
    properties: {
      score: { type: "number" },
      reason: { type: "string" },
      suggestedAction: { type: "string" },
      confidence: { type: "number" },
    },
    required: ["score", "reason", "suggestedAction", "confidence"],
  };

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
    });

    const textResult =
      typeof response.text === "function" ? await response.text() : response.text;

    if (!textResult) {
      throw new Error("Resposta vazia da IA");
    }

    let parsed: any;

    try {
      parsed = JSON.parse(textResult);
    } catch {
      let repaired = textResult.trim();
      repaired = repaired.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");

      const lastBrace = repaired.lastIndexOf("}");
      if (lastBrace !== -1) {
        repaired = repaired.slice(0, lastBrace + 1);
      }

      parsed = JSON.parse(repaired);
    }

    return {
      score: Math.min(100, Math.max(0, parsed.score || 0)),
      reason: parsed.reason || "Análise não disponível",
      suggestedAction: parsed.suggestedAction || "Entrar em contato",
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
    };
  } catch (error) {
    console.error("Erro ao prever recompra com Gemini:", error);
    throw new Error("Falha na análise preditiva");
  }
}
