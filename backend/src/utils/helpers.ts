/**
 * Custom API Error class with HTTP status codes
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message = 'Requisição inválida') { return new ApiError(400, message); }
  static unauthorized(message = 'Não autorizado') { return new ApiError(401, message); }
  static forbidden(message = 'Acesso negado') { return new ApiError(403, message); }
  static notFound(message = 'Recurso não encontrado') { return new ApiError(404, message); }
  static conflict(message = 'Conflito') { return new ApiError(409, message); }
  static tooMany(message = 'Muitas requisições') { return new ApiError(429, message); }
  static internal(message = 'Erro interno do servidor') { return new ApiError(500, message, false); }
}

/**
 * Resposta padrão da API
 */
export function apiResponse<T>(data: T, message?: string) {
  return { success: true, message, data };
}

/**
 * Resposta paginada
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
) {
  return {
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Extrai parâmetros de paginação da query string
 */
export function extractPagination(
  query: Record<string, any>,
  maxLimit = 100
): { page: number; limit: number; skip: number } {
  const rawPage  = parseInt(query.page)  || 1;
  const rawLimit = parseInt(query.limit) || 20;

  // Rejeita valores absurdos antes de qualquer operação
  if (!Number.isFinite(rawPage)  || rawPage  < 1)       throw new Error('Parâmetro page inválido');
  if (!Number.isFinite(rawLimit) || rawLimit < 1)        throw new Error('Parâmetro limit inválido');

  const page  = rawPage;
  const limit = Math.min(rawLimit, maxLimit);  // hard cap — impossível pedir mais que maxLimit
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Calcula probabilidade do card com base no BANT
 */
export function calculateDealProbability(card: {
  stage: string;
  budgetConfirmed?: boolean | null;
  decisionMakerIdentified?: boolean | null;
  painPoints?: string | null;
  timeline?: string | null;
}): number {
  const stageProbabilities: Record<string, number> = {
    prospecting: 10,
    qualification: 25,
    presentation: 50,
    negotiation: 75,
    won: 100,
    lost: 0,
  };

  let probability = stageProbabilities[card.stage] ?? 10;

  if (card.budgetConfirmed) probability += 5;
  if (card.decisionMakerIdentified) probability += 5;
  if (card.painPoints && card.painPoints.length > 10) probability += 5;
  if (card.timeline) probability += 5;

  return Math.min(probability, 100);
}
