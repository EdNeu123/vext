/**
 * User Model
 * Represents a user in the system
 */

export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  permissions: string | null;
  salesGoal: number | null;
  birthDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export interface CreateUserInput {
  openId: string;
  name?: string;
  email?: string;
  phone?: string;
  loginMethod?: string;
  role?: "user" | "admin";
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  salesGoal?: number;
  birthDate?: Date;
  permissions?: string;
}
