'use client';
import { useState } from 'react';

export default function VotingPanel() {
  const [vote, setVote] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Sample contestants - in reality this would come from backend/simulation
  const contestants = [
    { id: 'Alex', votes: 23, percentage: 46, color: '#3b82f6' },
    { id: 'Sam', votes: 15, percentage: 30, color: '#10b981' },
    { id: 'Jamie', votes: 12, percentage: 24, color: '#f59e0b' }
  ];

  const handleVote = (contestantId) => {
    setVote(contestantId);
    setShowResults(true);
  };

  return (
    <div className="space-y-4">
      {!showResults ? (
        <>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-white text-lg">Weekly Eviction Vote</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-300">Live Voting</span>
            </div>
          </div>
          <p className="text-sm text-gray-300 mb-4">Who should be evicted this week?</p>
          <div className="space-y-3">
            {contestants.map((contestant) => (
              <button
                key={contestant.id}
                onClick={() => handleVote(contestant.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg border border-gray-600/50 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-800/50 focus-visible:ring-2 focus-visible:ring-${contestant.color.replace('#', '')}/50 focus-visible:ring-offset-2 focus-relative transition-all duration-200
                  ${vote === contestant.id ?
                    `border-${contestant.color.replace('#', '')}/50 bg-${contestant.color.replace('#', '')}/20` : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <span className="font-medium text-white truncate">{contestant.id}</span>
                    <span className="text-sm text-gray-300">{contestant.votes} votes</span>
                  </div>
                  <div className="w-full bg-gray-800/50 rounded-full h-2 mt-1 overflow-hidden">
                    <div
                      className={`h-2 bg-${contestant.color.replace('#', '')}/70 transition-all duration-500`}
                      style={{ width: `${contestant.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400 ml-2">{contestant.percentage}%</span>
                </div>
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 flex items-center justify-center bg-${contestant.color.replace('#', '')}/20 rounded-full border border-${contestant.color.replace('#', '')}/30`}>
                    <span className="text-xs font-bold">{contestant.id.charAt(0)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-white text-lg">Vote Submitted!</h3>
            <button
              onClick={() => {
                setVote(null);
                setShowResults(false);
              }}
              className="text-sm text-gray-300 hover:text-white focus-underline transition-colors"
            >
              Change Vote
            </button>
          </div>
          <p className="text-sm text-gray-300 mb-4">Thanks for voting. Results will be revealed during the live eviction show.</p>
          <div className="space-y-4">
            {contestants.map((contestant) => (
              <div key={contestant.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-white">{contestant.id}</span>
                  <span className="text-gray-300">{contestant.votes} votes ({contestant.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 bg-${contestant.color.replace('#', '')}/70 transition-all duration-1000 ease-out`}
                    style={{ width: `${contestant.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}