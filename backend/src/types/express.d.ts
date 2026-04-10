import { Request } from 'express';

export interface AuthPayload {
  userId: number;
  email: string;
  name: string;   // incluído no JWT para evitar DB query no middleware
  role: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}
