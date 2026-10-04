export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  bio: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileResponse {
  success: boolean;
  message?: string;
  data?: {
    profile: UserProfile;
  };
  errors?: Array<{ field: string; message: string }>;
}
