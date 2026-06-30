import { getPositionForRoom, clearRoomSlot, resetSlots } from '@/app/components/roomLayout';
import { useEffect, useState } from 'react';

interface ContestantState {
  id: string;
  name: string;
  room: string;
  position: { x: number; y: number; z: number };
  animation: 'idle' | 'walking' | 'talking' | 'flirting';
  dialogue?: string;
}

interface WorldStateMessage {
  type: string;
  payload: any;
}

const DEFAULT_ROOM = 'living_room';

export const useWebSocket = () => {
  const [contestants, setContestants] = useState<Record<string, ContestantState>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Array<{ type: string; payload: any; timestamp: number }>>([]);

  useEffect(() => {
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
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
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

    return () => {
      ws.close();
    };
  }, []);

  const handleWebSocketMessage = (message: WorldStateMessage) => {
    switch (message.type) {
      case 'contestants_update':
        if (Array.isArray(message.payload)) {
          resetSlots();
          const contestantsObj: Record<string, ContestantState> = {};
          message.payload.forEach((contestant: any) => {
            const room = contestant.room || DEFAULT_ROOM;
            contestantsObj[contestant.id] = {
              id: contestant.id,
              name: contestant.name || `Contestant ${contestant.id}`,
              room,
              position: getPositionForRoom(room, contestant.id),
              animation: contestant.animation || 'idle',
              dialogue: contestant.dialogue
            };
          });
          setContestants(contestantsObj);
        }
        break;

      case 'agent_move':
        if (message.payload && message.payload.contestantId) {
          const { contestantId, room } = message.payload;
          const resolvedRoom = room || DEFAULT_ROOM;
          setContestants(prev => {
            const existing = prev[contestantId];
            if (existing && existing.room && existing.room !== resolvedRoom) {
              clearRoomSlot(existing.room, contestantId);
            }
            return {
              ...prev,
              [contestantId]: {
                ...(existing || {
                  id: contestantId,
                  name: `Contestant ${contestantId}`,
                  room: resolvedRoom,
                  position: { x: 0, y: 0, z: 0 },
                  animation: 'idle'
                }),
                room: resolvedRoom,
                position: getPositionForRoom(resolvedRoom, contestantId)
              }
            };
          });
        }
        break;

      case 'agent_animation':
        if (message.payload && message.payload.contestantId) {
          const { contestantId } = message.payload;
          setContestants(prev => {
            const existing = prev[contestantId];
            const room = existing?.room || DEFAULT_ROOM;
            return {
              ...prev,
              [contestantId]: {
                ...(existing || {
                  id: contestantId,
                  name: `Contestant ${contestantId}`,
                  room,
                  position: getPositionForRoom(room, contestantId),
                  animation: 'idle'
                }),
                animation: message.payload.animation
              }
            };
          });
        }
        break;

      case 'dialogue':
        if (message.payload && message.payload.contestantId) {
          const { contestantId } = message.payload;
          setContestants(prev => {
            const existing = prev[contestantId];
            const room = existing?.room || DEFAULT_ROOM;
            return {
              ...prev,
              [contestantId]: {
                ...(existing || {
                  id: contestantId,
                  name: `Contestant ${contestantId}`,
                  room,
                  position: getPositionForRoom(room, contestantId),
                  animation: 'idle'
                }),
                dialogue: message.payload.content
              }
            };
          });
        }
        break;

      case 'scene_cut':
        // The director graph never sends agent_move — scene_cut is the
        // event that actually carries where a scene is happening. Move
        // every participant into that room so the house visually reflects
        // active scenes.
        if (message.payload && Array.isArray(message.payload.participantIds)) {
          const { location, participantIds } = message.payload;
          const resolvedRoom = location || DEFAULT_ROOM;
          setContestants(prev => {
            const next = { ...prev };
            for (const contestantId of participantIds) {
              const existing = next[contestantId];
              if (existing && existing.room && existing.room !== resolvedRoom) {
                clearRoomSlot(existing.room, contestantId);
              }
              next[contestantId] = {
                ...(existing || {
                  id: contestantId,
                  name: `Contestant ${contestantId}`,
                  room: resolvedRoom,
                  position: { x: 0, y: 0, z: 0 },
                  animation: 'idle'
                }),
                room: resolvedRoom,
                position: getPositionForRoom(resolvedRoom, contestantId),
                animation: 'walking'
              };
            }
            return next;
          });
        }
        break;

      case 'diary_room':
        // A diary pull is also a room change (into diary_room) that was
        // previously only logged, never reflected visually.
        if (message.payload && message.payload.contestantId) {
          const { contestantId } = message.payload;
          setContestants(prev => {
            const existing = prev[contestantId];
            if (existing && existing.room && existing.room !== 'diary_room') {
              clearRoomSlot(existing.room, contestantId);
            }
            return {
              ...prev,
              [contestantId]: {
                ...(existing || {
                  id: contestantId,
                  name: `Contestant ${contestantId}`,
                  room: 'diary_room',
                  position: { x: 0, y: 0, z: 0 },
                  animation: 'idle'
                }),
                room: 'diary_room',
                position: getPositionForRoom('diary_room', contestantId),
                dialogue: message.payload.content
              }
            };
          });
        }
        break;

      default:
        console.log('Unhandled message type:', message.type);
    }
  };

  return { contestants, isConnected, messages };
};