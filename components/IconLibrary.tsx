import React from 'react';
import { IconData } from '../types';

interface IconLibraryProps {
  icons: IconData[];
  onDelete: (id: string) => void;
  onSelect: (icon: IconData) => void;
}

export const IconLibrary: React.FC<IconLibraryProps> = ({ icons, onDelete, onSelect }) => {
  if (icons.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-lg font-medium">Your library is empty</p>
        <p className="text-sm">Generate and save icons to build your collection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
        </svg>
        Your Library
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {icons.map((icon) => (
          <div key={icon.id} className="group relative bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 shadow-sm hover:shadow-indigo-500/10">
            {/* Image Thumbnail */}
            <div 
              className="aspect-square cursor-pointer overflow-hidden bg-zinc-950"
              onClick={() => onSelect(icon)}
            >
              <img
                src={`data:image/png;base64,${icon.base64Data}`}
                alt={icon.originalPrompt}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            
            {/* Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-between items-end">
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 truncate" title={icon.originalPrompt}>
                        {icon.originalPrompt}
                    </p>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{icon.size}</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(icon.id);
                    }}
                    className="ml-2 text-zinc-400 hover:text-red-400 transition-colors"
                    title="Delete"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
