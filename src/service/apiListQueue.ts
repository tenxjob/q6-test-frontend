import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ListQueueItem {
  id: string;
  queueId: string;
  status: 'pending' | 'finished' | 'canceled';
  createdAt: string;
  updatedAt: string;
  queueName: string;
  queueCode: string;
  queuePrice: number;
}

import { API_BASE_URL } from '../config/api.config';

export async function getPendingListQueues(): Promise<ListQueueItem[]> {
  const response = await fetch(`${API_BASE_URL}/list-queues/pending`);
  if (!response.ok) {
    throw new Error(`Failed to fetch pending queues: ${response.statusText}`);
  }
  return response.json();
}

export async function getHistoryListQueues(): Promise<ListQueueItem[]> {
  const response = await fetch(`${API_BASE_URL}/list-queues/history`);
  if (!response.ok) {
    throw new Error(`Failed to fetch queue history: ${response.statusText}`);
  }
  return response.json();
}

export async function addToListQueue(queueId: string): Promise<ListQueueItem> {
  const response = await fetch(`${API_BASE_URL}/list-queues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queueId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to dispatch queue: ${response.statusText}`);
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
