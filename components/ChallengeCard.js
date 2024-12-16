'use client';

import { FaUsers, FaCheck } from 'react-icons/fa';

export default function ChallengeCard({ challenge, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className="bg-black/70 backdrop-blur-sm border border-red-500/30 rounded-lg p-6 hover:border-red-500/50 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-red-500 font-mono group-hover:glow-text transition-all">
          {challenge.title}
        </h3>
        <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm font-mono">
          {challenge.points} pts
        </span>
      </div>
      
      <div className="mb-4">
        <span className="text-red-400/70 font-mono text-sm">
          {challenge.category}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="flex items-center text-red-400/70 font-mono text-sm">
            <FaUsers className="mr-1" />
            {challenge.solves || 0}
          </span>
          <span className="text-red-400/70 font-mono text-sm">
            {challenge.difficulty}
          </span>
        </div>
        {challenge.solved && (
          <span className="text-green-500 font-mono text-sm flex items-center">
            <FaCheck className="mr-1" />
            Solved
          </span>
        )}
      </div>
    </div>
  );
}
