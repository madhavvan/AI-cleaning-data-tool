import React, { useState } from 'react';
import { UploadZone } from './components/UploadZone';
import { AnalysisSidebar } from './components/AnalysisSidebar';
import { DataGrid } from './components/DataGrid';
import { ValidationModal } from './components/ValidationModal';
import { AppState, CleaningAction, AgentLog, DataRow } from './types';
import { parseCSV, exportCSV } from './utils/csvHelper';
import { validateDataset } from './utils/validation';
import { analyzeDatasetWithGemini, cleanDataBatch, fixValidationErrors, nuclearClean } from './services/geminiService';
import { Download, Zap, ShieldCheck, Radiation, TerminalSquare, Eye, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    stage: 'idle',
    rawData: [],
    cleanedData: [],
    analysis: null,
    actions: [],
    isProcessing: false,
    agentLogs: [],
    isValidationModalOpen: false,
    nuclearMode: false
  });

  const [viewMode, setViewMode] = useState<'raw' | 'cleaned'>('cleaned');

  const addLog = (agent: AgentLog['agent'], message: string, level: AgentLog['level'] = 'info') => {
    setState(prev => ({
        ...prev,
        agentLogs: [...prev.agentLogs, {
            timestamp: new Date().toLocaleTimeString(),
            agent,
            message,
            level
        }]
    }));
  };

  const handleFileUpload = async (content: string, fileName: string) => {
    // Explicitly clear previous state and set stage to analyzing
    setState({
        stage: 'analyzing',
        rawData: [],
        cleanedData: [],
        analysis: null,
        actions: [],
        isProcessing: true,
        agentLogs: [],
        isValidationModalOpen: false,
        nuclearMode: false
    });

    addLog('SYSTEM', `Ingesting ${fileName}...`);
    
    try {
      const { headers, data } = parseCSV(content);
      addLog('SYSTEM', `Parsed ${data.length} rows. Initiating Strategist Agent...`);
      
      const analysis = await analyzeDatasetWithGemini(data, headers);
      addLog('STRATEGIST', `Analysis complete. Health Score: ${analysis.overallHealthScore}/100`, analysis.overallHealthScore < 50 ? 'error' : 'info');
      analysis.criticalIssues.forEach(issue => addLog('STRATEGIST', `Threat Detected: ${issue}`, 'warn'));

      setState(prev => ({
        ...prev,
        stage: 'command_center',
        rawData: data,
        cleanedData: data,
        analysis,
        actions: analysis.recommendedActions,
        isProcessing: false,
        viewMode: 'raw' // Start by showing raw data so they see the mess
      }));

    } catch (error) {
      addLog('SYSTEM', 'Critical Failure in Ingestion Protocol', 'error');
      setState(prev => ({ ...prev, stage: 'idle', isProcessing: false }));
    }
  };

  const handleExecuteAction = async (actionId: string) => {
    const action = state.actions.find(a => a.id === actionId);
    if (!action) return;

    setState(prev => ({ ...prev, isProcessing: true }));
    addLog('EXECUTIONER', `Initiating Protocol: ${action.title}...`, 'warn');

    try {
        const result = await cleanDataBatch(state.cleanedData, action);
        addLog('EXECUTIONER', `Protocol Complete. Data shape preserved.`, 'success');

        setState(prev => ({
            ...prev,
            cleanedData: result,
            viewMode: 'cleaned',
            actions: prev.actions.map(a => a.id === actionId ? { ...a, status: 'completed' } : a),
            isProcessing: false
        }));
    } catch (error) {
        addLog('EXECUTIONER', 'Protocol Failed.', 'error');
        setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleNuclearClean = async () => {
    if (!state.analysis) return;
    if (!confirm("WARNING: NUCLEAR MODE ACTIVATED.\n\nThis will authorize the Agent Swarm to autonomously execute all cleaning protocols in parallel. This action is destructive and powerful.\n\nProceed?")) return;

    setState(prev => ({ ...prev, isProcessing: true, nuclearMode: true }));
    addLog('SYSTEM', 'NUCLEAR AUTHORIZATION CODE ACCEPTED.', 'error');
    addLog('STRATEGIST', 'Handing over control to Swarm Intelligence.', 'warn');

    try {
        // 1. Execute the nuclear prompt
        const nuclearResult = await nuclearClean(state.cleanedData, state.analysis.columns);
        addLog('EXECUTIONER', 'Target annihilated. Reconstruction complete.', 'success');

        // 2. Verify results
        const validation = validateDataset(nuclearResult, state.analysis.columns);
        addLog('AUDITOR', `Post-Nuclear Scan. Health: ${validation.score}%`, 'info');

        setState(prev => ({
            ...prev,
            cleanedData: nuclearResult,
            viewMode: 'cleaned',
            isProcessing: false,
            actions: prev.actions.map(a => ({ ...a, status: 'completed' }))
        }));

    } catch (e) {
        addLog('SYSTEM', 'Nuclear containment breach. Operation aborted.', 'error');
        setState(prev => ({ ...prev, isProcessing: false, nuclearMode: false }));
    }
  };

  const handleValidateAndExport = () => {
      if (!state.analysis) return;
      addLog('AUDITOR', 'Running final schema validation...', 'info');
      const validationResult = validateDataset(state.cleanedData, state.analysis.columns);
      
      setState(prev => ({
          ...prev,
          validationResult,
          isValidationModalOpen: true
      }));
  };

  const handleAutoRepair = async () => {
    if (!state.validationResult?.errors.length) return;
    setState(prev => ({ ...prev, isProcessing: true }));
    addLog('AUDITOR', 'Attempting auto-repair of schema violations...', 'warn');

    try {
        const repairedData = await fixValidationErrors(state.cleanedData, state.validationResult.errors);
        const newValidationResult = validateDataset(repairedData, state.analysis!.columns);
        
        addLog('AUDITOR', `Repair complete. New Score: ${newValidationResult.score}%`, 'success');

        setState(prev => ({
            ...prev,
            cleanedData: repairedData,
            validationResult: newValidationResult,
            viewMode: 'cleaned',
            isProcessing: false
        }));
    } catch (error) {
        addLog('AUDITOR', 'Repair failed.', 'error');
        setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleConfirmExport = () => {
      addLog('SYSTEM', 'Exporting binary artifact...', 'success');
      const csv = exportCSV(state.cleanedData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'DATACLYSM_EXPORT.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setState(prev => ({ ...prev, isValidationModalOpen: false }));
  };

  const handleReset = () => {
      setState({
        stage: 'idle',
        rawData: [],
        cleanedData: [],
        analysis: null,
        actions: [],
        isProcessing: false,
        agentLogs: [],
        isValidationModalOpen: false,
        nuclearMode: false
      });
  };

  const getActiveHeaders = () => {
      const source = viewMode === 'raw' ? state.rawData : state.cleanedData;
      return source.length > 0 ? Object.keys(source[0]).filter(k => k !== 'id') : [];
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-slate-200 font-inter overflow-hidden">
      
      {/* Top Bar */}
      <header className="h-14 border-b border-slate-800 bg-black flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-4 cursor-pointer" onClick={handleReset}>
          <div className="flex items-center gap-2">
             <Zap className="w-5 h-5 text-cyan-400" />
             <h1 className="text-lg font-bold tracking-wider text-white font-mono">DATA<span className="text-cyan-400">CLYSM</span></h1>
          </div>
          <div className="h-4 w-px bg-slate-800 mx-2"></div>
          <span className="text-xs font-mono text-slate-500 hidden sm:inline-block">V2.5.0 // GOD-MODE ACTIVE</span>
        </div>
        
        <div className="flex items-center gap-4">
            {state.stage !== 'idle' && (
                 <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors"
                 >
                    <RotateCcw className="w-3 h-3" /> NEW PROJECT
                 </button>
            )}

            {state.stage === 'command_center' && (
                <>
                <div className="h-4 w-px bg-slate-800"></div>
                {/* View Switcher */}
                <div className="flex bg-slate-900 rounded p-1">
                    <button onClick={() => setViewMode('raw')} className={`px-3 py-1 text-xs font-mono rounded transition-all ${viewMode === 'raw' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>RAW</button>
                    <button onClick={() => setViewMode('cleaned')} className={`px-3 py-1 text-xs font-mono rounded transition-all ${viewMode === 'cleaned' ? 'bg-cyan-900/50 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>CLEAN</button>
                </div>

                {/* Nuclear Button */}
                <button 
                    onClick={handleNuclearClean}
                    disabled={state.isProcessing}
                    className="group relative px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:border-rose-400 rounded flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Radiation className={`w-4 h-4 ${state.isProcessing ? 'animate-spin' : ''}`} />
                    <span className="text-xs font-bold tracking-wider">NUCLEAR CLEAN</span>
                </button>

                <button 
                    onClick={handleValidateAndExport}
                    className="px-4 py-2 bg-white text-black font-bold text-xs tracking-wide rounded hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                    <Download className="w-4 h-4" /> EXPORT
                </button>
                </>
            )}
        </div>
      </header>

      {/* Main Stage */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* 1. IDLE STAGE (Upload) */}
        {state.stage === 'idle' && <UploadZone onFileUpload={handleFileUpload} />}

        {/* 2. ANALYZING STAGE (Loading) */}
        {state.stage === 'analyzing' && (
            <div className="h-full w-full flex flex-col items-center justify-center bg-[#050505] z-50">
                <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-r-2 border-blue-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
                </div>
                <h2 className="text-2xl font-bold text-white font-mono tracking-widest animate-pulse">
                    INITIALIZING AGENT SWARM
                </h2>
                <p className="text-cyan-500/70 mt-2 font-mono text-sm">Reading Schema... Detecting Anomalies...</p>
            </div>
        )}

        {/* 3. COMMAND CENTER STAGE */}
        {state.stage === 'command_center' && state.analysis && (
            <>
                <AnalysisSidebar 
                    analysis={state.analysis} 
                    actions={state.actions} 
                    logs={state.agentLogs}
                    onExecuteAction={handleExecuteAction}
                    isProcessing={state.isProcessing}
                />
                <div className="flex-1 flex flex-col bg-[#050505] overflow-hidden relative">
                   <div className="absolute top-0 left-0 right-0 h-px bg-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.5)] z-10"></div>
                    <DataGrid 
                        data={viewMode === 'raw' ? state.rawData : state.cleanedData} 
                        rawData={viewMode === 'cleaned' ? state.rawData : undefined}
                        columns={getActiveHeaders()} 
                    />
                    
                    {/* Processing Overlay for Command Center actions */}
                    {state.isProcessing && (
                        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                            <div className="font-mono text-cyan-400 text-xl animate-pulse mb-4">
                                AGENT SWARM OPERATING...
                            </div>
                            <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500 animate-[shimmer_2s_infinite_linear] w-1/2 translate-x-[-100%]"></div>
                            </div>
                        </div>
                    )}
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

export default App;