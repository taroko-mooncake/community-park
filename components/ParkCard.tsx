
import React from 'react';
import { MapPin, Users, TreeDeciduous, ExternalLink } from 'lucide-react';
import { Park } from '../types';

interface ParkCardProps {
  park: Park;
  onClick: () => void;
}

export const ParkCard: React.FC<ParkCardProps> = ({ park, onClick }) => {
  const activeTasks = park.tasks.filter(t => t.status !== 'COMPLETED').length;
  
  const handleMapClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (park.googleMapsUrl) {
      window.open(park.googleMapsUrl, '_blank');
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 cursor-pointer overflow-hidden border border-stone-200 flex flex-col h-full"
    >
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-stone-800 group-hover:text-emerald-700 transition-colors">
            {park.name}
            </h3>
            {activeTasks > 0 && (
                <div className="bg-emerald-50 px-2 py-1 rounded text-xs font-semibold text-emerald-700 flex items-center gap-1 shrink-0 ml-2">
                    <TreeDeciduous size={12} />
                    {activeTasks} Tasks
                </div>
            )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-stone-500 text-sm">
            <MapPin size={14} className="mr-1" />
            <span className="truncate max-w-[200px]">{park.location}</span>
          </div>
          {park.googleMapsUrl && (
            <button 
              onClick={handleMapClick}
              className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium z-10"
            >
              <ExternalLink size={12} /> Map
            </button>
          )}
        </div>
        
        <p className="text-stone-600 text-sm line-clamp-3 mb-6 flex-grow">
          {park.description}
        </p>
        
        <div className="pt-4 border-t border-stone-100 flex justify-between items-center text-xs text-stone-500 mt-auto">
           <div className="flex items-center gap-1">
             <Users size={14} />
             <span>{park.tasks.reduce((acc, t) => acc + t.volunteers.length, 0)} volunteers active</span>
           </div>
           <span className="text-emerald-600 font-medium group-hover:underline">View Details →</span>
        </div>
      </div>
    </div>
  );
};
