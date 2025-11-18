import React from 'react';
import { Upload, FileJson, Database, Zap, ArrowUpCircle } from 'lucide-react';

interface UploadZoneProps {
  onFileUpload: (content: string, fileName: string) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileUpload }) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) readFile(files[0]);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) readFile(files[0]);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onFileUpload(event.target.result as string, file.name);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="text-center mb-10 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 mb-6 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                <span className="text-cyan-400 text-[10px] font-mono tracking-[0.2em] uppercase">System Online // Awaiting Input</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter drop-shadow-2xl">
                DATA<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">CLYSM</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-lg mx-auto font-light tracking-wide">
                Autonomous Agentic Data Cleaning.
            </p>
        </div>

      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative group w-full max-w-2xl"
      >
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
        
        {/* Main Card */}
        <div className="relative flex flex-col items-center justify-center p-12 bg-[#050505] border border-slate-800 rounded-2xl group-hover:border-cyan-500/50 transition-all duration-300 shadow-2xl">
          
          <div className="relative w-24 h-24 mb-8 group-hover:scale-110 transition-transform duration-500">
            <div className="absolute inset-0 border-2 border-dashed border-slate-700 rounded-full animate-[spin_20s_linear_infinite] group-hover:border-cyan-500/50"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Upload className="w-10 h-10 text-cyan-500 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white mb-2 font-mono tracking-tight">INITIATE UPLOAD</h3>
          <p className="text-slate-500 text-center mb-8 text-sm">
            Drag & Drop your CSV file here or click below
          </p>

          <label className="group/btn relative px-12 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-widest rounded overflow-hidden cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1s_infinite]"></div>
            <span className="relative flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5" />
                SELECT FILE
            </span>
            <input type="file" accept=".csv" className="hidden" onChange={handleInput} />
          </label>
          
        </div>
      </div>

      <div className="mt-12 grid grid-cols-3 gap-12 text-slate-600 text-[10px] font-mono tracking-widest uppercase">
        <div className="flex flex-col items-center gap-2">
            <Database className="w-5 h-5 text-slate-500" />
            <span>High Volume</span>
        </div>
        <div className="flex flex-col items-center gap-2">
            <FileJson className="w-5 h-5 text-slate-500" />
            <span>Auto-Schema</span>
        </div>
        <div className="flex flex-col items-center gap-2">
            <Zap className="w-5 h-5 text-slate-500" />
            <span>Gemini 2.5</span>
        </div>
      </div>
    </div>
  );
};