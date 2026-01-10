/**
 * User model for frontend
 */

export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  role: "user" | "admin";
  salesGoal: number | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  avatar?: string;
  salesGoal?: number;
  birthDate?: Date;
}
