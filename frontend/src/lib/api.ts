import { AuthResponse, User } from '../types/auth';
import { ProfileResponse, UserProfile } from '../types/profile';
import {
  ClothingListing,
  ListingDetailResponse,
  ListingQueryParams,
  MyListingsResponse,
  PaginatedListingsResponse,
} from '../types/listing';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Ensures HTTP-only cookies are sent and stored
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data.message || data.errors?.[0]?.message || 'An error occurred';
      const error = new Error(errorMessage) as Error & { status: number; errors?: any };
      error.status = response.status;
      error.errors = data.errors;
      throw error;
    }

    return data as T;
  }

  // ── Auth APIs ─────────────────────────────────────────────────────────────

  async register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<{ success: boolean; data: { user: User } }> {
    return this.request<{ success: boolean; data: { user: User } }>('/auth/me', {
      method: 'GET',
    });
  }

  // ── Profile APIs (Phase 2) ────────────────────────────────────────────────

  async getProfile(): Promise<ProfileResponse> {
    return this.request<ProfileResponse>('/profile', {
      method: 'GET',
    });
  }

  async updateProfile(data: {
    name?: string;
    bio?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
  }): Promise<ProfileResponse> {
    return this.request<ProfileResponse>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ── Listing APIs (Phase 2) ────────────────────────────────────────────────

  async getListings(pageOrFilters: number | ListingQueryParams = 1, pageSize = 20): Promise<PaginatedListingsResponse> {
    const params = new URLSearchParams();
    const filters = typeof pageOrFilters === 'number'
      ? { page: pageOrFilters, pageSize }
      : pageOrFilters;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value));
    });

    return this.request<PaginatedListingsResponse>(`/listings?${params.toString()}`, {
      method: 'GET',
    });
  }

  async getMyListings(): Promise<MyListingsResponse> {
    return this.request<MyListingsResponse>('/listings/my', {
      method: 'GET',
    });
  }

  async getListingById(id: string): Promise<ListingDetailResponse> {
    return this.request<ListingDetailResponse>(`/listings/${id}`, {
      method: 'GET',
    });
  }

  async createListing(data: {
    title: string;
    description?: string;
    category: string;
    brand?: string;
    color?: string;
    size: string;
    condition: string;
    estimatedSwapValue?: number;
    imageUrls?: string[];
  }): Promise<ListingDetailResponse> {
    return this.request<ListingDetailResponse>('/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateListing(
    id: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      brand?: string;
      color?: string;
      size?: string;
      condition?: string;
      estimatedSwapValue?: number;
      status?: string;
      imageUrls?: string[];
    }
  ): Promise<ListingDetailResponse> {
    return this.request<ListingDetailResponse>(`/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteListing(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/listings/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
