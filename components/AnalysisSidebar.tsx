import React from 'react';
import { DatasetAnalysis, CleaningAction } from '../types';
import { AlertTriangle, CheckCircle, Sparkles, Activity, PieChart } from 'lucide-react';
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AnalysisSidebarProps {
  analysis: DatasetAnalysis;
  actions: CleaningAction[];
  onExecuteAction: (actionId: string) => void;
  isProcessing: boolean;
}

export const AnalysisSidebar: React.FC<AnalysisSidebarProps> = ({ analysis, actions, onExecuteAction, isProcessing }) => {
  
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const dataQuality = [
    { name: 'Clean', value: analysis.overallHealthScore, color: '#10b981' },
    { name: 'Issues', value: 100 - analysis.overallHealthScore, color: '#f43f5e' }
  ];

  return (
    <div className="w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Data Health Report
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Health Score */}
        <div className="flex items-center justify-between mb-2">
          <div>
             <span className={`text-4xl font-bold ${getHealthColor(analysis.overallHealthScore)}`}>
              {analysis.overallHealthScore}%
            </span>
            <p className="text-sm text-slate-400 mt-1">Quality Score</p>
          </div>
          <div className="h-20 w-20">
             <ResponsiveContainer width="100%" height="100%">
                <RePie data={dataQuality} dataKey="value" innerRadius={25} outerRadius={35} startAngle={90} endAngle={-270}>
                    {dataQuality.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                </RePie>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400">Rows</p>
                <p className="text-xl font-semibold text-white">{analysis.rowCount}</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400">Columns</p>
                <p className="text-xl font-semibold text-white">{analysis.columnCount}</p>
            </div>
        </div>

        {/* Critical Issues */}
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wider">Critical Issues</h3>
          <div className="space-y-2">
            {analysis.criticalIssues.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span className="text-sm text-rose-200">{issue}</span>
              </div>
            ))}
            {analysis.criticalIssues.length === 0 && (
                <div className="text-sm text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> No critical issues found.
                </div>
            )}
          </div>
        </div>

        {/* Recommended Actions */}
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            AI Recommendations
          </h3>
          <div className="space-y-3">
            {actions.map((action) => (
              <div 
                key={action.id} 
                className={`p-4 rounded-xl border transition-all ${
                    action.status === 'completed' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 opacity-75' 
                    : 'bg-slate-800 border-slate-700 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                      action.impact === 'high' ? 'bg-rose-500/20 text-rose-300' : 
                      action.impact === 'medium' ? 'bg-amber-500/20 text-amber-300' : 
                      'bg-blue-500/20 text-blue-300'
                  }`}>
                    {action.impact} Impact
                  </span>
                  {action.status === 'completed' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                </div>
                
                <h4 className="text-white font-medium mb-1">{action.title}</h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">{action.description}</p>
                
                {action.status !== 'completed' && (
                  <button 
                    onClick={() => onExecuteAction(action.id)}
                    disabled={isProcessing}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? 'AI Processing...' : 'Auto-Fix'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};