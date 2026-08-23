import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../config/api.config';
import { useQueueWebSocket } from './apiQueue';

export interface PriceItem {
  id: string;
  name?: string | null;
  usd: number;
  roundedUsd?: number | null;
  price: number; // THB
  isUse: boolean;
  sortOrder?: number;
  games?: Array<{
    gamePriceId: string;
    gameId: string;
    name: string;
    code: string;
    type: string;
    imageUrl?: string | null;
    isUse: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePriceInput {
  name?: string;
  usd: number;
  roundedUsd?: number;
  price: number;
  isUse?: boolean;
  sortOrder?: number;
}

export interface UpdatePriceInput {
  name?: string;
  usd?: number;
  roundedUsd?: number;
  price?: number;
  isUse?: boolean;
  sortOrder?: number;
}

export async function getPrices(): Promise<PriceItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${API_BASE_URL}/prices`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Failed to fetch prices: ${response.statusText}`);
    }
    return await response.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (Request Timeout)');
    }
    throw err;
  }
}

export async function getPriceById(id: string): Promise<PriceItem> {
  const response = await fetch(`${API_BASE_URL}/prices/${id}`);
  if (!response.ok) {
    throw new Error('Price not found');
  }
  return response.json();
}

export async function createPrice(data: CreatePriceInput): Promise<PriceItem> {
  const response = await fetch(`${API_BASE_URL}/prices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errBody = await response.json();
      if (errBody?.message) errorMsg = errBody.message;
    } catch {}
    throw new Error(`Failed to create price: ${errorMsg}`);
  }

  return response.json();
}

export async function updatePrice({ id, data }: { id: string; data: UpdatePriceInput }): Promise<PriceItem> {
  const response = await fetch(`${API_BASE_URL}/prices/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errBody = await response.json();
      if (errBody?.message) errorMsg = errBody.message;
    } catch {}
    throw new Error(`Failed to update price: ${errorMsg}`);
  }

  return response.json();
}

export async function deletePrice(id: string): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/prices/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errBody = await response.json();
      if (errBody?.message) errorMsg = errBody.message;
    } catch {}
    throw new Error(`Failed to delete price: ${errorMsg}`);
  }

  return response.json();
}

export async function bulkImportDefaultPrices(): Promise<PriceItem[]> {
  const response = await fetch(`${API_BASE_URL}/prices/bulk-import-defaults`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to bulk import default rates');
  }

  return response.json();
}

export function useGetPrices() {
  useQueueWebSocket();

  return useQuery({
    queryKey: ['prices'],
    queryFn: getPrices,
    staleTime: 2000,
    refetchInterval: 5000,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useCreatePrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prices'] });
    },
  });
}

export function useUpdatePrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prices'] });
    },
  });
}

export function useDeletePrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prices'] });
    },
  });
}

export async function setPriceGames({ priceId, gameIds }: { priceId: string; gameIds: string[] }): Promise<PriceItem> {
  const response = await fetch(`${API_BASE_URL}/prices/${priceId}/games`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gameIds }),
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errBody = await response.json();
      if (errBody?.message) errorMsg = errBody.message;
    } catch {}
    throw new Error(`Failed to set price games: ${errorMsg}`);
  }

  return response.json();
}

export function useSetPriceGames() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setPriceGames,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prices'] });
    },
  });
}

export function useBulkImportDefaults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkImportDefaultPrices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prices'] });
    },
  });
}

export function useTogglePriceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isUse }: { id: string; isUse: boolean }) =>
      updatePrice({ id, data: { isUse } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prices'] });
    },
  });
}
