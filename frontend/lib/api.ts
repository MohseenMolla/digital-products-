import axios from 'axios';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = axios.create({ baseURL: API_BASE, withCredentials: true, timeout: 60000 });

export function errMsg(e: unknown): string {
  if (axios.isAxiosError(e)) return (e.response?.data as { message?: string } | undefined)?.message ?? (e.code === 'ECONNABORTED' ? 'Request timed out' : e.message);
  return e instanceof Error ? e.message : 'Something went wrong';
}
