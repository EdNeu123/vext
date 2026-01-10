/**
 * Contact model for frontend
 */

export interface Contact {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  segment: string | null;
  ltv: number;
  avgTicket: number;
  totalPurchases: number;
  lastPurchaseDate: Date | null;
  churnRisk: "low" | "medium" | "high";
  nps: number | null;
  notes: string | null;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  segment?: string;
  notes?: string;
}
