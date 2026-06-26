import { GenerateBlogRequest, GenerateBlogResponse } from '@/types/blog';
import { auth } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Auth API
export async function login(email: string, password: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Giriş yapılamadı';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Save tokens and user data
    if (data.access_token && data.refresh_token && data.user) {
      auth.setAuth(data.access_token, data.refresh_token, data.user);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = auth.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      auth.logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }

    const data = await response.json();
    
    // Update tokens
    if (data.access_token && data.refresh_token) {
      auth.setToken(data.access_token);
      auth.setRefreshToken(data.refresh_token);
      if (data.user) {
        auth.setUser(data.user);
      }
      return data.access_token;
    }

    return null;
  } catch (error) {
    auth.logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    const refreshToken = auth.getRefreshToken();
    
    if (refreshToken) {
      const token = auth.getToken();
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch (error) {
    // Continue with logout even if API call fails
    console.error('Logout API call failed:', error);
  } finally {
    auth.logout();
  }
}

export async function register(email: string, password: string, name: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Kayıt oluşturulamadı');
    }

    const data = await response.json();
    
    // Save tokens and user data
    if (data.access_token && data.refresh_token && data.user) {
      auth.setAuth(data.access_token, data.refresh_token, data.user);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });
}

// Blog API
export async function generateBlog(
  data: GenerateBlogRequest,
): Promise<GenerateBlogResponse> {
  try {
    const response = await apiRequest('/api/blog/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

// Blog Viewing API (with API Key authentication)
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  language: string;
  coverImageUrl: string | null;
  coverImageCredit: {
    name: string;
    photographerUrl: string;
    photoUrl: string;
  } | null;
  canonicalUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  author: {
    id: string;
    name: string;
    email: string;
  } | null;
  content?: string;
  seo?: {
    metaTitle: string | null;
    metaDescription: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
  };
}

export interface BlogListResponse {
  posts: BlogPost[];
  total: number;
  limit: number;
  offset: number; // Kept for backward compatibility
  // ✅ Cursor-based pagination fields (v1 endpoint)
  nextCursor?: string;
  hasMore?: boolean;
}

// Get blog list with API key or JWT token
// ✅ Always uses /v1/api/blog endpoint with cursor-based pagination
export async function getAllBlogs(
  apiKeyOrToken?: string,
  status?: string,
  limit?: number,
  cursor?: string, // Changed from offset to cursor
): Promise<BlogListResponse> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (limit) params.append('limit', limit.toString());
  // ✅ Use cursor instead of offset for cursor-based pagination
  if (cursor) params.append('cursor', cursor);
  
  const query = params.toString();
  // ✅ Always use v1 endpoint for cursor-based pagination
  const endpoint = `/v1/api/blog${query ? `?${query}` : ''}`;
  
  // If API key is provided as parameter and it's different from stored JWT token, use direct fetch
  const storedToken = auth.getToken();
  if (apiKeyOrToken && apiKeyOrToken !== storedToken) {
    // This is likely an API key, use direct fetch (no token refresh needed)
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyOrToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch blogs');
    }

    const data = await response.json();
    return parseBlogListResponse(data, limit, cursor);
  }
  
  // Use apiRequest for JWT token (with automatic refresh)
  const data = await apiRequest(endpoint, { method: 'GET' });
  return parseBlogListResponse(data, limit, cursor);
}

// Helper function to parse blog list response
// ✅ Updated to support cursor-based pagination (v1 endpoint)
function parseBlogListResponse(data: any, limit?: number, cursor?: string): BlogListResponse {
  if (data.success && data.data) {
    // v1 endpoint returns: { success: true, data: [...], meta: { next_cursor, has_more, limit } }
    return {
      posts: Array.isArray(data.data) ? data.data : [],
      total: data.meta?.total || (Array.isArray(data.data) ? data.data.length : 0),
      limit: data.meta?.limit || limit || 50,
      offset: 0, // Keep for backward compatibility, but not used in v1 endpoint
      // ✅ Add cursor-based pagination fields
      nextCursor: data.meta?.next_cursor,
      hasMore: data.meta?.has_more,
    };
  } else if (Array.isArray(data)) {
    return {
      posts: data,
      total: data.length,
      limit: limit || 50,
      offset: 0,
      nextCursor: undefined,
      hasMore: false,
    };
  } else if (data.data && Array.isArray(data.data)) {
    return {
      posts: data.data,
      total: data.meta?.total || data.data.length,
      limit: data.meta?.limit || limit || 50,
      offset: data.meta?.offset || 0,
      nextCursor: data.meta?.next_cursor,
      hasMore: data.meta?.has_more,
    };
  }
  
  return {
    posts: [],
    total: 0,
    limit: limit || 50,
    offset: 0,
    nextCursor: undefined,
    hasMore: false,
  };
}

