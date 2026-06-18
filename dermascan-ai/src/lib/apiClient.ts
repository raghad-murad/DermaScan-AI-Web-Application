import { auth } from '@/lib/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request(path: string, options: RequestInit = {}) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API request failed (${response.status}): ${body || response.statusText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const apiGet = (path: string, options: RequestInit = {}) =>
  request(path, { ...options, method: 'GET' });

export const apiPost = (path: string, body?: unknown, options: RequestInit = {}) =>
  request(path, { ...options, method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined });

export const apiPut = (path: string, body?: unknown, options: RequestInit = {}) =>
  request(path, { ...options, method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined });

export const apiDelete = (path: string, options: RequestInit = {}) =>
  request(path, { ...options, method: 'DELETE' });
