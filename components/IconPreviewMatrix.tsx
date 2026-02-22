import React, { useEffect, useState } from 'react';

interface IconPreviewMatrixProps {
  base64Data: string;
  originalPrompt: string;
}

interface ProcessedIcon {
  label: string;
  size: string;
  dataUrl: string;
  isExtensionStyle?: boolean;
}

export const IconPreviewMatrix: React.FC<IconPreviewMatrixProps> = ({ base64Data, originalPrompt }) => {
  const [icons, setIcons] = useState<ProcessedIcon[]>([]);

  useEffect(() => {
    const generateIcons = async () => {
      const img = new Image();
      // Ensure prefix
      img.src = base64Data.startsWith('data:') || base64Data.startsWith('http') 
        ? base64Data 
        : `data:image/png;base64,${base64Data}`;
      
      // Handle cross origin if it's a URL
      if (base64Data.startsWith('http')) {
          img.crossOrigin = "Anonymous";
      }

      await new Promise((resolve, reject) => { 
          img.onload = resolve; 
          img.onerror = reject;
      });

      const createResized = (width: number, height: number, padding: number = 0): string => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Use high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (padding > 0) {
            // Draw with padding (centered)
            // For 128x128 with 16px padding, the content is 96x96
            const drawWidth = width - (padding * 2);
            const drawHeight = height - (padding * 2);
            ctx.drawImage(img, padding, padding, drawWidth, drawHeight);
        } else {
            // Draw full bleed
            ctx.drawImage(img, 0, 0, width, height);
        }
        
        return canvas.toDataURL('image/png');
      };

      const newIcons: ProcessedIcon[] = [
        { label: 'Favicon', size: '16x16', dataUrl: createResized(16, 16) },
        { label: 'Small', size: '32x32', dataUrl: createResized(32, 32) },
        { label: 'Medium', size: '48x48', dataUrl: createResized(48, 48) },
        { label: 'Extension', size: '128x128', dataUrl: createResized(128, 128, 16), isExtensionStyle: true }, // 16px padding per side
        { label: 'Standard', size: '128x128', dataUrl: createResized(128, 128) },
      ];

      setIcons(newIcons);
    };

    generateIcons().catch(err => console.error("Failed to generate icon matrix", err));
  }, [base64Data]);

  const handleDownload = (icon: ProcessedIcon) => {
      const link = document.createElement('a');
      link.href = icon.dataUrl;
      link.download = `icon-${icon.size}-${icon.label.toLowerCase().replace(' ', '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800 animate-in fade-in zoom-in duration-300">
      {icons.map((icon, idx) => (
        <div key={idx} className="flex flex-col items-center gap-2 p-3 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors group/card">
           <div className="flex-1 flex items-center justify-center min-h-[120px] w-full bg-zinc-950/50 rounded-lg border border-zinc-800/50 border-dashed relative group overflow-hidden">
              {/* Checkerboard background for transparency */}
              <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: `linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)`,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}></div>
              
              <img 
                src={icon.dataUrl} 
                alt={`${icon.label} ${icon.size}`}
                style={{ 
                    width: icon.size.split('x')[0] + 'px', 
                    height: icon.size.split('x')[1] + 'px',
                    maxWidth: '100%',
                    maxHeight: '100%'
                }}
                className="rendering-pixelated z-10 shadow-lg"
              />
              
              <button 
                onClick={() => handleDownload(icon)}
                className="absolute inset-0 z-20 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="text-xs font-medium">Download</span>
              </button>
           </div>
           <div className="text-center w-full">
             <div className="text-xs font-medium text-zinc-300 truncate px-1">{icon.label}</div>
             <div className="text-[10px] text-zinc-500 font-mono">{icon.size}</div>
           </div>
        </div>
      ))}
    </div>
  );
};