// Alias for getAllBlogs (for backward compatibility)
export const getAll = getAllBlogs;

// Get single blog by ID with API key or JWT token
export async function getBlogById(
  apiKeyOrToken?: string,
  id?: string,
): Promise<BlogPost> {
  // Support both (apiKeyOrToken, id) and (id) signatures
  let actualId = id;
  let token = apiKeyOrToken;
  
  if (!id && apiKeyOrToken) {
    // If only one parameter, it's the ID
    actualId = apiKeyOrToken;
    token = auth.getToken() || undefined;
  } else if (!token) {
    token = auth.getToken() || undefined;
  }
  
  if (!actualId) {
    throw new Error('Blog ID is required');
  }
  
  // If API key is provided as parameter and it's different from stored JWT token, use direct fetch
  const storedToken = auth.getToken();
  if (token && token !== storedToken) {
    // ✅ Always use v1 endpoint
    const response = await fetch(`${API_BASE_URL}/v1/api/blog/${actualId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch blog');
    }

    const data = await response.json();
    return data.data || data;
  }
  
  // Use apiRequest for JWT token (with automatic refresh)
  // ✅ Always use v1 endpoint
  const data = await apiRequest(`/v1/api/blog/${actualId}`, { method: 'GET' });
  return data.data || data;
}

// Get single blog by slug with API key or JWT token
export async function getBlogBySlug(
  apiKeyOrToken?: string,
  slug?: string,
): Promise<BlogPost> {
  // Support both (apiKeyOrToken, slug) and (slug) signatures
  let actualSlug = slug;
  let token = apiKeyOrToken;
  
  if (!slug && apiKeyOrToken) {
    // If only one parameter, it's the slug
    actualSlug = apiKeyOrToken;
    token = auth.getToken() || undefined;
  } else if (!token) {
    token = auth.getToken() || undefined;
  }
  
  if (!actualSlug) {
    throw new Error('Blog slug is required');
  }
  
  // If API key is provided as parameter and it's different from stored JWT token, use direct fetch
  const storedToken = auth.getToken();
  if (token && token !== storedToken) {
    // ✅ Always use v1 endpoint
    const response = await fetch(`${API_BASE_URL}/v1/api/blog/slug/${actualSlug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch blog');
    }

    const data = await response.json();
    return data.data || data;
  }
  
  // Use apiRequest for JWT token (with automatic refresh)
  // ✅ Always use v1 endpoint
  const data = await apiRequest(`/v1/api/blog/slug/${actualSlug}`, { method: 'GET' });
  return data.data || data;
}

// Helper function to make authenticated API calls with automatic token refresh
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  retry = true,
): Promise<any> {
  let token = auth.getToken();

  // Check if token is expired or will expire soon (within 5 minutes) and refresh if needed
  if (token) {
    if (auth.isTokenExpired()) {
      // Token is expired, refresh it
      token = await refreshAccessToken();
      if (!token) {
        // Refresh failed - logout and redirect
        auth.logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please login again.');
      }
    } else {
      // Check if token will expire soon (within 5 minutes) and refresh proactively
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
        
        if (exp < fiveMinutesFromNow) {
          // Token will expire soon, refresh it proactively
          const newToken = await refreshAccessToken();
          if (newToken) {
            token = newToken;
          }
        }
      } catch (error) {
        // If we can't parse the token, try to refresh it
        const newToken = await refreshAccessToken();
        if (newToken) {
          token = newToken;
        }
      }
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const fetchOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };
  
  console.log(`apiRequest: ${options.method || 'GET'} ${url}`, {
    hasBody: !!options.body,
    bodyLength: typeof options.body === 'string' ? options.body.length : 'N/A',
    hasToken: !!token,
  });

  const response = await fetch(url, fetchOptions);

  console.log(`apiRequest: Response status: ${response.status} ${response.statusText}`, {
    ok: response.ok,
    endpoint,
  });

  if (!response.ok) {
    if (response.status === 401 && retry) {
      // Token might be expired, try refreshing once
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Retry the request with new token
        return apiRequest(endpoint, options, false);
      }
      
      // Refresh failed - logout and redirect
      auth.logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }
    
    const errorData = await response.json().catch(() => ({}));
    console.error(`apiRequest: Error response for ${endpoint}:`, errorData);
    throw new Error(errorData.message || 'Request failed');
  }

  const jsonResponse = await response.json();
  console.log(`apiRequest: Success response for ${endpoint}:`, jsonResponse);
  return jsonResponse;
}

