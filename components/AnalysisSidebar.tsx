import React, { useEffect, useRef, memo } from 'react';
import { DatasetAnalysis, CleaningAction, AgentLog } from '../types';
import { Activity, Terminal, CheckCircle } from 'lucide-react';
import { PieChart as RePie, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AnalysisSidebarProps {
  analysis: DatasetAnalysis;
  actions: CleaningAction[];
  logs: AgentLog[];
  onExecuteAction: (actionId: string) => void;
  isProcessing: boolean;
  onOpenEvolution: () => void;
}

const LogItem = memo(({ log }: { log: AgentLog }) => (
    <div className="flex gap-2 relative z-0 animate-in fade-in duration-300">
        <span className="text-gray-700 shrink-0 select-none">[{log.timestamp}]</span>
        <span className={`font-bold shrink-0 ${
            log.agent === 'STRATEGIST' ? 'text-[#b569ff]' :
            log.agent === 'EXECUTIONER' ? 'text-[#ff003c]' :
            log.agent === 'AUDITOR' ? 'text-[#00ff41]' : 
            log.agent === 'EVOLUTION' ? 'text-[#0ce6f2]' : 'text-gray-500'
        }`}>
            {log.agent}
            {log.agent !== 'SYSTEM' && ':'}
        </span>
        <span className={`break-words ${
            log.level === 'error' ? 'text-[#ff003c]' :
            log.level === 'success' ? 'text-[#00ff41]' :
            log.level === 'warn' ? 'text-amber-400' : 
            log.level === 'matrix' ? 'text-[#00ff41]' : 'text-gray-400'
        }`}>
            {log.message}
        </span>
    </div>
));

export const AnalysisSidebar: React.FC<AnalysisSidebarProps> = ({ 
    analysis, actions, logs, onExecuteAction, isProcessing, onOpenEvolution 
}) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Smooth scroll only when logs change
  useEffect(() => {
    if (logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs.length]); // Only trigger on count change, not content mutation

  const dataQuality = [
    { name: 'Clean', value: analysis.overallHealthScore, color: '#00ff41' }, 
    { name: 'Corrupt', value: 100 - analysis.overallHealthScore, color: '#ff003c' } 
  ];

  return (
    <div className="w-[450px] bg-black border-r border-[#1a1a1a] flex flex-col h-full overflow-hidden font-mono relative z-30 shadow-xl">
      
      {/* Header */}
      <div className="p-4 border-b border-[#1a1a1a] bg-black flex justify-between items-center shrink-0">
        <h2 className="text-sm font-bold text-[#00ff41] tracking-widest flex items-center gap-2 font-tech">
          <Activity className="w-4 h-4" />
          SYSTEM DIAGNOSTICS
        </h2>
        <button 
            onClick={onOpenEvolution}
            className="text-[10px] px-2 py-1 border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41] hover:text-black transition-colors uppercase font-bold"
        >
            Self-Evolve
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="p-4 grid grid-cols-2 gap-4 border-b border-[#1a1a1a] shrink-0">
        <div className="bg-[#050505] p-4 border border-[#1a1a1a] rounded relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1">
                <span className="text-[10px] text-gray-600 font-tech">HEALTH_INTEGRITY</span>
            </div>
            <div className="flex items-end justify-between mt-2">
                <span className={`text-4xl font-black font-tech ${analysis.overallHealthScore > 80 ? 'text-[#00ff41]' : analysis.overallHealthScore > 50 ? 'text-amber-400' : 'text-[#ff003c]'}`}>
                    {analysis.overallHealthScore}%
                </span>
                <div className="h-10 w-10">
                     <ResponsiveContainer>
                        <RePie>
                            <Pie 
                                data={dataQuality} 
                                dataKey="value" 
                                innerRadius={12} 
                                outerRadius={18} 
                                startAngle={90} 
                                endAngle={-270} 
                                stroke="none"
                                isAnimationActive={false} // Disable animation for performance
                            >
                                {dataQuality.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </RePie>
                     </ResponsiveContainer>
                </div>
            </div>
        </div>
        <div className="space-y-2">
            <div className="bg-[#050505] px-3 py-2 border border-[#1a1a1a] rounded flex justify-between items-center">
                <span className="text-xs text-gray-600 font-tech">ROW_COUNT</span>
                <span className="text-sm font-bold text-white font-mono">{analysis.rowCount.toLocaleString()}</span>
            </div>
            <div className="bg-[#050505] px-3 py-2 border border-[#1a1a1a] rounded flex justify-between items-center">
                <span className="text-xs text-gray-600 font-tech">COL_COUNT</span>
                <span className="text-sm font-bold text-white font-mono">{analysis.columnCount}</span>
            </div>
        </div>
      </div>

      {/* Agent Logs (Optimized) */}
      <div className="flex-1 flex flex-col min-h-0 border-b border-[#1a1a1a] bg-black relative">
        <div className="px-4 py-2 bg-[#050505] border-b border-[#1a1a1a] flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-2 font-tech">
                <Terminal className="w-3 h-3" /> SWARM_LINK v2.5
            </span>
            <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff003c] animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse delay-100"></div>
            </div>
        </div>
        
        {/* CRT Screen Effect Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-[11px] bg-black relative">
             <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] z-10 bg-[length:100%_3px]"></div>
            {logs.map((log, idx) => (
                <LogItem key={idx} log={log} />
            ))}
            <div ref={logEndRef} />
        </div>
      </div>

      {/* Actions Panel */}
      <div className="h-1/3 overflow-y-auto bg-[#050505] p-4 border-t border-[#1a1a1a]">
         <h3 className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest font-tech">Executable Protocols</h3>
         <div className="space-y-2">
            {actions.map((action) => (
              <button 
                key={action.id}
                onClick={() => onExecuteAction(action.id)}
                disabled={isProcessing || action.status === 'completed'}
                className={`w-full p-3 rounded-sm border text-left transition-all relative overflow-hidden ${
                    action.status === 'completed' 
                    ? 'bg-[#111] border-[#222] opacity-50' 
                    : 'bg-black border-[#222] hover:border-[#0ce6f2]'
                }`}
              >
                <div className="flex justify-between items-start mb-1 relative z-10">
                  <span className="text-[10px] font-bold text-[#0ce6f2] uppercase tracking-wider font-tech">{action.type}</span>
                  {action.status === 'completed' && <CheckCircle className="w-3 h-3 text-[#00ff41]" />}
                </div>
                <h4 className="text-xs text-white font-bold mb-1 relative z-10 font-mono">{action.title}</h4>
                <p className="text-[10px] text-gray-500 relative z-10">{action.description}</p>
              </button>
            ))}
         </div>
      </div>
    </div>
  );
};