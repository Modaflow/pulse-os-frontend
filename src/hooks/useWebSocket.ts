"use client";

import { useEffect, useRef, useState } from "react";

interface WebSocketMessage {
  type: string;
  timestamp: string;
  data: any;
}

interface UseWebSocketReturn {
  connected: boolean;
  messages: WebSocketMessage[];
  error: string | null;
  send: (data: string) => void;
}

export function useWebSocket(url: string): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    let mounted = true;

    const connect = () => {
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (mounted) {
            setConnected(true);
            setError(null);
            reconnectAttempts.current = 0;
          }
        };

        ws.onmessage = (event) => {
          if (mounted) {
            try {
              const message: WebSocketMessage = JSON.parse(event.data);
              setMessages((prev) => [...prev, message].slice(-100)); // Keep last 100 messages
            } catch (err) {
              console.error("Failed to parse WebSocket message:", err);
            }
          }
        };

        ws.onerror = (err) => {
          if (mounted) {
            setError("WebSocket error occurred");
            console.error("WebSocket error:", err);
          }
        };

        ws.onclose = (event) => {
          if (mounted) {
            setConnected(false);
            // Provide more detailed error information
            if (event.code !== 1000) { // 1000 is normal closure
              const errorMsg = event.reason || `Connection closed (code: ${event.code})`;
              setError(errorMsg);
              console.error("WebSocket closed:", { code: event.code, reason: event.reason, wasClean: event.wasClean });
            }
            // Attempt to reconnect
            if (reconnectAttempts.current < maxReconnectAttempts) {
              reconnectAttempts.current += 1;
              reconnectTimeoutRef.current = setTimeout(() => {
                connect();
              }, 1000 * reconnectAttempts.current); // Exponential backoff
            } else {
              const finalError = event.reason || `Failed to reconnect after ${maxReconnectAttempts} attempts`;
              setError(finalError);
            }
          }
        };
      } catch (err) {
        if (mounted) {
          setError("Failed to create WebSocket connection");
          console.error("WebSocket connection error:", err);
        }
      }
    };

    connect();

    return () => {
      mounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  const send = (data: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    } else {
      console.warn("WebSocket is not connected");
    }
  };

  return { connected, messages, error, send };
}

