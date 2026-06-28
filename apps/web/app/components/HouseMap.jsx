'use client';

import { useState, useEffect } from 'react';

export default function HouseMap() {
  const [roomStatus, setRoomStatus] = useState({
    livingRoom: ['Alex', 'Sam'],
    kitchen: ['Jamie', 'Taylor'],
    bedroom: ['Casey', 'Morgan'],
    bathroom: [],
    diaryRoom: [],
    yard: []
  });

  // Simulate people moving around - matching logic from House.jsx
  useEffect(() => {
    // Update room assignments periodically (matching House.jsx timing)
    const interval = setInterval(() => {
      // 30% chance to shuffle rooms (matching House.jsx)
      if (Math.random() > 0.7) {
        const allPeople = ['Alex', 'Sam', 'Jamie', 'Taylor', 'Casey', 'Morgan'];
        const rooms = Object.keys(roomStatus);

        // Clear all rooms
        const newStatus = {};
        rooms.forEach(room => {
          newStatus[room] = [];
        });

        // Distribute people randomly (uniform distribution - matching House.jsx)
        allPeople.forEach(person => {
          const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
          newStatus[randomRoom].push(person);
        });

        setRoomStatus(newStatus);
      }
    }, 10000); // Update every 10 seconds (matching House.jsx)

    return () => clearInterval(interval);
  }, [roomStatus]);

  const roomLabels = {
    livingRoom: 'Living Room',
    kitchen: 'Kitchen',
    bedroom: 'Bedroom',
    bathroom: 'Bathroom',
    diaryRoom: 'Diary Room',
    yard: 'Yard'
  };

  const roomColors = {
    livingRoom: 'bg-blue-500/20 border-blue-500',
    kitchen: 'bg-orange-500/20 border-orange-500',
    bedroom: 'bg-purple-500/20 border-purple-500',
    bathroom: 'bg-teal-500/20 border-teal-500',
    diaryRoom: 'bg-pink-500/20 border-pink-500',
    yard: 'bg-green-500/20 border-green-500'
  };

  const roomIcons = {
    livingRoom: '📺',
    kitchen: '🍳',
    bedroom: '🛏️',
    bathroom: '🚿',
    diaryRoom: '📓',
    yard: '🌳'
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-white text-lg">House Map</h3>
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-green-400 rounded"></div>
          <span className="text-gray-300">Live Tracking</span>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(roomStatus).map(([room, people]) => (
          <div key={room} className="flex items-start space-x-3 p-3 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 hover:bg-gray-800/40 transition-all duration-200">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 flex items-center justify-center ${roomColors[room]} rounded-lg`}>
                <span className="text-xs">{roomIcons[room]}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white mb-1">{roomLabels[room]}</p>
              {people.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {people.map((person, index) => (
                    <span key={`${room}-${person}-${index}`} className="px-2 py-0.5 text-xs bg-gray-700/50 rounded-full">
                      {person}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Empty</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-400 text-center">
          Room assignments update periodically
        </p>
      </div>
    </div>
  );
}