import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ListQueueItem {
  id: string;
  queueId: string;
  status: 'pending' | 'finished' | 'canceled';
  channel?: 'facebook' | 'line' | string | null;
  customerName?: string | null;
  url?: string | null;
  createdAt: string;
  updatedAt: string;
  queueName: string;
  queueCode: string;
  queuePrice: number;
}

import { API_BASE_URL } from '../config/api.config';

export async function getPendingListQueues(): Promise<ListQueueItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_BASE_URL}/list-queues/pending`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Failed to fetch pending queues: ${response.statusText}`);
    }
    return await response.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (Timeout)');
    }
    throw err;
  }
}

export async function getHistoryListQueues(): Promise<ListQueueItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_BASE_URL}/list-queues/history`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Failed to fetch queue history: ${response.statusText}`);
    }
    return await response.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (Timeout)');
    }
    throw err;
  }
}

export interface AddToListQueuePayload {
  queueId: string;
  channel?: string;
  customerName?: string;
  url?: string;
}

export async function addToListQueue(payload: AddToListQueuePayload): Promise<ListQueueItem> {
  const response = await fetch(`${API_BASE_URL}/list-queues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errBody = await response.json();
      if (errBody?.message) errorMsg = errBody.message;
    } catch {}
    throw new Error(`Failed to dispatch queue: ${errorMsg}`);
  }
  return response.json();
}

export async function updateListQueueStatus(params: {
  id: string;
  status: 'finished' | 'canceled';
}): Promise<ListQueueItem> {
  const response = await fetch(`${API_BASE_URL}/list-queues/${params.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: params.status }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update queue status: ${response.statusText}`);
  }
  return response.json();
}

export async function removeFromListQueue(id: string): Promise<ListQueueItem> {
  const response = await fetch(`${API_BASE_URL}/list-queues/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to remove queue: ${response.statusText}`);
  }
  return response.json();
}

export function useGetPendingListQueues() {
  return useQuery({
    queryKey: ['list-queues', 'pending'],
    queryFn: getPendingListQueues,
    refetchInterval: 5000, // Auto-refresh active list every 5s
  });
}

export function useGetHistoryListQueues() {
  return useQuery({
    queryKey: ['list-queues', 'history'],
    queryFn: getHistoryListQueues,
  });
}

export function useAddToListQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addToListQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      queryClient.invalidateQueries({ queryKey: ['list-queues', 'pending'] });
    },
  });
}

export function useUpdateListQueueStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateListQueueStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      queryClient.invalidateQueries({ queryKey: ['list-queues', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['list-queues', 'history'] });
    },
  });
}

export function useRemoveFromListQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeFromListQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      queryClient.invalidateQueries({ queryKey: ['list-queues', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['list-queues', 'history'] });
    },
  });
}

export async function updateListQueueDetails(
  id: string,
  payload: { channel?: string; url?: string }
): Promise<ListQueueItem> {
  const response = await fetch(`${API_BASE_URL}/list-queues/${id}/details`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errBody = await response.json();
      if (errBody?.message) errorMsg = errBody.message;
    } catch {}
    throw new Error(`Failed to update details: ${errorMsg}`);
  }

  return response.json();
}

export function useUpdateListQueueDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, channel, url }: { id: string; channel?: string; url?: string }) =>
      updateListQueueDetails(id, { channel, url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      queryClient.invalidateQueries({ queryKey: ['list-queues', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['list-queues', 'history'] });
    },
  });
}
