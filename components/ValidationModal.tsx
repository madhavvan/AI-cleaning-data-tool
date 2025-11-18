import React from 'react';
import { ValidationResult } from '../types';
import { AlertTriangle, CheckCircle, AlertOctagon, X, Wrench, Download } from 'lucide-react';

interface ValidationModalProps {
  isOpen: boolean;
  result?: ValidationResult;
  onClose: () => void;
  onConfirmExport: () => void;
  onAutoRepair: () => void;
  isProcessing: boolean;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  result,
  onClose,
  onConfirmExport,
  onAutoRepair,
  isProcessing
}) => {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-3">
            {result.isValid ? (
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6 text-rose-400" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">
                {result.isValid ? 'Validation Passed' : 'Validation Failed'}
              </h2>
              <p className="text-sm text-slate-400">
                Schema Consistency Score: <span className={result.score === 100 ? "text-emerald-400" : "text-rose-400"}>{result.score}%</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {result.isValid ? (
            <div className="text-center py-8">
              <p className="text-lg text-slate-300 mb-2">Your data is perfectly clean and conforms to the schema.</p>
              <p className="text-sm text-slate-500">Ready for export.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-rose-900/10 border border-rose-500/20 rounded-lg">
                <h3 className="text-rose-200 font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Issues Found
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  The following columns contain values that do not match their expected data types.
                </p>
                
                <div className="space-y-3">
                  {result.errors.map((err, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-900/50 rounded border border-slate-700">
                       <div className="flex justify-between items-center">
                          <span className="font-semibold text-white">{err.column}</span>
                          <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-300">
                            Expected: {err.expectedType}
                          </span>
                       </div>
                       <div className="text-xs text-rose-400">
                          {err.issueCount} invalid cells (e.g. {err.examples.join(', ')})
                       </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-lg flex gap-4 items-start">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <Wrench className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                    <h4 className="text-cyan-100 font-medium">AI Auto-Repair</h4>
                    <p className="text-sm text-slate-400 mt-1">
                        Gemini 2.5 can automatically attempt to fix these issues by coercing types or imputing nulls where appropriate.
                    </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-800/50 flex items-center justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          
          {!result.isValid && (
             <button 
                onClick={onAutoRepair}
                disabled={isProcessing}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isProcessing ? (
                    <>Processing...</>
                ) : (
                    <>
                        <Wrench className="w-4 h-4" />
                        Repair with AI
                    </>
                )}
             </button>
          )}

          <button 
            onClick={onConfirmExport}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                result.isValid 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            {result.isValid ? 'Export Clean Data' : 'Export Anyway'}
          </button>
        </div>
      </div>
    </div>
  );
};