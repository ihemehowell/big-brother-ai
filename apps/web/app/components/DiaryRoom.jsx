'use client';

import { useState, useEffect } from 'react';

export default function DiaryRoom() {
  const [entries, setEntries] = useState([
    {
      id: 1,
      time: 'Day 7 - 8:45 PM',
      speaker: 'Alex',
      content: 'Just had an intense conversation in the kitchen. Trust is becoming a rare commodity in this house.',
      mood: 'tense',
      hour: 20
    },
    {
      id: 2,
      time: 'Day 7 - 7:30 PM',
      speaker: 'Sam',
      content: 'Won the pool challenge today! Feeling good about my alliances right now.',
      mood: 'hopeful',
      hour: 19
    },
    {
      id: 3,
      time: 'Day 6 - 9:00 PM',
      speaker: 'Taylor',
      content: 'First diary room session felt strange but cathartic. Needed to get things off my chest.',
      mood: 'reflective',
      hour: 21
    },
    {
      id: 4,
      time: 'Day 5 - 4:20 PM',
      speaker: 'Casey',
      content: 'Won the immunity challenge! Feeling relieved but also knowing I\'m now a bigger target.',
      mood: 'triumphant',
      hour: 16
    },
    {
      id: 5,
      time: 'Day 4 - 8:15 PM',
      speaker: 'Morgan',
      content: 'Had a laugh with Jamie today - really needed that break from the tension.',
      mood: 'grateful',
      hour: 16
    }
  ]);
  const [showMyRoom, setShowMyRoom] = useState(false);
  const [newEntry, setNewEntry] = useState('');

  // Add mock new entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance to add new entry
        const speakers = ['Alex', 'Sam', 'Jamie', 'Taylor', 'Casey', 'Morgan'];
        const moods = ['happy', 'sad', 'angry', 'anxious', 'excited', 'tired', 'hopeful', 'confused'];
        const activities = [
          'Just had a deep conversation about game strategy.',
          'Feeling really overwhelmed by the social dynamics.',
          'Miss my family terribly but trying to stay strong.',
          'Had a laugh with someone today - much needed break.',
          'Noticed something suspicious during the last challenge.',
          'Feeling paranoid but trying to stay calm and observant.',
          'Had a revelation about my approach to the game.',
          'Getting better at reading people\'s intentions.',
          'The lack of privacy is starting to get to me.',
          'Found an unexpected ally today.'
        ];

        const newEntry = {
          id: Date.now(),
          time: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
          speaker: speakers[Math.floor(Math.random() * speakers.length)],
          content: activities[Math.floor(Math.random() * activities.length)],
          mood: moods[Math.floor(Math.random() * moods.length)],
          hour: Math.floor(Math.random() * 24)
        };

        setEntries(prev => [newEntry, ...prev.slice(0, 4)]); // Keep latest 5
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleAddEntry = (e) => {
    e.preventDefault();
    if (newEntry.trim()) {
      const entry = {
        id: Date.now(),
        time: `Day 7 - ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
        speaker: 'You',
        content: newEntry,
        mood: 'reflective',
        hour: new Date().getHours()
      };
      setEntries(prev => [entry, ...prev.slice(0, 4)]);
      setNewEntry('');
    }
  };

  const getMoodColor = (mood) => {
    const moodColors = {
      happy: '#10b981',
      sad: '#6366f1',
      angry: '#ef4444',
      anxious: '#f59e0b',
      excited: '#f97316',
      tired: '#6b7280',
      hopeful: '#8b5cf6',
      confused: '#ec4899',
      triumphant: '#10b981',
      grateful: '#06b6d4',
      tense: '#ef4444',
      reflective: '#6366f1'
    };
    return moodColors[mood] || '#6b7280';
  };

  const getMoodIcon = (mood) => {
    const moodIcons = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      anxious: '😰',
      excited: '😄',
      tired: '😴',
      hopeful: '🤞',
      confused: '😕',
      triumphant: '🏆',
      grateful: '🙏',
      tense: '😬',
      reflective: '🤔'
    };
    return moodIcons[mood] || '💭';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-white text-lg">Diary Room</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMyRoom(!showMyRoom)}
            className={`px-3 py-1 text-sm rounded hover:bg-gray-700/30 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800/50 transition-colors
                       ${showMyRoom ? 'bg-gray-800/50 hover:bg-gray-700/60' : 'hover:bg-gray-700/20'}`}
          >
            {showMyRoom ? 'Hide My Room' : 'My Room'}
          </button>
          <button
            onClick={() => {
              // In real app, this would open a modal or new page
              alert('Full diary would open here');
            }}
            className="text-xs text-gray-400 hover:text-white hover:underline focus-underline"
          >
            View All
          </button>
        </div>
      </div>

      {/* Diary Feed */}
      <div className="max-h-[22vh] overflow-y-auto space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex-start bg-gray-900/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 hover:bg-gray-900/70 transition-all duration-200"
          >
            <div className="flex items-start space-x-3">
              {/* Mood Indicator */}
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getMoodColor(entry.mood) }}></div>
                <span className="text-xs ml-1">{getMoodIcon(entry.mood)}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">{entry.time}</p>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-white truncate max-w-[80%]">{entry.speaker}:</span>
                  <span className="text-xs bg-gray-800/50 px-2 py-0.5 rounded-full">{getMoodIcon(entry.mood)}</span>
                </div>
                <p className="text-sm text-white/90 line-clamp-3 leading-relaxed break-words">
                  {entry.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* My Diary Room (toggleable) */}
      {showMyRoom && (
        <div className="mt-4">
          <div className="mb-2 flex justify-between items-center">
            <p className="font-medium text-white">My Private Diary</p>
            <span className="text-xs text-gray-400">(Not visible to other houseguests)</span>
          </div>
          <textarea
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddEntry(e))}
            className="w-full min-h-[60px] bg-gray-900/60 backdrop-blur-sm text-white placeholder-gray-400 px-3 py-2 rounded border border-gray-700/50 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 focus:ring-opacity-50 resize-none"
            placeholder="What's on your mind? (Press Enter to submit)..."
          ></textarea>
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAddEntry}
              disabled={!newEntry.trim()}
              className={`px-4 py-1.5 text-sm rounded disabled:opacity-50
                       ${!newEntry.trim() ? 'bg-gray-600/50 hover:bg-gray-600/60' : 'bg-indigo-600 hover:bg-indigo-700'}
                       focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-900
                       transition-colors`}
            >
              Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}