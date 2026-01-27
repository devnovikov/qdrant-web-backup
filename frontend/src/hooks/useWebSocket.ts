import { useEffect, useRef, useCallback, useState } from 'react';
import type { WsMessage, JobProgressPayload, JobStatusPayload } from '@/types';

interface UseWebSocketOptions {
  onJobProgress?: (payload: JobProgressPayload) => void;
  onJobStatus?: (payload: JobStatusPayload) => void;
  onClusterStatus?: (payload: unknown) => void;
  onError?: (error: Event | Error) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  send: (message: WsMessage) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    onJobProgress,
    onJobStatus,
    onClusterStatus,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const connectRef = useRef<(() => void) | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectCountRef.current = 0;
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current += 1;
          setTimeout(() => connectRef.current?.(), reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const message: WsMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'job_progress':
              onJobProgress?.(message.payload as JobProgressPayload);
              break;
            case 'job_status':
              onJobStatus?.(message.payload as JobStatusPayload);
              break;
            case 'cluster_status':
              onClusterStatus?.(message.payload);
              break;
            case 'error':
              onError?.(new Error(String(message.payload)));
              break;
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      wsRef.current = ws;
    } catch (e) {
      onError?.(e as Error);
    }
  }, [
    onJobProgress,
    onJobStatus,
    onClusterStatus,
    onError,
    reconnectAttempts,
    reconnectInterval,
  ]);

  // Keep ref updated with latest connect function
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectCountRef.current = 0;
    connect();
  }, [connect, disconnect]);

  const send = useCallback((message: WsMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    isConnected,
    send,
    disconnect,
    reconnect,
  };
}
