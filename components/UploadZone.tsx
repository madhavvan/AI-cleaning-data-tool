import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

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
    if (files && files.length > 0) {
      readFile(files[0]);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      readFile(files[0]);
    }
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
    <div className="w-full max-w-2xl mx-auto mt-20">
      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative group cursor-pointer"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex flex-col items-center justify-center p-16 bg-slate-900 border-2 border-slate-700 border-dashed rounded-xl hover:border-cyan-500 transition-colors">
          
          <div className="w-20 h-20 mb-6 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-10 h-10 text-cyan-400" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">Drop your messy data here</h3>
          <p className="text-slate-400 text-center mb-8 max-w-md">
            Supports CSV files. We'll automatically detect schema, anomalies, and cleaning opportunities using Gemini 2.5.
          </p>

          <label className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/25 transition-all cursor-pointer transform active:scale-95">
            <span>Select CSV File</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleInput} />
          </label>
          
          <div className="mt-6 flex items-center space-x-2 text-sm text-slate-500">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Secure client-side processing preview</span>
          </div>
        </div>
      </div>
    </div>
  );
};