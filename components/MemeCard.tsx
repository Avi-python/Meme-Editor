import React from 'react';
import type { Meme } from '../types';

interface MemeCardProps {
  meme: Meme;
}

const MemeCard: React.FC<MemeCardProps> = ({ meme }) => {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/50 flex flex-col">
      <div className="w-full h-64 bg-gray-700">
        <img 
          src={meme.url} 
          alt={meme.name} 
          className="w-full h-full object-cover" 
          loading="lazy"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h2 className="text-lg font-semibold text-gray-200 truncate" title={meme.name}>
          {meme.name}
        </h2>
        {meme.tags && meme.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {meme.tags.map((tag, index) => (
              <span key={index} className="bg-gray-700 text-cyan-300 text-xs font-medium px-2.5 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemeCard;
