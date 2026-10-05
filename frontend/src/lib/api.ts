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
const TOKEN_KEY = 'swapwear_token';

// Token helpers — store JWT from response body so Bearer auth always works
export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },
};

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Attach Bearer token if available (supports both cookie + header auth)
    const token = tokenStorage.get();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Also send cookies as fallback
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
    avatarUrl?: string | null;
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

  // ── Swap Request APIs (Phase 4) ──────────────────────────────────────────

  async createSwapRequest(data: {
    requestedListingId: string;
    offeredListingId: string;
    message?: string;
  }): Promise<{ success: boolean; message?: string; data: { swapRequest: any } }> {
    return this.request('/swap-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSentSwapRequests(): Promise<{ success: boolean; data: { swapRequests: any[] } }> {
    return this.request('/swap-requests/sent', {
      method: 'GET',
    });
  }

  async getReceivedSwapRequests(): Promise<{ success: boolean; data: { swapRequests: any[] } }> {
    return this.request('/swap-requests/received', {
      method: 'GET',
    });
  }

  async getSwapRequestById(id: string): Promise<{ success: boolean; data: { swapRequest: any } }> {
    return this.request(`/swap-requests/${id}`, {
      method: 'GET',
    });
  }

  async acceptSwapRequest(id: string): Promise<{ success: boolean; message?: string; data: { swapRequest: any } }> {
    return this.request(`/swap-requests/${id}/accept`, {
      method: 'PATCH',
    });
  }

  async rejectSwapRequest(id: string): Promise<{ success: boolean; message?: string; data: { swapRequest: any } }> {
    return this.request(`/swap-requests/${id}/reject`, {
      method: 'PATCH',
    });
  }

  async cancelSwapRequest(id: string): Promise<{ success: boolean; message?: string; data: { swapRequest: any } }> {
    return this.request(`/swap-requests/${id}/cancel`, {
      method: 'PATCH',
    });
  }

  // Phase 5: Chat & Real-Time Negotiation
  async getConversation(swapRequestId: string): Promise<import('../types/chat').ConversationResponse> {
    return this.request(`/conversations/${swapRequestId}`, {
      method: 'GET',
    });
  }

  async getMessages(
    swapRequestId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<import('../types/chat').MessagesResponse> {
    return this.request(`/conversations/${swapRequestId}/messages?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  async sendMessage(
    swapRequestId: string,
    content: string
  ): Promise<import('../types/chat').SendMessageResponse> {
    return this.request(`/conversations/${swapRequestId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async markMessageAsRead(
    messageId: string
  ): Promise<{ success: boolean; data: { message: import('../types/chat').ChatMessage } }> {
    return this.request(`/messages/${messageId}/read`, {
      method: 'PATCH',
    });
  }

  async markConversationAsRead(
    swapRequestId: string
  ): Promise<{ success: boolean; data: { count: number } }> {
    return this.request(`/conversations/${swapRequestId}/read`, {
      method: 'PATCH',
    });
  }

  async getUnreadSummary(): Promise<import('../types/chat').UnreadSummaryResponse> {
    return this.request('/conversations/unread-summary', {
      method: 'GET',
    });
  }

  // Phase 6: Location-Based & Value-Based Swap Matching
  async getListingMatches(
    listingId: string,
    params?: { page?: number; limit?: number; minScore?: number; cityOnly?: boolean }
  ): Promise<import('../types/match').ListingMatchesResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.minScore) query.set('minScore', params.minScore.toString());
    if (params?.cityOnly) query.set('cityOnly', 'true');

    const qs = query.toString();
    return this.request(`/listings/${listingId}/matches${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async getUserRecommendations(params?: {
    limit?: number;
    minScore?: number;
  }): Promise<import('../types/match').RecommendationsResponse> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.minScore) query.set('minScore', params.minScore.toString());

    const qs = query.toString();
    return this.request(`/matches/recommendations${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async compareListings(
    sourceListingId: string,
    targetListingId: string
  ): Promise<import('../types/match').CompareResponse> {
    return this.request('/matches/compare', {
      method: 'POST',
      body: JSON.stringify({ sourceListingId, targetListingId }),
    });
  }

  // Phase 8: AI-Powered Personalized Swap Recommendations
  async getAiRecommendations(params?: {
    limit?: number;
    minScore?: number;
    bypassCache?: boolean;
  }): Promise<import('../types/ai').AiRecommendationsResponse> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.minScore) query.set('minScore', params.minScore.toString());
    if (params?.bypassCache) query.set('bypassCache', 'true');

    const qs = query.toString();
    return this.request(`/ai/recommendations${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  // ── Phase 7: Admin Panel APIs ──────────────────────────────────────────────

  async getAdminAnalytics(): Promise<{ success: boolean; data: import('../types/admin').AdminAnalytics }> {
    return this.request('/admin/analytics', {
      method: 'GET',
    });
  }

  async getAdminUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<{
    success: boolean;
    data: {
      users: import('../types/admin').AdminUser[];
      pagination: import('../types/admin').AdminPagination;
    };
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.role && params.role !== 'ALL') query.set('role', params.role);

    const qs = query.toString();
    return this.request(`/admin/users${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async getAdminUserById(id: string): Promise<{
    success: boolean;
    data: { user: import('../types/admin').AdminUser };
  }> {
    return this.request(`/admin/users/${id}`, {
      method: 'GET',
    });
  }

  async updateAdminUserRole(
    id: string,
    role: 'USER' | 'ADMIN'
  ): Promise<{
    success: boolean;
    message: string;
    data: { user: import('../types/admin').AdminUser };
  }> {
    return this.request(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async getAdminListings(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    condition?: string;
    status?: string;
  }): Promise<{
    success: boolean;
    data: {
      listings: import('../types/admin').AdminListing[];
      pagination: import('../types/admin').AdminPagination;
    };
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.category && params.category !== 'ALL') query.set('category', params.category);
    if (params?.condition && params.condition !== 'ALL') query.set('condition', params.condition);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);

    const qs = query.toString();
    return this.request(`/admin/listings${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async getAdminListingById(id: string): Promise<{
    success: boolean;
    data: { listing: import('../types/admin').AdminListing };
  }> {
    return this.request(`/admin/listings/${id}`, {
      method: 'GET',
    });
  }

  async moderateListing(
    id: string,
    action: 'REMOVE' | 'RESTORE'
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    return this.request(`/admin/listings/${id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
  }

  async getAdminSwaps(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{
    success: boolean;
    data: {
      swaps: import('../types/admin').AdminSwap[];
      pagination: import('../types/admin').AdminPagination;
    };
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString();
    return this.request(`/admin/swaps${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async getAdminSwapById(id: string): Promise<{
    success: boolean;
    data: { swap: import('../types/admin').AdminSwap };
  }> {
    return this.request(`/admin/swaps/${id}`, {
      method: 'GET',
    });
  }

  async getAdminConversations(params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: {
      conversations: import('../types/admin').AdminConversation[];
      pagination: import('../types/admin').AdminPagination;
    };
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const qs = query.toString();
    return this.request(`/admin/conversations${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async getAdminConversationAudit(
    id: string,
    params?: { page?: number; limit?: number }
  ): Promise<{
    success: boolean;
    data: {
      conversation: any;
      messages: any[];
      pagination: import('../types/admin').AdminPagination;
    };
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const qs = query.toString();
    return this.request(`/admin/conversations/${id}${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }
}

export const api = new ApiClient();


