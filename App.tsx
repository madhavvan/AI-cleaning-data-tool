import React, { useState, useCallback } from 'react';
import { UploadZone } from './components/UploadZone';
import { AnalysisSidebar } from './components/AnalysisSidebar';
import { DataGrid } from './components/DataGrid';
import { ValidationModal } from './components/ValidationModal';
import { AppState, CleaningAction, DataRow } from './types';
import { parseCSV, exportCSV } from './utils/csvHelper';
import { validateDataset } from './utils/validation';
import { analyzeDatasetWithGemini, cleanDataBatch, fixValidationErrors } from './services/geminiService';
import { BrainCircuit, Download, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    stage: 'idle',
    rawData: [],
    cleanedData: [],
    analysis: null,
    actions: [],
    isProcessing: false,
    loadingMessage: '',
    isValidationModalOpen: false
  });

  const [viewMode, setViewMode] = useState<'raw' | 'cleaned'>('raw');

  const handleFileUpload = async (content: string, fileName: string) => {
    setState(prev => ({ ...prev, isProcessing: true, stage: 'analyzing', loadingMessage: 'Parsing CSV structure...' }));
    
    try {
      const { headers, data } = parseCSV(content);
      
      setState(prev => ({ ...prev, loadingMessage: 'Gemini AI is analyzing data quality...' }));
      
      const analysis = await analyzeDatasetWithGemini(data, headers);

      setState(prev => ({
        ...prev,
        stage: 'review',
        rawData: data,
        cleanedData: data,
        analysis,
        actions: analysis.recommendedActions,
        isProcessing: false,
        loadingMessage: ''
      }));

    } catch (error) {
      console.error(error);
      setState(prev => ({ 
        ...prev, 
        stage: 'idle', 
        isProcessing: false, 
        loadingMessage: 'Error analyzing file. Please try again.' 
      }));
      alert('Failed to analyze file. Check console for details.');
    }
  };

  const handleExecuteAction = async (actionId: string) => {
    const action = state.actions.find(a => a.id === actionId);
    if (!action) return;

    setState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        loadingMessage: `Applying fix: ${action.title}...` 
    }));

    try {
        const result = await cleanDataBatch(state.cleanedData, action);

        setState(prev => ({
            ...prev,
            cleanedData: result,
            viewMode: 'cleaned',
            actions: prev.actions.map(a => a.id === actionId ? { ...a, status: 'completed' } : a),
            isProcessing: false,
            loadingMessage: ''
        }));

    } catch (error) {
        console.error(error);
        setState(prev => ({ ...prev, isProcessing: false }));
        alert('Failed to execute cleaning action.');
    }
  };

  const handleValidateAndExport = () => {
      if (!state.analysis) return;

      // Run validation
      const validationResult = validateDataset(state.cleanedData, state.analysis.columns);
      
      setState(prev => ({
          ...prev,
          validationResult,
          isValidationModalOpen: true
      }));
  };

  const handleConfirmExport = () => {
      const csv = exportCSV(state.cleanedData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'clean_data_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setState(prev => ({ ...prev, isValidationModalOpen: false }));
  };

  const handleAutoRepair = async () => {
    if (!state.validationResult || !state.validationResult.errors.length) return;

    setState(prev => ({
        ...prev,
        isProcessing: true,
        loadingMessage: 'AI is repairing validation errors...'
    }));

    try {
        const repairedData = await fixValidationErrors(state.cleanedData, state.validationResult.errors);
        
        // Re-validate after repair
        const newValidationResult = validateDataset(repairedData, state.analysis!.columns);

        setState(prev => ({
            ...prev,
            cleanedData: repairedData,
            validationResult: newValidationResult,
            viewMode: 'cleaned',
            isProcessing: false,
            loadingMessage: ''
        }));

    } catch (error) {
        console.error(error);
        setState(prev => ({ 
            ...prev, 
            isProcessing: false,
            loadingMessage: ''
        }));
        alert("Repair failed. Please try again or export manually.");
    }
  };

  const getActiveHeaders = () => {
      const source = viewMode === 'raw' ? state.rawData : state.cleanedData;
      if (source.length === 0) return [];
      return Object.keys(source[0]).filter(k => k !== 'id');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0f172a] overflow-hidden text-slate-200 font-inter">
      
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            AutoCleanse AI
          </h1>
        </div>
        
        {state.stage === 'review' && (
            <div className="flex items-center gap-4">
               <div className="bg-slate-800 rounded-lg p-1 flex text-sm font-medium">
                  <button 
                    onClick={() => setViewMode('raw')}
                    className={`px-4 py-1.5 rounded-md transition-all ${viewMode === 'raw' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    Raw Data
                  </button>
                  <button 
                    onClick={() => setViewMode('cleaned')}
                    className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-2 ${viewMode === 'cleaned' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    <SparklesIcon className="w-3 h-3" />
                    Cleaned
                  </button>
               </div>
               
               <button 
                onClick={handleValidateAndExport}
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 font-semibold text-sm transition-colors shadow-lg shadow-white/10"
               >
                 <ShieldCheck className="w-4 h-4" /> Validate & Export
               </button>
            </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Loading Overlay */}
        {state.isProcessing && (
            <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-6"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-cyan-400 animate-pulse" />
                    </div>
                </div>
                <h2 className="text-xl font-medium text-white animate-pulse">{state.loadingMessage}</h2>
                <p className="text-slate-400 mt-2 text-sm">Powered by Gemini 2.5 Flash</p>
            </div>
        )}

        {state.stage === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="text-center max-w-3xl">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                        Data Cleaning on <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Autopilot</span>
                    </h1>
                    <p className="text-xl text-slate-400 mb-12">
                        Upload your CSV and let AI handle the dirty work. No formulas, no macros, just pure intelligent automation.
                    </p>
                </div>
                <UploadZone onFileUpload={handleFileUpload} />
            </div>
        )}

        {state.stage === 'review' && state.analysis && (
            <>
                <AnalysisSidebar 
                    analysis={state.analysis} 
                    actions={state.actions} 
                    onExecuteAction={handleExecuteAction}
                    isProcessing={state.isProcessing}
                />
                <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
                    <DataGrid 
                        data={viewMode === 'raw' ? state.rawData : state.cleanedData} 
                        columns={getActiveHeaders()} 
                    />
                </div>
            </>
        )}
      </main>
      
      {/* Modals */}
      <ValidationModal 
        isOpen={state.isValidationModalOpen}
        result={state.validationResult}
        onClose={() => setState(prev => ({ ...prev, isValidationModalOpen: false }))}
        onConfirmExport={handleConfirmExport}
        onAutoRepair={handleAutoRepair}
        isProcessing={state.isProcessing}
      />

    </div>
  );
};

const SparklesIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
);

export default App;