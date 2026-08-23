import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../config/api.config';
import { useQueueWebSocket } from './apiQueue';

export type GameType = 'UID' | 'ID_PASS';

export interface GameItem {
  id: string;
  name: string;
  code: string;
  type: GameType;
  imageUrl?: string | null;
  isUse: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGameInput {
  name: string;
  code: string;
  type?: GameType;
  imageUrl?: string | null;
  isUse?: boolean;
}

export interface UpdateGameInput {
  name?: string;
  code?: string;
  type?: GameType;
  imageUrl?: string | null;
  isUse?: boolean;
}

export async function getGames(): Promise<GameItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${API_BASE_URL}/games`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Failed to fetch games: ${response.statusText}`);
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

export async function getGameById(id: string): Promise<GameItem> {
  const response = await fetch(`${API_BASE_URL}/games/${id}`);
  if (!response.ok) {
    throw new Error('Game not found');
  }
  return response.json();
}

export async function createGame(data: CreateGameInput): Promise<GameItem> {
  const response = await fetch(`${API_BASE_URL}/games`, {
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
    throw new Error(`Failed to create game: ${errorMsg}`);
  }

  return response.json();
}

export async function updateGame({ id, data }: { id: string; data: UpdateGameInput }): Promise<GameItem> {
  const response = await fetch(`${API_BASE_URL}/games/${id}`, {
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
    throw new Error(`Failed to update game: ${errorMsg}`);
  }

  return response.json();
}

export async function deleteGame(id: string): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/games/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errBody = await response.json();
      if (errBody?.message) errorMsg = errBody.message;
    } catch {}
    throw new Error(`Failed to delete game: ${errorMsg}`);
  }

  return response.json();
}

export function useGetGames() {
  useQueueWebSocket();

  return useQuery({
    queryKey: ['games'],
    queryFn: getGames,
    staleTime: 2000,
    refetchInterval: 5000,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

export function useUpdateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

export function useDeleteGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

export function useToggleGameStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isUse }: { id: string; isUse: boolean }) =>
      updateGame({ id, data: { isUse } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}
