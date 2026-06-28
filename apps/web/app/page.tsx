import House from './components/House';
import DiaryRoom from './components/DiaryRoom';
import RelationshipGraph from './components/RelationshipGraph';
import VotingPanel from './components/VotingPanel';
import EpisodeGuide from './components/EpisodeGuide';
import HouseMap from './components/HouseMap';

export default function Home() {
  return (
    <div className="flex h-screen w-screen relative overflow-hidden">
      {/* 3D House View */}
      <div className="flex-1 relative">
        <div className="w-full h-full">
          <House />
        </div>
      </div>

      {/* UI Overlays */}
      {/* pointer-events-none here lets clicks/drags pass through to the 3D scene
          wherever there isn't a panel. Each panel below re-enables pointer events
          with pointer-events-auto so it stays interactive. */}
      <div className="absolute inset-0 flex flex-col p-4 pointer-events-none">
        {/* Top Row */}
        <div className="flex flex-1 items-start justify-between mb-2">
          {/* Diary Room - Top Left */}
          <div className="w-[300px] max-h-[25vh] overflow-y-auto bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white text-sm pointer-events-auto z-20">
            <div className="font-bold mb-2">Diary Room</div>
            <DiaryRoom />
          </div>

          {/* Relationship Graph - Top Right */}
          <div className="w-[400px] max-h-[30vh] overflow-y-auto bg-black/70 backdrop-blur-sm rounded-lg p-2 pointer-events-auto z-20">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-white">Relationships</span>
              <button className="text-sm text-blue-300 hover:text-white">Expand</button>
            </div>
            <RelationshipGraph />
          </div>
        </div>

        {/* Middle Row - House Map */}
        <div className="flex justify-start mb-2">
          <div className="w-[300px] max-h-[30vh] overflow-y-auto bg-black/70 backdrop-blur-sm rounded-lg p-3 pointer-events-auto z-20">
            <div className="font-bold mb-2 text-white text-center">House Map</div>
            <HouseMap />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-1 items-end justify-between mt-2">
          {/* Voting Panel - Bottom Left */}
          <div className="w-[300px] max-h-[25vh] overflow-y-auto bg-black/70 backdrop-blur-sm rounded-lg p-3 pointer-events-auto z-20">
            <div className="font-bold mb-2 text-white">Eviction Vote</div>
            <VotingPanel />
          </div>

          {/* Episode Guide - Bottom Right */}
          <div className="w-[400px] max-h-[25vh] overflow-y-auto bg-black/70 backdrop-blur-sm rounded-lg p-3 pointer-events-auto z-20">
            <div className="font-bold mb-2 text-white">Episode Guide</div>
            <EpisodeGuide />
          </div>
        </div>
      </div>
    </div>
  );
}