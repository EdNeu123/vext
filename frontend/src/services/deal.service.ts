import { api } from "./api";
import { Deal, CreateDealInput } from "../models/Deal";

/**
 * Deal service
 */
export const dealService = {
  /**
   * Get all deals
   */
  async getAll(): Promise<Deal[]> {
    const response = await api.get("/deals");
    return response.data;
  },

  /**
   * Get deal by ID
   */
  async getById(id: number): Promise<Deal> {
    const response = await api.get(`/deals/${id}`);
    return response.data;
  },

  /**
   * Create new deal
   */
  async create(data: CreateDealInput): Promise<Deal> {
    const response = await api.post("/deals", data);
    return response.data;
  },

  /**
   * Update deal
   */
  async update(id: number, data: Partial<Deal>): Promise<Deal> {
    const response = await api.put(`/deals/${id}`, data);
    return response.data;
  },

  /**
   * Delete deal
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/deals/${id}`);
  },

  /**
   * Update deal stage
   */
  async updateStage(id: number, stage: Deal["stage"]): Promise<Deal> {
    const response = await api.put(`/deals/${id}/stage`, { stage });
    return response.data;
  },
};
