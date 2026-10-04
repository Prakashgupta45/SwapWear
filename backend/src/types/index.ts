import { Request } from 'express';
import { Role } from '@prisma/client';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}