// User Profile API
export async function getProfile() {
  return apiRequest('/auth/profile', { method: 'GET' });
}

export async function updateProfile(data: {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
}) {
  const response = await apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  
  // Update user data in localStorage if successful
  if (response.success && response.data) {
    auth.setUser(response.data);
  }
  
  return response;
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  return apiRequest('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function deleteAccount(currentPassword: string) {
  return apiRequest('/auth/account', {
    method: 'DELETE',
    body: JSON.stringify({ currentPassword }),
  });
}

// Posts API
// Unsplash API
export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  links: {
    html: string;
  };
}

export async function searchUnsplashPhotos(query: string, perPage: number = 8, page: number = 1): Promise<UnsplashPhoto[]> {
  try {
    const response = await apiRequest(`/unsplash/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`, {
      method: 'GET',
    });
    console.log('Unsplash API response:', response);
    // Response can be { success: true, data: [...] } or directly the array
    if (response.data) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  } catch (error) {
    console.error('Error in searchUnsplashPhotos:', error);
    throw error;
  }
}

export async function triggerUnsplashDownload(photoId: string): Promise<void> {
  await apiRequest(`/unsplash/download/${photoId}`, {
    method: 'GET',
  });
}

export interface GeneratePostRequest {
  workspaceId: string;
  topic: string;
  language?: 'tr' | 'en';
  tone?: string;
  length?: string;
  seoMode?: boolean;
  model?: 'gpt-4o-mini' | 'gpt-4.1-mini' | 'gpt-4.1';
  format?: 'md' | 'html' | 'json';
  additionalContext?: string;
  targetAudience?: string;
  coverImageUrl?: string;
  coverImageCreditJson?: string;
  targetId?: string;
}

export interface GeneratePostResponse {
  jobId?: string;
  postId?: string;
  id?: string; // Legacy support
  status: string;
}

