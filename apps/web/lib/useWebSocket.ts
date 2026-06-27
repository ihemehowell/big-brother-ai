import { useEffect, useState, useCallback } from 'react';

interface ContestantState {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  animation: 'idle' | 'walking' | 'talking' | 'flirting';
  dialogue?: string;
}

interface WorldStateMessage {
  type: string;
  payload: any;
}

export const useWebSocket = () => {
  const [contestants, setContestants] = useState<Record<string, ContestantState>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Array<{ type: string; payload: any; timestamp: number }>>([]);

  useEffect(() => {
    // Use environment variable for WebSocket URL, fallback to localhost
    // In Next.js, we need to use process.env for client-side env vars with NEXT_PUBLIC_ prefix
    const wsUrl = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WS_URL) ||
                  `ws://${window.location.hostname}:4000/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WorldStateMessage;
        setMessages(prev => [...prev, { ...data, timestamp: Date.now() }]);

        // Handle different message types
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Try to extract more useful error information
      if (error instanceof ErrorEvent) {
        console.error('WebSocket error details:', error.message);
      } else if (typeof error === 'object' && error !== null) {
        console.error('WebSocket error object:', error);
      }
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, []);

  const handleWebSocketMessage = (message: WorldStateMessage) => {
    switch (message.type) {
      case 'contestants_update':
        // Update all contestants state
        if (Array.isArray(message.payload)) {
          const contestantsObj: Record<string, ContestantState> = {};
          message.payload.forEach((contestant: any) => {
            contestantsObj[contestant.id] = {
              id: contestant.id,
              name: contestant.name || `Contestant ${contestant.id}`,
              position: {
                x: contestant.position?.x || 0,
                y: contestant.position?.y || 0,
                z: contestant.position?.z || 0
              },
              animation: contestant.animation || 'idle',
              dialogue: contestant.dialogue
            };
          });
          setContestants(contestantsObj);
        }
        break;

      case 'agent_move':
        // Update specific contestant position
        if (message.payload && message.payload.contestantId) {
          setContestants(prev => ({
            ...prev,
            [message.payload.contestantId]: {
              ...(prev[message.payload.contestantId] || {
                id: message.payload.contestantId,
                name: `Contestant ${message.payload.contestantId}`,
                position: { x: 0, y: 0, z: 0 },
                animation: 'idle'
              }),
              position: {
                x: message.payload.x || 0,
                y: message.payload.y || 0,
                z: message.payload.z || 0
              }
            }
          }));
        }
        break;

      case 'agent_animation':
        // Update specific contestant animation
        if (message.payload && message.payload.contestantId) {
          setContestants(prev => ({
            ...prev,
            [message.payload.contestantId]: {
              ...(prev[message.payload.contestantId] || {
                id: message.payload.contestantId,
                name: `Contestant ${message.payload.contestantId}`,
                position: { x: 0, y: 0, z: 0 },
                animation: 'idle'
              }),
              animation: message.payload.animation
            }
          }));
        }
        break;

      case 'dialogue':
        // Update specific contestant dialogue
        if (message.payload && message.payload.contestantId) {
          setContestants(prev => ({
            ...prev,
            [message.payload.contestantId]: {
              ...(prev[message.payload.contestantId] || {
                id: message.payload.contestantId,
                name: `Contestant ${message.payload.contestantId}`,
                position: { x: 0, y: 0, z: 0 },
                animation: 'idle'
              }),
              dialogue: message.payload.content
            }
          }));
        }
        break;

      case 'scene_cut':
        // This could be used to highlight active speakers or change camera focus
        console.log('Scene cut:', message.payload);
        break;

      case 'diary_room':
        // This could be used to show diary room entries
        console.log('Diary room entry:', message.payload);
        break;

      default:
        console.log('Unhandled message type:', message.type);
    }
  };

  return { contestants, isConnected, messages };
};
