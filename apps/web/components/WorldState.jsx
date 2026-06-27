"use client";

import { useEffect } from 'react';
import * as THREE from 'three';
import { useWebSocket } from '@/lib/useWebSocket';

const roomPositions = {
  kitchen: { x: -3, y: 0.5, z: 3 },
  living_room: { x: 0, y: 0.5, z: 3 },
  bedroom: { x: 3, y: 0.5, z: 3 },
  backyard: { x: 0, y: 0.5, z: -5 },
  diary_room: { x: 0, y: 2, z: 0 }
};

const WorldState = () => {
  const { contestants, isConnected } = useWebSocket();

  useEffect(() => {
    console.log('Contestants data:', contestants);
    console.log('Connection status:', isConnected);
  }, [contestants, isConnected]);

  return (
    <div>
      <div style={{ 
        position: 'fixed', 
        top: 20, 
        left: 20, 
        background: 'rgba(0,0,0,0.7)', 
        color: 'white', 
        padding: '10px', 
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        <div>WebSocket Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
        <div>Contestants: {Object.keys(contestants).length}</div>
        {Object.values(contestants).map((contestant, index) => (
          <div key={contestant.id}>
            {contestant.name}: {contestant.dialogue || '({contestant.animation})'}
          </div>
        ))}
      </div>
      
      {/* 3D visualization container */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        pointerEvents: 'none'
      }}>
        {/* This is where we would render 3D avatars using React Three Fiber */}
        <div id="avatars-container" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '400px',
          height: '300px',
          marginTop: '-150px',
          marginLeft: '-200px',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid #333',
          borderRadius: '5px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontFamily: 'monospace',
          pointerEvents: 'all'
        }}>
          Avatar Positions Will Appear Here
        </div>
      </div>
    </div>
  );
};

export default WorldState;
