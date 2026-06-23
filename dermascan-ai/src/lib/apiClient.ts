import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) return { 'Content-Type': 'application/json' };
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// FastAPI error responses carry the real reason in a `detail` field — surface
// that to callers instead of a generic "failed: <status>" message.
async function throwForResponse(res: Response, method: string, path: string): Promise<never> {
  let message = `${method} ${path} failed: ${res.status}`;
  try {
    const data = await res.json();
    if (data?.detail) message = data.detail;
  } catch {
    // response body wasn't JSON; keep the generic message
  }
  throw new Error(message);
}

async function apiGet<T>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { method: 'GET', headers });
  if (!res.ok) await throwForResponse(res, 'GET', path);
  return res.json();
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) await throwForResponse(res, 'POST', path);
  return res.json();
}

async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) await throwForResponse(res, 'PUT', path);
  return res.json();
}

async function apiDelete<T>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers });
  if (!res.ok) await throwForResponse(res, 'DELETE', path);
  return res.json();
}

async function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  const user = auth.currentUser;
  const headers: HeadersInit = {};
  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) await throwForResponse(res, 'POST', path);
  return res.json();
}

export { apiGet, apiPost, apiPut, apiDelete, apiPostForm };