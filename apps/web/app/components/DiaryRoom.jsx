'use client';

import { useMemo, useState } from 'react';
import { useWebSocket } from '@/lib/useWebSocket';

const MOOD_FALLBACK = { color: '#6b7280', icon: '💭' };

export default function DiaryRoom() {
  const { contestants, messages } = useWebSocket();
  const [showMyRoom, setShowMyRoom] = useState(false);
  const [newEntry, setNewEntry] = useState('');

  // Real diary entries, newest first, from the director graph's broadcasts —
  // no fake seed data, no fake interval. If nothing has been pulled into the
  // diary room yet, the feed is just empty until it happens.
  const entries = useMemo(() => {
    return messages
      .filter(m => m.type === 'diary_room')
      .slice(-20)
      .reverse()
      .map(m => ({
        id: `${m.payload.sceneId}-${m.timestamp}`,
        time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        speaker: contestants[m.payload.contestantId]?.name || m.payload.contestantId,
        content: m.payload.content,
      }));
  }, [messages, contestants]);

  const handleAddEntry = (e) => {
    e.preventDefault();
    // No backend endpoint for a viewer-submitted diary entry yet — this
    // stays local-only until there's somewhere real to send it.
    setNewEntry('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-white text-lg">Diary Room</h3>
        <button
          onClick={() => setShowMyRoom(!showMyRoom)}
          className={`px-3 py-1 text-sm rounded hover:bg-gray-700/30 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800/50 transition-colors
                     ${showMyRoom ? 'bg-gray-800/50 hover:bg-gray-700/60' : 'hover:bg-gray-700/20'}`}
        >
          {showMyRoom ? 'Hide My Room' : 'My Room'}
        </button>
      </div>

      <div className="max-h-[22vh] overflow-y-auto space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No diary room sessions yet.</p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 hover:bg-gray-900/70 transition-all duration-200"
            >
              <p className="text-xs text-gray-400 mb-1">{entry.time}</p>
              <p className="font-medium text-white mb-1">{entry.speaker}</p>
              <p className="text-sm text-white/90 line-clamp-3 leading-relaxed break-words">
                {entry.content}
              </p>
            </div>
          ))
        )}
      </div>

      {showMyRoom && (
        <div className="mt-4">
          <div className="mb-2 flex justify-between items-center">
            <p className="font-medium text-white">My Private Diary</p>
            <span className="text-xs text-gray-400">(Not visible to other houseguests)</span>
          </div>
          <textarea
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            className="w-full min-h-[60px] bg-gray-900/60 backdrop-blur-sm text-white placeholder-gray-400 px-3 py-2 rounded border border-gray-700/50 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 focus:ring-opacity-50 resize-none"
            placeholder="What's on your mind?..."
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAddEntry}
              disabled
              title="Not wired to a backend yet"
              className="px-4 py-1.5 text-sm rounded bg-gray-600/50 opacity-50"
            >
              Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}