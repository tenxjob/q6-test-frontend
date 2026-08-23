import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../config/api.config';
import { useQueueWebSocket } from './apiQueue';
import type { GameType } from './apiGame';

export interface GamePricePack {
  gamePriceId?: string;
  priceId: string;
  name?: string | null;
  usd?: number;
  roundedUsd?: number;
  masterPrice?: number;
  packRate?: number | null;
  effectiveRate?: number;
  sellingPrice: number;
  isUse: boolean;
  createdAt?: string;
}

export interface GamePriceItem {
  id: string;
  name: string;
  code: string;
  type: GameType;
  rate: number;
  imageUrl?: string | null;
  isUse: boolean;
  createdAt: string;
  updatedAt: string;
  packsCount: number;
  packs: GamePricePack[];
}

export interface ConfigureGamePacksInput {
  gameId: string;
  rate?: number;
  packIds: string[];
  packOverrides?: Array<{
    priceId: string;
    rate?: number;
    customPrice?: number;
    isUse?: boolean;
  }>;
}

export interface CreateUidPackInput {
  gameId: string;
  name: string;
  price: number;
  isUse?: boolean;
}

export async function getGamePrices(): Promise<GamePriceItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${API_BASE_URL}/game-prices`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Failed to fetch game prices: ${response.statusText}`);
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

export async function getGamePriceByGameId(gameId: string): Promise<GamePriceItem> {
  const response = await fetch(`${API_BASE_URL}/game-prices/${gameId}`);
  if (!response.ok) {
    throw new Error('Game price not found');
  }
  return response.json();
}

export async function configureGamePacks({
  gameId,
  rate,
  packIds,
  packOverrides,
}: ConfigureGamePacksInput): Promise<GamePriceItem> {
  const response = await fetch(`${API_BASE_URL}/game-prices/${gameId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rate, packIds, packOverrides }),
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errBody = await response.json();
      if (errBody?.message) errorMsg = errBody.message;
    } catch {}
    throw new Error(`Failed to configure game packs: ${errorMsg}`);
  }

  return response.json();
}

export async function createUidCustomPack(data: CreateUidPackInput): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/game-prices/${data.gameId}/uid-packs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      price: data.price,
      isUse: data.isUse ?? true,
    }),
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errBody = await response.json();
      if (errBody?.message) errorMsg = errBody.message;
    } catch {}
    throw new Error(`Failed to create UID pack: ${errorMsg}`);
  }

  return response.json();
}

export async function deleteUidCustomPack(priceId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/game-prices/uid-packs/${priceId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errBody = await response.json();
      if (errBody?.message) errorMsg = errBody.message;
    } catch {}
    throw new Error(`Failed to delete UID pack: ${errorMsg}`);
  }

  return response.json();
}

export function useGetGamePrices() {
  useQueueWebSocket();

  return useQuery({
    queryKey: ['game-prices'],
    queryFn: getGamePrices,
    staleTime: 2000,
    refetchInterval: 5000,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useConfigureGamePacks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: configureGamePacks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-prices'] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['prices'] });
    },
  });
}

export function useCreateUidCustomPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUidCustomPack,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-prices'] });
      queryClient.invalidateQueries({ queryKey: ['prices'] });
    },
  });
}

export function useDeleteUidCustomPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUidCustomPack,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-prices'] });
      queryClient.invalidateQueries({ queryKey: ['prices'] });
    },
  });
}
