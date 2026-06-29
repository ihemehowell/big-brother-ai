'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWebSocket } from '@/lib/useWebSocket';
import House from './House';
import Avatar from './Avatar';
import { getPositionForRoom } from './roomLayout';

// Cycle through day -> evening -> night to match House's lighting moods.
// (This was previously a fake simulation living inside House.jsx; it's a
// presentation-only concern, so it lives at this level, separate from the
// real contestant/game data coming over the socket.)
const TIME_CYCLE_MS = 180000; // 3 minutes

const WorldState = () => {
  const { contestants, isConnected } = useWebSocket();
  const [timeOfDay, setTimeOfDay] = useState('day');
  const [speakingId, setSpeakingId] = useState(null);

  useEffect(() => {
    const times = ['day', 'evening', 'night'];
    const interval = setInterval(() => {
      setTimeOfDay(prev => times[(times.indexOf(prev) + 1) % times.length]);
    }, TIME_CYCLE_MS);
    return () => clearInterval(interval);
  }, []);

  // Track who's currently talking so we can show one speech bubble at a
  // time per dialogue event, rather than relying on contestant.animation
  // alone (a contestant object might not always set it).
  useEffect(() => {
    const talker = Object.values(contestants).find(c => c.dialogue);
    if (talker) {
      setSpeakingId(talker.id);
      const timeout = setTimeout(() => setSpeakingId(null), 4000);
      return () => clearTimeout(timeout);
    }
  }, [contestants]);

  // Resolve each contestant's 3D position from their room assignment.
  // This is the bridge between the WebSocket's room-key data model and
  // the actual coordinates House.jsx renders geometry at.
  const placedContestants = useMemo(() => {
    return Object.values(contestants).map(contestant => {
      const room = contestant.room || contestant.location || 'living_room';
      const pos = getPositionForRoom(room, contestant.id);
      return {
        ...contestant,
        position: pos,
      };
    });
  }, [contestants]);

  // Group occupants by room so House can react to occupancy
  // (currently used for the diary room glow).
  const occupants = useMemo(() => {
    const grouped = {};
    Object.values(contestants).forEach(c => {
      const room = c.room || c.location || 'living_room';
      if (!grouped[room]) grouped[room] = [];
      grouped[room].push(c.id);
    });
    return grouped;
  }, [contestants]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          background: 'rgba(20,16,12,0.72)',
          color: '#f2ede3',
          padding: '10px 14px',
          borderRadius: 8,
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.5,
          pointerEvents: 'none',
        }}
      >
        <div>{isConnected ? '● connected' : '○ disconnected'} · {timeOfDay}</div>
        <div>{Object.keys(contestants).length} contestants</div>
      </div>

      <House timeOfDay={timeOfDay} occupants={occupants}>
        {placedContestants.map(contestant => (
          <Avatar
            key={contestant.id}
            contestant={contestant}
            isSpeaking={speakingId === contestant.id}
          />
        ))}
      </House>
    </div>
  );
};

export default WorldState;