export interface PostTag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  workspaceId: string;
  authorId: string;
  language: string;
  status: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImageId?: string;
  coverImageUrl?: string;
  coverImageCreditJson?: {
    name: string;
    photographerUrl: string;
    photoUrl: string;
  };
  canonicalUrl?: string;
  publishedAt?: string;
  scheduledAt?: string;
  publishedRevisionId?: string;
  lastError?: string;
  hiddenByAdmin?: boolean;
  hiddenAt?: string;
  hiddenReason?: string;
  tags?: PostTag[];
  revisions?: PostRevision[];
  author?: {
    id: string;
    name: string;
    email: string;
  };
  workspace?: {
    id: string;
    name: string;
    description?: string;
    color?: string;
    owner?: {
      id: string;
      name: string;
      email: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface PostRevision {
  id: string;
  postId: string;
  version: number;
  editor: string;
  contentFormat: string;
  content: string;
  contentHash?: string;
  promptId?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  instructions?: string;
  inputPrompt?: string;
  latencyMs?: number;
  provider?: string;
  responseId?: string;
  createdAt: string;
}

export async function generatePost(data: GeneratePostRequest): Promise<GeneratePostResponse> {
  return apiRequest('/posts/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPublicPosts(limit?: number, postIds?: string[]): Promise<Post[]> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (postIds && postIds.length > 0) {
    params.append('ids', postIds.join(','));
  }
  // Add timestamp to bypass cache
  params.append('_t', Date.now().toString());
  
  const query = params.toString();
  const response = await fetch(`${API_BASE_URL}/posts/public${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Bypass cache to get fresh data
  });

  if (!response.ok) {
    throw new Error('Failed to fetch public posts');
  }

  const data = await response.json();
  // Backend returns { success: true, data: [...] }
  return data.data || data || [];
}

export async function getPosts(workspaceId?: string, status?: string): Promise<Post[]> {
  const params = new URLSearchParams();
  if (workspaceId) params.append('workspaceId', workspaceId);
  if (status) params.append('status', status);
  
  const query = params.toString();
  return apiRequest(`/posts${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function getPost(id: string): Promise<Post> {
  return apiRequest(`/posts/${id}`, { method: 'GET' });
}

export async function updatePost(id: string, data: Partial<Post>): Promise<Post> {
  return apiRequest(`/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deletePost(id: string): Promise<void> {
  const response = await apiRequest(`/posts/${id}`, { method: 'DELETE' });
  // DELETE endpoint returns { message: 'Post deleted successfully' } or void
  return;
}

export async function publishPost(id: string, revisionId?: string): Promise<Post> {
  const response = await apiRequest(`/posts/${id}/publish`, {
    method: 'POST',
    body: JSON.stringify(revisionId ? { revisionId } : {}),
  });
  return response.data || response;
}

export async function unpublishPost(id: string): Promise<Post> {
  const response = await apiRequest(`/posts/${id}/unpublish`, {
    method: 'POST',
  });
  return response.data || response;
}

export async function schedulePost(id: string, scheduledAt: string, revisionId?: string): Promise<Post> {
  const response = await apiRequest(`/posts/${id}/schedule`, {
    method: 'POST',
    body: JSON.stringify({ scheduledAt, ...(revisionId ? { revisionId } : {}) }),
  });
  return response.data || response;
}

export async function unschedulePost(id: string): Promise<Post> {
  const response = await apiRequest(`/posts/${id}/unschedule`, {
    method: 'POST',
  });
  return response.data || response;
}

// Assets API
export interface Asset {
  id: string;
  workspaceId: string;
  type: string;
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  createdAt: string;
}

export async function uploadAsset(
  workspaceId: string,
  file: File,
  alt?: string,
): Promise<Asset> {
  // Check and refresh token if needed before making the request
  let token = auth.getToken();
  
  if (token) {
    if (auth.isTokenExpired()) {
      token = await refreshAccessToken();
      if (!token) {
        auth.logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please login again.');
      }
    } else {
      // Check if token will expire soon (within 5 minutes) and refresh proactively
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
        
        if (exp < fiveMinutesFromNow) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            token = newToken;
          }
        }
      } catch (error) {
        // If we can't parse the token, try to refresh it
        const newToken = await refreshAccessToken();
        if (newToken) {
          token = newToken;
        }
      }
    }
  }
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('workspaceId', workspaceId);
  if (alt) formData.append('alt', alt);

  const response = await fetch(`${API_BASE_URL}/assets/upload`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    // If 401, try refreshing token once and retry
    if (response.status === 401 && token) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const retryResponse = await fetch(`${API_BASE_URL}/assets/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
          body: formData,
        });
        
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to upload asset');
        }
        
        return retryResponse.json();
      } else {
        auth.logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to upload asset');
  }

  return response.json();
}

export async function getAssets(workspaceId?: string): Promise<Asset[]> {
  const params = new URLSearchParams();
  if (workspaceId) params.append('workspaceId', workspaceId);
  
  const query = params.toString();
  return apiRequest(`/assets${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function getAsset(id: string): Promise<Asset> {
  return apiRequest(`/assets/${id}`, { method: 'GET' });
}

export async function deleteAsset(id: string): Promise<void> {
  return apiRequest(`/assets/${id}`, { method: 'DELETE' });
}

// Workspaces API
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  description?: string;
  color?: string;
  siteUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getWorkspaces(): Promise<Workspace[]> {
  return apiRequest('/workspaces', { method: 'GET' });
}

export async function getWorkspace(id: string): Promise<Workspace> {
  return apiRequest(`/workspaces/${id}`, { method: 'GET' });
}

export async function createWorkspace(name: string, description?: string, color?: string, siteUrl?: string): Promise<Workspace> {
  const response = await apiRequest('/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name, description, color, siteUrl }),
  });
  return response.data || response;
}

export async function updateWorkspace(id: string, name: string, description?: string, color?: string, siteUrl?: string): Promise<Workspace> {
  const response = await apiRequest(`/workspaces/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, description, color, siteUrl }),
  });
  return response.data || response;
}

