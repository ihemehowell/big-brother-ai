'use client';
import { useState, useEffect } from 'react';

export default function EpisodeGuide() {
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [episodes, setEpisodes] = useState([
    { id: 1, title: "Strangers in the House", airDate: "Day 1", status: "completed", description: "First impressions and initial alliances form" },
    { id: 2, title: "First Alliances Form", airDate: "Day 3", status: "completed", description: "Early game strategies begin to emerge" },
    { id: 3, title: "The First Nomination", airDate: "Day 5", status: "featured", description: "Tensions rise as first nominations are made" },
    { id: 4, title: "Secrets and Lies", airDate: "Day 7", status: "upcoming", description: "Hidden alliances come to light" },
    { id: 5, title: "Blindside!", airDate: "Day 9", status: "upcoming", description: "A major blindside shakes up the house" },
    { id: 6, title: "Battle of the Blocks", airDate: "Day 11", status: "upcoming", description: "Physical challenge throws alliances into chaos" },
    { id: 7, title: "The Secret Alliance", airDate: "Day 13", status: "upcoming", description: "A secret pact is discovered by the wrong person" },
    { id: 8, title: "Double Eviction Shock", airDate: "Day 15", status: "upcoming", description: "Two houseguests face the jury in one night" }
  ]);

  const statusColors = {
    completed: { bg: 'bg-gray-800/50', border: 'border-gray-700/50', text: 'text-gray-300', badge: 'bg-gray-500' },
    featured: { bg: 'bg-blue-900/50 border-l-4 border-blue-500', text: 'text-white', badge: 'bg-yellow-400' },
    upcoming: { bg: 'bg-gray-900/30 border-gray-700/30', text: 'text-gray-400', badge: 'bg-blue-500' }
  };

  useEffect(() => {
    // Simulate episode progression
    const interval = setInterval(() => {
      setEpisodes(prev =>
        prev.map(ep =>
          ep.status === 'featured'
            ? { ...ep, status: 'completed', description: `${ep.description} (Now in the past)` }
            : ep.status === 'upcoming' && ep.id === 3
              ? { ...ep, status: 'featured' }
              : ep
        )
      );

      // Update current episode when current finishes
      const current = episodes.find(e => e.id === currentEpisode);
      if (current && current.status === 'completed' &&
          episodes.find(e => e.id === currentEpisode + 1)) {
        setCurrentEpisode(prev => prev + 1);
      }
    }, 15000); // New featured episode every 15 seconds

    return () => clearInterval(interval);
  }, [currentEpisode, episodes]);

  // Get status object
  const getStatus = (status) => statusColors[status] || statusColors.upcoming;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-white text-lg">Episode Guide</h3>
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex items-center space-x-1 bg-gray-800/50 px-2 py-0.5 rounded">
            <div className="w-2 h-2 bg-yellow-400 rounded"></div>
            <span>Featured</span>
          </div>
          <span className="text-gray-400">Ep {currentEpisode}/{episodes.length}</span>
        </div>
      </div>

      <div className="max-h-[22vh] overflow-y-auto space-y-3">
        {episodes.map((episode) => {
          const status = getStatus(episode.status);
          return (
            <div key={episode.id} className={`flex items-start space-x-3 p-4 ${status.bg} ${status.border} rounded-lg hover:${status.bg.replace('/50', '/70')} transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-${status.badge.replace('bg-', '')}/50 focus-visible:ring-offset-2`}>
              <div className="flex-shrink-0">
                <div className="w-8 h-8 flex items-center justify-center bg-gray-800/50 rounded-lg">
                  <span className="text-xs font-medium">{episode.id}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-white truncate max-w-[150px]">{episode.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${status.badge}`}>
                    {episode.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-300">{episode.airDate}</p>
                <p className="text-sm text-white/90 line-clamp-2">{episode.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-400 text-center">
          New episodes daily at 8PM EST • Live eviction show Sundays
        </p>
      </div>
    </div>
  );
}