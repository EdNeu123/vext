import { api } from "./api";
import { User, UpdateProfileInput } from "../models/User";

/**
 * Authentication service
 */
export const authService = {
  /**
   * Get current user
   */
  async getMe(): Promise<User | null> {
    try {
      const response = await api.get("/auth/me");
      return response.data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileInput): Promise<User> {
    const response = await api.put("/auth/profile", data);
    return response.data.user;
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await api.post("/auth/logout");
    localStorage.removeItem("auth_token");
  },
};
