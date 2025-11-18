import React from 'react';
import { EvolutionProposal } from '../types';
import { X, GitBranch, Zap, Code2, ArrowRight } from 'lucide-react';

interface EvolutionPanelProps {
  isOpen: boolean;
  proposals: EvolutionProposal[];
  onClose: () => void;
  onApply: (id: string) => void;
  isGenerating: boolean;
}

export const EvolutionPanel: React.FC<EvolutionPanelProps> = ({
  isOpen, proposals, onClose, onApply, isGenerating
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-[#050505] border border-[#1a1a1a] shadow-[0_0_50px_rgba(12,230,242,0.1)] flex flex-col max-h-[80vh] relative">
        
        {/* Header */}
        <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#0ce6f2]/10 rounded border border-[#0ce6f2]/30">
                    <GitBranch className="w-6 h-6 text-[#0ce6f2]" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white font-tech tracking-widest">EVOLUTION ARCHITECT</h2>
                    <p className="text-xs text-[#0ce6f2] font-mono">RECURSIVE SELF-IMPROVEMENT MODULE</p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/50">
            {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Code2 className="w-12 h-12 text-[#0ce6f2] animate-pulse" />
                    <p className="text-[#0ce6f2] font-mono text-sm animate-pulse">ANALYZING CODEBASE STRUCTURE...</p>
                    <p className="text-gray-600 font-mono text-xs">Formulating optimization patches...</p>
                </div>
            ) : (
                <>
                    <div className="p-4 bg-[#0ce6f2]/5 border border-[#0ce6f2]/20 rounded-sm">
                        <p className="text-gray-300 text-sm font-mono">
                            <span className="text-[#0ce6f2] font-bold">SYSTEM NOTICE:</span> The Evolution Architect has analyzed the recent data patterns and generated the following code patches to improve future performance.
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {proposals.map((prop) => (
                            <div key={prop.id} className="bg-[#0a0a0a] border border-[#222] hover:border-[#0ce6f2] transition-colors group">
                                <div className="p-4 border-b border-[#222] flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Zap className="w-4 h-4 text-[#ff003c]" />
                                        <h3 className="font-bold text-white font-mono text-sm">{prop.title}</h3>
                                    </div>
                                    <span className="text-[10px] bg-[#111] border border-[#333] px-2 py-1 text-[#00ff41] font-mono">
                                        {prop.performanceImpact}
                                    </span>
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-gray-400 text-xs mb-4">{prop.description}</p>
                                        <div className="text-[10px] text-gray-500 font-mono mb-1">TARGET FILE</div>
                                        <div className="text-xs text-[#0ce6f2] font-mono bg-[#0ce6f2]/10 px-2 py-1 inline-block rounded-sm border border-[#0ce6f2]/20">
                                            {prop.targetFile}
                                        </div>
                                    </div>
                                    <div className="bg-black border border-[#1a1a1a] p-3 font-mono text-[10px] text-gray-300 overflow-x-auto custom-scrollbar">
                                        <pre>{prop.codePatch}</pre>
                                    </div>
                                </div>
                                <div className="p-3 bg-[#050505] border-t border-[#222] flex justify-end">
                                    <button 
                                        onClick={() => onApply(prop.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#0ce6f2] hover:bg-[#00fff2] text-black font-bold text-xs font-tech uppercase tracking-wider hover:shadow-[0_0_15px_#0ce6f2]"
                                    >
                                        <GitBranch className="w-3 h-3" />
                                        Merge Patch
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};