export async function deleteWorkspace(id: string, force: boolean = false): Promise<void> {
  await apiRequest(`/workspaces/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ force }),
  });
}

// API Keys
export interface ApiKey {
  id: string;
  apiKey?: string; // Only shown on creation
  clientId: string;
  clientSecret?: string; // Only shown on creation
  name: string;
  keyPreview?: string;
  lastUsedAt?: string;
  expiresAt?: string | null;
  active: boolean;
  createdAt: string;
  warning?: string;
  organizationId?: string; // Organization ID
  projectId?: string; // Project ID
}

export interface CreateApiKeyRequest {
  name?: string;
  expiresAt?: string;
}

export async function createWorkspaceApiKey(workspaceId: string, data: CreateApiKeyRequest): Promise<ApiKey> {
  const response = await apiRequest(`/workspaces/${workspaceId}/api-keys`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data || response;
}

export async function listWorkspaceApiKeys(workspaceId: string): Promise<ApiKey[]> {
  const response = await apiRequest(`/workspaces/${workspaceId}/api-keys`, { method: 'GET' });
  return response.data || response;
}

export async function revokeWorkspaceApiKey(workspaceId: string, keyId: string): Promise<void> {
  await apiRequest(`/workspaces/${workspaceId}/api-keys/${keyId}/revoke`, {
    method: 'POST',
  });
}

// Usage API
export interface UsageLedger {
  id: string;
  userId: string;
  month: string;
  estimatedCostUsd: number;
  tokensIn: number;
  tokensOut: number;
  requestCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
  };
}

export interface UsageStats {
  month: string;
  totalCost: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalRequests: number;
  activeUsers: number;
  usageByUser: Array<{
    userId: string;
    userEmail: string;
    cost: number;
    tokensIn: number;
    tokensOut: number;
    requestCount: number;
  }>;
}

export async function getCurrentUsage(): Promise<UsageLedger> {
  const response = await apiRequest('/usage/current', { method: 'GET' });
  return response.data || response;
}

export async function getUsageHistory(): Promise<UsageLedger[]> {
  const response = await apiRequest('/usage/history', { method: 'GET' });
  return response.data || response;
}

export interface WorkspaceUsage {
  workspaceId: string;
  workspaceName: string;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  requestCount: number;
}

export async function getWorkspaceUsage(month?: string): Promise<WorkspaceUsage[]> {
  const query = month ? `?month=${month}` : '';
  const response = await apiRequest(`/usage/workspaces${query}`, { method: 'GET' });
  return response.data || response;
}

export async function getAdminUsageStats(month?: string): Promise<UsageStats> {
  const query = month ? `?month=${month}` : '';
  const response = await apiRequest(`/admin/usage/stats${query}`, { method: 'GET' });
  return response.data || response;
}

export async function getAllUsage(month?: string): Promise<UsageLedger[]> {
  const query = month ? `?month=${month}` : '';
  const response = await apiRequest(`/admin/usage/all${query}`, { method: 'GET' });
  return response.data || response;
}

// Admin API
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  blogsCount: number;
  status: 'active' | 'inactive';
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalPosts: number;
  activeUsers: number;
  postsThisMonth: number;
  totalTokens: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const response = await apiRequest('/admin/dashboard/stats', { method: 'GET' });
  return response.data || response;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await apiRequest('/admin/users', { method: 'GET' });
  return response.data || response;
}

export async function getAdminUserById(id: string): Promise<AdminUser> {
  const response = await apiRequest(`/admin/users/${id}`, { method: 'GET' });
  return response.data || response;
}

export async function updateAdminUserRole(id: string, role: 'user' | 'admin'): Promise<AdminUser> {
  const response = await apiRequest(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
  return response.data || response;
}

export async function updateAdminUser(
  id: string,
  updateData: { name?: string; email?: string; role?: 'user' | 'admin'; password?: string },
): Promise<AdminUser> {
  const response = await apiRequest(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });
  return response.data || response;
}

export async function deleteAdminUser(id: string): Promise<void> {
  await apiRequest(`/admin/users/${id}`, { method: 'DELETE' });
}

export async function getAdminPosts(filters?: {
  status?: string;
  authorId?: string;
  workspaceId?: string;
  page?: number;
  limit?: number;
}): Promise<Post[] | { data: Post[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.authorId) params.append('authorId', filters.authorId);
  if (filters?.workspaceId) params.append('workspaceId', filters.workspaceId);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const query = params.toString();
  const response = await apiRequest(`/admin/posts${query ? `?${query}` : ''}`, { method: 'GET' });
  
  // If pagination info exists, return with pagination
  if (response.pagination) {
    return {
      data: response.data || [],
      pagination: response.pagination,
    };
  }
  
  // Backward compatibility: return array if no pagination
  return response.data || response;
}

export async function getAdminPostById(id: string): Promise<Post> {
  const response = await apiRequest(`/admin/posts/${id}`, { method: 'GET' });
  return response.data || response;
}

export async function hideAdminPost(id: string, reason?: string): Promise<Post> {
  const response = await apiRequest(`/admin/posts/${id}/hide`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
  return response.data || response;
}

export async function unhideAdminPost(id: string): Promise<Post> {
  const response = await apiRequest(`/admin/posts/${id}/unhide`, {
    method: 'PATCH',
  });
  return response.data || response;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  color?: string;
  ownerId: string;
  owner?: {
    id: string;
    name?: string;
    email: string;
  };
  postsCount?: number;
  recentPosts?: Post[];
  sites?: Array<{
    id: string;
    name: string;
    domain?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export async function getAdminWorkspaces(filters?: {
  ownerId?: string;
}): Promise<Workspace[]> {
  const params = new URLSearchParams();
  if (filters?.ownerId) params.append('ownerId', filters.ownerId);
  
  const query = params.toString();
  const response = await apiRequest(`/admin/workspaces${query ? `?${query}` : ''}`, { method: 'GET' });
  return response.data || response;
}

export async function getAdminWorkspaceById(id: string): Promise<Workspace> {
  const response = await apiRequest(`/admin/workspaces/${id}`, { method: 'GET' });
  return response.data || response;
}

// Plans API
export interface PlanDefinition {
  id: string;
  name: string;
  level: 'starter' | 'pro' | 'enterprise';
  price: {
    monthly: number;
    yearly: number;
  };
  features: {
    maxBlogs: number | 'unlimited';
    maxTokensPerMonth: number | 'unlimited';
    maxWorkspaces: number | 'unlimited';
    languages: string[];
    support: string;
    apiAccess: boolean;
    customTraining: boolean;
    accountManager: boolean;
    prioritySupport: boolean;
    webhookAccess: boolean;
    customBranding: boolean;
    advancedSeo: boolean;
    analytics: boolean;
  };
  popular?: boolean;
  active: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getAdminPlans(): Promise<PlanDefinition[]> {
  const response = await apiRequest('/admin/plans', { method: 'GET' });
  return response.data || response;
}

// User Plans API
export interface UserPlanInfo {
  currentPlan: PlanDefinition | null;
  subscription: {
    id: string;
    status: string;
    billingPeriod: 'monthly' | 'yearly';
    startedAt: string;
    expiresAt: string | null;
    cancelledAt: string | null;
    autoRenew: boolean;
    isExpired?: boolean;
    daysRemaining: number | null;
  } | null;
  isFree: boolean;
}

export interface BillingHistoryItem {
  id: string;
  plan: PlanDefinition;
  status: string;
  billingPeriod: 'monthly' | 'yearly';
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
  autoRenew: boolean;
  createdAt: string;
}

export async function getAvailablePlans(): Promise<PlanDefinition[]> {
  const response = await apiRequest('/plans/available', { method: 'GET' }, false);
  return response.data || response;
}

export async function getCurrentPlan(): Promise<UserPlanInfo> {
  const response = await apiRequest('/plans/current', { method: 'GET' });
  return response.data || response;
}

export async function getBillingHistory(): Promise<BillingHistoryItem[]> {
  const response = await apiRequest('/plans/billing', { method: 'GET' });
  return response.data || response;
}

// Admin Subscriptions & Payments API
export interface AdminSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  billingPeriod: 'monthly' | 'yearly';
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  plan?: PlanDefinition;
}

export interface AdminPayment {
  id: string;
  userId: string;
  subscriptionId: string | null;
  planId: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: 'credit_card' | 'bank_transfer' | 'paypal' | 'other' | null;
  transactionId: string | null;
  externalId: string | null;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  subscription?: AdminSubscription;
  plan?: PlanDefinition;
}

export interface SalesStats {
  totalRevenue: number;
  totalPayments: number;
  uniqueCustomers: number;
  averageOrderValue: number;
  planSales: Array<{
    planName: string;
    count: number;
    revenue: number;
  }>;
  payments: AdminPayment[];
}

export async function getAdminSubscriptions(filters?: {
  status?: string;
  userId?: string;
}): Promise<AdminSubscription[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.userId) params.append('userId', filters.userId);
  const query = params.toString();
  const response = await apiRequest(`/admin/subscriptions${query ? `?${query}` : ''}`, { method: 'GET' });
  return response.data || response;
}

export async function getAdminPayments(filters?: {
  status?: string;
  userId?: string;
  subscriptionId?: string;
}): Promise<AdminPayment[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.subscriptionId) params.append('subscriptionId', filters.subscriptionId);
  const query = params.toString();
  const response = await apiRequest(`/admin/payments${query ? `?${query}` : ''}`, { method: 'GET' });
  return response.data || response;
}

export async function getAdminSalesStats(month?: string): Promise<SalesStats> {
  const query = month ? `?month=${month}` : '';
  const response = await apiRequest(`/admin/sales/stats${query}`, { method: 'GET' });
  return response.data || response;
}

// Public plans endpoint (no auth required, for SSR)
export async function getPublicPlans(): Promise<PlanDefinition[]> {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${API_BASE_URL}/admin/plans/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`Failed to fetch plans: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.data || data || [];
  } catch (error) {
    console.error('Error fetching public plans:', error);
    return [];
  }
}

