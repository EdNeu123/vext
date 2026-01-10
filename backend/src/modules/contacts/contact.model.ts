/**
 * Contact Model
 * Represents a contact/customer in the CRM
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
  ownerId: number;
  notes?: string;
}

export interface UpdateContactInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  segment?: string;
  ltv?: number;
  avgTicket?: number;
  totalPurchases?: number;
  lastPurchaseDate?: Date;
  churnRisk?: "low" | "medium" | "high";
  nps?: number;
  notes?: string;
}
