import React, { useEffect, useRef } from 'react';
import { DatasetAnalysis, CleaningAction, AgentLog } from '../types';
import { AlertTriangle, CheckCircle, Terminal, Activity, Zap, ShieldAlert } from 'lucide-react';
import { PieChart as RePie, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AnalysisSidebarProps {
  analysis: DatasetAnalysis;
  actions: CleaningAction[];
  logs: AgentLog[];
  onExecuteAction: (actionId: string) => void;
  isProcessing: boolean;
}

export const AnalysisSidebar: React.FC<AnalysisSidebarProps> = ({ analysis, actions, logs, onExecuteAction, isProcessing }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const dataQuality = [
    { name: 'Clean', value: analysis.overallHealthScore, color: '#06b6d4' },
    { name: 'Corrupt', value: 100 - analysis.overallHealthScore, color: '#334155' }
  ];

  return (
    <div className="w-[400px] bg-black border-r border-slate-800 flex flex-col h-full overflow-hidden font-mono">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-sm font-bold text-cyan-400 tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4" />
          SYSTEM DIAGNOSTICS
        </h2>
      </div>

      {/* Metrics Grid */}
      <div className="p-4 grid grid-cols-2 gap-4 border-b border-slate-800">
        <div className="bg-slate-900/50 p-4 border border-slate-800 rounded relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1">
                <span className="text-[10px] text-slate-500">HEALTH_INDEX</span>
            </div>
            <div className="flex items-end justify-between mt-2">
                <span className={`text-4xl font-black ${analysis.overallHealthScore > 80 ? 'text-emerald-400' : analysis.overallHealthScore > 50 ? 'text-amber-400' : 'text-rose-500'}`}>
                    {analysis.overallHealthScore}%
                </span>
                <div className="h-8 w-8">
                     <ResponsiveContainer>
                        <RePie data={dataQuality} dataKey="value" innerRadius={10} outerRadius={14} startAngle={90} endAngle={-270}>
                            {dataQuality.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </RePie>
                     </ResponsiveContainer>
                </div>
            </div>
        </div>
        <div className="space-y-2">
            <div className="bg-slate-900/50 px-3 py-2 border border-slate-800 rounded flex justify-between items-center">
                <span className="text-xs text-slate-500">ROWS</span>
                <span className="text-sm font-bold text-white">{analysis.rowCount}</span>
            </div>
            <div className="bg-slate-900/50 px-3 py-2 border border-slate-800 rounded flex justify-between items-center">
                <span className="text-xs text-slate-500">COLS</span>
                <span className="text-sm font-bold text-white">{analysis.columnCount}</span>
            </div>
        </div>
      </div>

      {/* Agent Logs (Terminal) */}
      <div className="flex-1 flex flex-col min-h-0 border-b border-slate-800 bg-[#050505]">
        <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <Terminal className="w-3 h-3" /> AGENT SWARM LOGS
            </span>
            <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-75"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150"></div>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
            {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 opacity-90">
                    <span className="text-slate-600">[{log.timestamp}]</span>
                    <span className={`${
                        log.agent === 'STRATEGIST' ? 'text-purple-400' :
                        log.agent === 'EXECUTIONER' ? 'text-rose-400' :
                        log.agent === 'AUDITOR' ? 'text-emerald-400' : 'text-blue-400'
                    } font-bold`}>
                        {log.agent}:
                    </span>
                    <span className={`${
                        log.level === 'error' ? 'text-rose-500' :
                        log.level === 'success' ? 'text-emerald-500' :
                        log.level === 'warn' ? 'text-amber-500' : 'text-slate-300'
                    }`}>
                        {log.message}
                    </span>
                </div>
            ))}
            <div ref={logEndRef} />
        </div>
      </div>

      {/* Actions Panel */}
      <div className="h-1/3 overflow-y-auto bg-black p-4 border-t border-slate-800">
         <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Recommended Protocols</h3>
         <div className="space-y-2">
            {actions.map((action) => (
              <button 
                key={action.id}
                onClick={() => onExecuteAction(action.id)}
                disabled={isProcessing || action.status === 'completed'}
                className={`w-full p-3 rounded border text-left transition-all group relative overflow-hidden ${
                    action.status === 'completed' 
                    ? 'bg-slate-900/50 border-slate-800 opacity-50' 
                    : 'bg-slate-900 border-slate-800 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                }`}
              >
                <div className="flex justify-between items-start mb-1 relative z-10">
                  <span className="text-xs font-bold text-cyan-300 uppercase">{action.type}</span>
                  {action.status === 'completed' && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                </div>
                <h4 className="text-sm text-white font-medium mb-1 relative z-10">{action.title}</h4>
                <p className="text-[10px] text-slate-400 relative z-10">{action.description}</p>
              </button>
            ))}
         </div>
      </div>
    </div>
  );
};