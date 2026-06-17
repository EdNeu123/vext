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
  // Injetado pelo middleware requireTeamAccess (ver team.middleware.ts)
  teamId?: number;
  teamRole?: 'admin' | 'moderator' | 'seller';
}
