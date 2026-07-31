import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface QueueItem {
  id: string;
  name: string;
  price: number;
  code: string;
  createAt?: string;
  updateAt?: string;
  listCreatedAt?: string;
  listStatus?: 'pending' | 'finished' | 'canceled' | null;
  listQueueId?: string | null;
}

export interface CreateQueueInput {
  name: string;
  price: number;
  code: string;
}

import { API_BASE_URL, WS_URL } from '../config/api.config';

export async function getQueues(): Promise<QueueItem[]> {
  const response = await fetch(`${API_BASE_URL}/queues`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch queues: ${response.statusText}`);
  }

  return response.json();
}

export async function createQueue(data: CreateQueueInput): Promise<QueueItem> {
  const response = await fetch(`${API_BASE_URL}/queues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create queue: ${response.statusText}`);
  }

  return response.json();
}

let socketInstance: WebSocket | null = null;

export function sendWebSocketMessage(data: unknown) {
  if (socketInstance && socketInstance.readyState === WebSocket.OPEN) {
    socketInstance.send(JSON.stringify(data));
  }
}

export function useQueueWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      try {
        const ws = new WebSocket(WS_URL);
        socketInstance = ws;

        ws.onopen = () => {
          console.log('⚡ Connected to Queue WebSocket');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.type) {
              if (data.type === 'EXPRESS_QUEUE_UPDATED' && data.expressQueueIds) {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('express_queue_ids', JSON.stringify(data.expressQueueIds));
                  window.dispatchEvent(new CustomEvent('express_queue_changed', { detail: data.expressQueueIds }));
                }
              }

              if (data.type === 'HOLD_QUEUE_UPDATED' && data.holdQueueIds) {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('hold_queue_ids', JSON.stringify(data.holdQueueIds));
                  window.dispatchEvent(new CustomEvent('hold_queue_changed', { detail: data.holdQueueIds }));
                }
              }

              queryClient.invalidateQueries({ queryKey: ['queues'] });
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message', e);
          }
        };

        ws.onclose = () => {
          socketInstance = null;
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (socketInstance) {
        socketInstance.onclose = null;
        socketInstance.close();
        socketInstance = null;
      }
    };
  }, [queryClient]);
}


export function useGetQueues() {
  useQueueWebSocket();

  return useQuery({
    queryKey: ['queues'],
    queryFn: getQueues,
    staleTime: 0,
  });
}

export function useCreateQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    },
  });
}

