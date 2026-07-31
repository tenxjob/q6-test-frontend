import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface QueueItem {
  id: string;
  name: string;
  price: number;
  code: string;
  channel?: 'facebook' | 'line' | string | null;
  customerName?: string | null;
  url?: string | null;
  isExpress?: boolean | null;
  isHold?: boolean | null;
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${API_BASE_URL}/queues`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Failed to fetch queues: ${response.statusText}`);
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

export async function createQueue(data: CreateQueueInput): Promise<QueueItem> {
  const response = await fetch(`${API_BASE_URL}/queues`, {
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
    throw new Error(`Failed to create queue: ${errorMsg}`);
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
      if (socketInstance && (socketInstance.readyState === WebSocket.OPEN || socketInstance.readyState === WebSocket.CONNECTING)) {
        return;
      }

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
              // Invalidate queries for all real database mutation events
              queryClient.invalidateQueries({ queryKey: ['queues'] });
              queryClient.invalidateQueries({ queryKey: ['list-queues', 'pending'] });
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message', e);
          }
        };

        ws.onclose = () => {
          socketInstance = null;
          reconnectTimeout = setTimeout(connect, 5000);
        };

        ws.onerror = () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
    };
  }, [queryClient]);
}


export function useGetQueues() {
  useQueueWebSocket();

  return useQuery({
    queryKey: ['queues'],
    queryFn: getQueues,
    staleTime: 1000,
    refetchInterval: 3000,
    retry: 2,
    retryDelay: 1000,
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

