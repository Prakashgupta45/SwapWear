import { prisma } from '../config/prisma';
import { UpdateProfileInput } from '../validations/profile.validation';
import { AppError } from './auth.service';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  bio: true,
  city: true,
  state: true,
  pincode: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class ProfileService {
  /**
   * Get the full profile of the currently authenticated user
   */
  static async getProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: SAFE_USER_SELECT,
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return user;
  }

  /**
   * Update the profile of the currently authenticated user
   */
  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.state !== undefined && { state: input.state }),
        ...(input.pincode !== undefined && { pincode: input.pincode }),
      },
      select: SAFE_USER_SELECT,
    });

    return user;
  }
}
