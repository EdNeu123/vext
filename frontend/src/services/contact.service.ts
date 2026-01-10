import { api } from "./api";
import { Contact, CreateContactInput } from "../models/Contact";

/**
 * Contact service
 */
export const contactService = {
  /**
   * Get all contacts
   */
  async getAll(): Promise<Contact[]> {
    const response = await api.get("/contacts");
    return response.data;
  },

  /**
   * Get contact by ID
   */
  async getById(id: number): Promise<Contact> {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  },

  /**
   * Create new contact
   */
  async create(data: CreateContactInput): Promise<Contact> {
    const response = await api.post("/contacts", data);
    return response.data;
  },

  /**
   * Update contact
   */
  async update(id: number, data: Partial<Contact>): Promise<Contact> {
    const response = await api.put(`/contacts/${id}`, data);
    return response.data;
  },

  /**
   * Delete contact
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/contacts/${id}`);
  },

  /**
   * Import contacts from CSV
   */
  async importCSV(file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await api.post("/contacts/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return response.data;
  },
};
