/**
 * Deal Model
 * Represents a sales opportunity in the pipeline
 */

export interface Deal {
  id: number;
  title: string;
  value: number;
  stage: "prospecting" | "qualification" | "presentation" | "negotiation" | "won" | "lost";
  probability: number;
  contactId: number;
  productId: number | null;
  ownerId: number;
  budgetConfirmed: boolean;
  decisionMakerIdentified: boolean;
  painPoints: string | null;
  competitors: string | null;
  timeline: string | null;
  nextFollowUpDate: Date | null;
  notes: string | null;
  lostReason: string | null;
  wonDate: Date | null;
  lostDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDealInput {
  title: string;
  value: number;
  stage?: "prospecting" | "qualification" | "presentation" | "negotiation";
  contactId: number;
  productId?: number;
  ownerId: number;
  budgetConfirmed?: boolean;
  decisionMakerIdentified?: boolean;
  painPoints?: string;
  competitors?: string;
  timeline?: string;
  nextFollowUpDate?: Date;
  notes?: string;
}

export interface UpdateDealInput {
  title?: string;
  value?: number;
  stage?: "prospecting" | "qualification" | "presentation" | "negotiation" | "won" | "lost";
  probability?: number;
  productId?: number;
  budgetConfirmed?: boolean;
  decisionMakerIdentified?: boolean;
  painPoints?: string;
  competitors?: string;
  timeline?: string;
  nextFollowUpDate?: Date;
  notes?: string;
  lostReason?: string;
}
