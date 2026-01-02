import React, { useState, useEffect } from 'react';
import { enhancePrompt, generateIconImage } from './services/geminiService';
import { AppStatus, IconData, PromptEnhancementResponse, AppSettings } from './types';
import { IconLibrary } from './components/IconLibrary';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Initial load from localStorage
    const saved = localStorage.getItem('app_settings');
    // Default to free if parsing fails
    const parsed = saved ? JSON.parse(saved) : {};
    return { modelTier: parsed.modelTier || 'free' };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [currentIcon, setCurrentIcon] = useState<IconData | null>(null);
  const [enhancementData, setEnhancementData] = useState<PromptEnhancementResponse | null>(null);
  const [library, setLibrary] = useState<IconData[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Persist settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
  };

  // Load library from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('icon_library');
    if (saved) {
      try {
        setLibrary(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse library", e);
      }
    }
  }, []);

  // Save library to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('icon_library', JSON.stringify(library));
  }, [library]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setStatus(AppStatus.ENHANCING_PROMPT);
    setErrorMsg(null);
    setEnhancementData(null);
    setCurrentIcon(null);

    try {
      // Step 1: Enhance Prompt
      const enhancement = await enhancePrompt(prompt);
      setEnhancementData(enhancement);
      
      setStatus(AppStatus.GENERATING_IMAGE);

      // Step 2: Generate Image
      const base64Data = await generateIconImage(
          enhancement.refinedPrompt, 
          enhancement.suggestedSize, 
          settings.modelTier
      );

      const newIcon: IconData = {
        id: crypto.randomUUID(),
        prompt: enhancement.refinedPrompt,
        originalPrompt: prompt,
        base64Data: base64Data,
        createdAt: Date.now(),
        size: settings.modelTier === 'pro' ? enhancement.suggestedSize : '1K',
      };

      setCurrentIcon(newIcon);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      setStatus(AppStatus.ERROR);
      const msg = err.message || "Something went wrong during generation.";
      setErrorMsg(msg);
      
      // If permission denied or missing key, suggest checking settings
      if (msg.includes("403") || msg.includes("Requested entity was not found") || msg.includes("API Key is missing")) {
         setIsSettingsOpen(true);
      }
    }
  };

  const saveToLibrary = () => {
    if (currentIcon) {
        // Prevent duplicates
        if (!library.some(i => i.id === currentIcon.id)) {
            setLibrary(prev => [currentIcon, ...prev]);
        }
    }
  };

  const downloadIcon = () => {
    if (currentIcon) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${currentIcon.base64Data}`;
      link.download = `icon-genius-${currentIcon.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = (id: string) => {
    setLibrary(prev => prev.filter(icon => icon.id !== id));
  };

  const handleSelectFromLibrary = (icon: IconData) => {
    setCurrentIcon(icon);
    setStatus(AppStatus.SUCCESS);
    setEnhancementData({
        refinedPrompt: icon.prompt,
        suggestedSize: icon.size,
        styleDescription: 'From Library'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Main App
  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 selection:bg-indigo-500/30">
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        currentSettings={settings}
      />

      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-zinc-800 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">IconGenius</span>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-xs font-medium text-zinc-400 hover:text-white transition-all"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
               </svg>
               Settings
             </button>
             <div className="hidden sm:block text-xs font-mono text-zinc-600 border-l border-zinc-800 pl-4">
                {settings.modelTier === 'pro' ? 'Pro Model' : 'Free Model'}
             </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        
        {/* Generator Section */}
        <section className="grid lg:grid-cols-2 gap-12 mb-20">
          
          {/* Left Column: Input & Controls */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                Design stunning icons with words.
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-lg">
                Describe your idea, and Gemini will intelligently refine your concept and render a high-fidelity icon.
              </p>
            </div>

            <div className="bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all shadow-xl">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A minimalist logo for a meme vault app, purple gradient, secure lock symbol..."
                className="w-full bg-transparent text-lg p-4 outline-none resize-none text-white placeholder-zinc-600 h-32 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <div className="flex justify-between items-center px-4 pb-3 pt-1">
                 <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  {status === AppStatus.ENHANCING_PROMPT ? 'Refining Prompt...' : 
                   status === AppStatus.GENERATING_IMAGE ? 'Rendering Icon...' : 
                   status === AppStatus.SUCCESS ? 'Done!' : 'Ready'}
                 </span>
                <button
                  onClick={handleGenerate}
                  disabled={status === AppStatus.ENHANCING_PROMPT || status === AppStatus.GENERATING_IMAGE || !prompt.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  {status === AppStatus.ENHANCING_PROMPT || status === AppStatus.GENERATING_IMAGE ? (
                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                  ) : (
                    <>
                      <span>Generate</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Smart Insights Panel */}
            {enhancementData && (
               <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 text-sm animate-fade-in">
                  <div className="flex items-start gap-3">
                     <div className="mt-1 p-1 bg-indigo-500/10 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                     </div>
                     <div className="space-y-2">
                        <p className="text-zinc-400"><span className="text-zinc-200 font-semibold">Smart Enhancement:</span> Gemini detected <span className="text-indigo-300">{enhancementData.styleDescription}</span> style.</p>
                        <p className="text-zinc-500">Refined Prompt: "{enhancementData.refinedPrompt}"</p>
                        <div className="flex gap-2 mt-2">
                           <span className="px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-xs text-zinc-300">{enhancementData.suggestedSize}</span>
                           <span className="px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-xs text-zinc-300">1:1 Aspect Ratio</span>
                        </div>
                     </div>
                  </div>
               </div>
            )}
            
            {errorMsg && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 text-red-300 rounded-xl flex items-center gap-3">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                 </svg>
                 <span className="text-sm">
                    {errorMsg}
                    {(errorMsg.includes("403") || errorMsg.includes("Key")) && (
                        <button onClick={() => setIsSettingsOpen(true)} className="ml-2 underline hover:text-red-200">
                           Check Settings
                        </button>
                    )}
                 </span>
              </div>
            )}
          </div>

          {/* Right Column: Preview Area */}
          <div className="relative">
             <div className={`relative aspect-square w-full max-w-md mx-auto rounded-3xl overflow-hidden border-2 transition-all duration-500 ${
                 status === AppStatus.SUCCESS || currentIcon 
                 ? 'border-zinc-700 shadow-2xl shadow-indigo-500/10' 
                 : 'border-zinc-800 border-dashed bg-zinc-900/30'
             }`}>
                
                {currentIcon ? (
                  <img 
                    src={`data:image/png;base64,${currentIcon.base64Data}`} 
                    alt="Generated Icon" 
                    className="w-full h-full object-cover animate-fade-in"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                    {status === AppStatus.GENERATING_IMAGE ? (
                        <div className="text-center space-y-4">
                           <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                           <p className="animate-pulse text-indigo-400 font-medium">Creating masterpiece...</p>
                        </div>
                    ) : (
                        <>
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                           </svg>
                           <p>Your icon will appear here</p>
                        </>
                    )}
                  </div>
                )}
             </div>

             {/* Actions */}
             {currentIcon && (
               <div className="flex justify-center gap-3 mt-6">
                 <button 
                   onClick={() => {
                     saveToLibrary();
                   }}
                   className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors border border-zinc-700 flex items-center gap-2"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                     <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                   </svg>
                   Save to Library
                 </button>
                 <button 
                   onClick={downloadIcon}
                   className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-lg font-medium transition-colors shadow-lg shadow-white/10 flex items-center gap-2"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                   </svg>
                   Download
                 </button>
               </div>
             )}
          </div>
        </section>
        
        <div className="border-t border-zinc-800 my-12"></div>

        {/* Library Section */}
        <IconLibrary 
            icons={library} 
            onDelete={handleDelete}
            onSelect={handleSelectFromLibrary}
        />

      </main>
    </div>
  );
};

export default App;