export async function getAdminPlanById(id: string): Promise<PlanDefinition> {
  const response = await apiRequest(`/admin/plans/${id}`, { method: 'GET' });
  return response.data || response;
}

export async function createAdminPlan(planData: Omit<PlanDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlanDefinition> {
  const response = await apiRequest('/admin/plans', {
    method: 'POST',
    body: JSON.stringify(planData),
  });
  return response.data || response;
}

export async function updateAdminPlan(id: string, updateData: Partial<PlanDefinition>): Promise<PlanDefinition> {
  const response = await apiRequest(`/admin/plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });
  return response.data || response;
}

export async function deleteAdminPlan(id: string): Promise<void> {
  await apiRequest(`/admin/plans/${id}`, { method: 'DELETE' });
}

export async function updateAdminUserPlan(userId: string, planId: string | null): Promise<AdminUser> {
  const response = await apiRequest(`/admin/users/${userId}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ planId }),
  });
  return response.data || response;
}

// Activity Logs
export interface ActivityLog {
  id: string;
  type: 'user' | 'blog' | 'system' | 'auth';
  action: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  target?: {
    type: string;
    id: string;
    name: string;
  };
  targetType?: string;
  targetId?: string;
  targetName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
  createdAt?: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export async function getAdminActivityLogs(filters?: {
  type?: 'user' | 'blog' | 'system' | 'auth';
  severity?: 'info' | 'warning' | 'error' | 'success';
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<ActivityLog[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.severity) params.append('severity', filters.severity);
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const query = params.toString();
  const response = await apiRequest(`/admin/activities${query ? `?${query}` : ''}`, { method: 'GET' });
  return response.data || response;
}

// FAQ API
export interface FAQ {
  id: string;
  type: 'homepage' | 'page';
  question: string;
  answer: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getPublicFAQs(type?: 'homepage' | 'page'): Promise<FAQ[]> {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    
    const query = params.toString();
    const url = `${API_BASE_URL}/faq/public${query ? `?${query}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure fresh data on each request
    });

    if (!response.ok) {
      console.warn(`Failed to fetch FAQs: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const faqs = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
    return faqs;
  } catch (error) {
    console.error('Error fetching public FAQs:', error);
    return [];
  }
}

export async function getAdminFAQs(type?: 'homepage' | 'page'): Promise<FAQ[]> {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  
  const query = params.toString();
  const response = await apiRequest(`/faq${query ? `?${query}` : ''}`, { method: 'GET' });
  return response.data || response;
}

export async function getAdminFAQById(id: string): Promise<FAQ> {
  const response = await apiRequest(`/faq/${id}`, { method: 'GET' });
  return response.data || response;
}

export async function createAdminFAQ(faqData: Omit<FAQ, 'id' | 'createdAt' | 'updatedAt'>): Promise<FAQ> {
  const response = await apiRequest('/faq', {
    method: 'POST',
    body: JSON.stringify(faqData),
  });
  return response.data || response;
}

export async function updateAdminFAQ(id: string, updateData: Partial<FAQ>): Promise<FAQ> {
  const response = await apiRequest(`/faq/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });
  return response.data || response;
}

export async function deleteAdminFAQ(id: string): Promise<void> {
  await apiRequest(`/faq/${id}`, { method: 'DELETE' });
}

// Homepage Management API
// Public version (no auth required) - for homepage display
export async function getHomepagePosts(): Promise<string[]> {
  try {
    // Public endpoint kullan (authentication gerektirmez)
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${API_BASE_URL}/admin/homepage/posts/public`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn('getHomepagePosts: Failed to fetch, returning empty array');
      return [];
    }

    const data = await response.json();
    console.log('getHomepagePosts raw response:', data);
    
    // Response formatını kontrol et
    let postIds: string[] = [];
    
    // Backend'den { success: true, data: [...] } formatında geliyor
    if (data && typeof data === 'object') {
      // Önce data property'sini kontrol et
      if (data.data !== undefined) {
        if (Array.isArray(data.data)) {
          postIds = data.data;
        } else {
          console.warn('getHomepagePosts: response.data is not an array:', data.data);
        }
      } 
      // Eğer data yoksa ama response direkt array ise
      else if (Array.isArray(data)) {
        postIds = data;
      }
      // Eğer success: true var ama data yoksa
      else if (data.success === true && !data.data) {
        console.warn('getHomepagePosts: success is true but data is missing');
        postIds = [];
      }
    } 
    // Response direkt array ise
    else if (Array.isArray(data)) {
      postIds = data;
    }
    
    const normalized = Array.isArray(postIds) ? postIds.map((id) => String(id)) : [];
    console.log('getHomepagePosts parsed postIds:', normalized);
    return normalized;
  } catch (err) {
    console.error('Error loading homepage posts:', err);
    return [];
  }
}

// Admin version (auth required) - for admin panel
export async function getHomepagePostsAdmin(): Promise<string[]> {
  try {
    // Backend endpoint'ini kullan (authentication gerektirir)
    const response = await apiRequest('/admin/homepage/posts', { method: 'GET' });
    
    console.log('getHomepagePostsAdmin raw response:', response);
    
    // Response formatını kontrol et
    let postIds: string[] = [];
    
    // Backend'den { success: true, data: [...] } formatında geliyor
    if (response && typeof response === 'object') {
      // Önce data property'sini kontrol et
      if (response.data !== undefined) {
        if (Array.isArray(response.data)) {
          postIds = response.data;
        } else {
          console.warn('getHomepagePostsAdmin: response.data is not an array:', response.data);
        }
      } 
      // Eğer data yoksa ama response direkt array ise
      else if (Array.isArray(response)) {
        postIds = response;
      }
      // Eğer success: true var ama data yoksa
      else if (response.success === true && !response.data) {
        console.warn('getHomepagePostsAdmin: success is true but data is missing');
        postIds = [];
      }
    } 
    // Response direkt array ise
    else if (Array.isArray(response)) {
      postIds = response;
    }
    
    const normalized = Array.isArray(postIds) ? postIds.map((id) => String(id)) : [];
    console.log('getHomepagePostsAdmin parsed postIds:', normalized);
    return normalized;
  } catch (err) {
    console.error('Error loading homepage posts (admin):', err);
    return [];
  }
}

/** Kaydedilen ID listesini döndürür (backend response.data). */
export async function setHomepagePosts(postIds: string[]): Promise<string[]> {
  const requestBody = { postIds };
  const response = await apiRequest('/admin/homepage/posts', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
  if (!response) throw new Error('No response from server');
  if (response.success === false) {
    throw new Error(response?.message || 'Failed to save homepage posts');
  }
  const saved = Array.isArray(response.data) ? response.data.map((id: unknown) => String(id)) : [];
  return saved;
}

// Contact API
export interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function createContact(contactData: CreateContactRequest): Promise<Contact> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const response = await fetch(`${API_BASE_URL}/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contactData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Mesaj gönderilemedi');
  }

  const data = await response.json();
  return data.data || data;
}

export async function getAdminContacts(): Promise<Contact[]> {
  const response = await apiRequest('/contact', { method: 'GET' });
  return response.data || response;
}

export async function getAdminContactUnreadCount(): Promise<number> {
  const response = await apiRequest('/contact/unread-count', { method: 'GET' });
  return response.data?.count || 0;
}

export async function markContactAsRead(id: string): Promise<Contact> {
  const response = await apiRequest(`/contact/${id}/read`, {
    method: 'PATCH',
  });
  return response.data || response;
}

export async function markContactAsUnread(id: string): Promise<Contact> {
  const response = await apiRequest(`/contact/${id}/unread`, {
    method: 'PATCH',
  });
  return response.data || response;
}

// Notifications API
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message?: string | null;
  type: 'info' | 'warning' | 'success' | 'system';
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface CreateBroadcastNotificationRequest {
  title: string;
  message?: string;
  type?: 'info' | 'warning' | 'success' | 'system';
  linkUrl?: string;
}

export async function getNotifications(options?: { unread?: boolean; limit?: number }): Promise<Notification[]> {
  const params = new URLSearchParams();
  if (options?.unread) params.append('unread', 'true');
  if (options?.limit) params.append('limit', options.limit.toString());

  const query = params.toString();
  const response = await apiRequest(`/notifications${query ? `?${query}` : ''}`, { method: 'GET' });
  return response.data || response;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiRequest('/notifications/unread-count', { method: 'GET' });
  return response.data?.count ?? 0;
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  const response = await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
  return response.data || response;
}

export async function markAllNotificationsAsRead(): Promise<{ updated: number }> {
  const response = await apiRequest('/notifications/read-all', { method: 'PATCH' });
  return response.data || response;
}

export async function createBroadcastNotification(payload: CreateBroadcastNotificationRequest) {
  const response = await apiRequest('/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data || response;
}