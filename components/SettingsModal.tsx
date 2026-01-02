import React, { useState, useEffect } from 'react';
import { AppSettings, ModelTier } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
  currentSettings: AppSettings;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentSettings,
}) => {
  const [tier, setTier] = useState<ModelTier>(currentSettings.modelTier);
  
  // Sync state when opening
  useEffect(() => {
    if (isOpen) {
      setTier(currentSettings.modelTier);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ modelTier: tier });
    onClose();
  };

  const handleChangeKey = () => {
      // Close modal to allow main app to handle key change or open the key picker directly
      onClose();
      // We rely on the App component to provide a way to change key if needed, or user reloads
      // Alternatively, we could call window.aistudio.openSelectKey() here if we want.
      if (window.aistudio) {
          window.aistudio.openSelectKey();
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
        
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

        <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

        <div className="space-y-6">
          
          {/* Model Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Select Model</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTier('free')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  tier === 'free' 
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' 
                  : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <div className="font-semibold text-sm">Flash</div>
                <div className="text-xs text-zinc-400 mt-1">Fast, efficient</div>
              </button>
              
              <button
                onClick={() => setTier('pro')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  tier === 'pro' 
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' 
                  : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <div className="font-semibold text-sm">Pro</div>
                <div className="text-xs text-zinc-400 mt-1">High Quality</div>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
             <button
                onClick={handleChangeKey}
                className="text-sm text-zinc-400 hover:text-white flex items-center gap-2"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Change API Key
             </button>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-white text-black hover:bg-zinc-200 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95"
          >
            Save Settings
          </button>

        </div>
      </div>
    </div>
  );
};
