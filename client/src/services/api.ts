const API_BASE = '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.error || `HTTP error: ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export const api = {
  // Health check
  health: () => request<{ status: string; timestamp: string }>('/health'),

  // Profile endpoints
  profile: {
    get: () => request('/profile'),
    update: (data: unknown) =>
      request('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Applications endpoints
  applications: {
    list: () => request('/applications'),
    get: (id: number) => request(`/applications/${id}`),
    create: (data: unknown) =>
      request('/applications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: unknown) =>
      request(`/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request(`/applications/${id}`, {
        method: 'DELETE',
      }),
  },

  // Documents endpoints
  documents: {
    list: (applicationId?: number) =>
      request(`/documents${applicationId ? `?applicationId=${applicationId}` : ''}`),
    get: (id: number) => request(`/documents/${id}`),
    create: (data: unknown) =>
      request('/documents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};

export default api;
