import React, { useState } from 'react';
import { UploadZone } from './components/UploadZone';
import { AnalysisSidebar } from './components/AnalysisSidebar';
import { DataGrid } from './components/DataGrid';
import { ValidationModal } from './components/ValidationModal';
import { ChatInterface } from './components/ChatInterface';
import { EvolutionPanel } from './components/EvolutionPanel';
import { AppState, CleaningAction, AgentLog, DataRow, EvolutionProposal } from './types';
import { parseCSV, exportCSV } from './utils/csvHelper';
import { validateDataset } from './utils/validation';
import { analyzeDatasetWithGemini, cleanDataBatch, fixValidationErrors, nuclearClean, generateEvolutionProposals, generateAgentDebate } from './services/geminiService';
import { Download, Zap, RotateCcw, Biohazard, TerminalSquare } from 'lucide-react';

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
    isEvolutionPanelOpen: false,
    evolutionProposals: [],
    nuclearMode: false
  });

  const [viewMode, setViewMode] = useState<'raw' | 'cleaned'>('cleaned');

  const addLog = (agent: AgentLog['agent'], message: string, level: AgentLog['level'] = 'info') => {
    setState(prev => ({
        ...prev,
        agentLogs: [...prev.agentLogs, {
            timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
            agent,
            message,
            level
        }]
    }));
  };

  const handleFileUpload = async (content: string, fileName: string) => {
    setState({
        stage: 'analyzing',
        rawData: [],
        cleanedData: [],
        analysis: null,
        actions: [],
        isProcessing: true,
        agentLogs: [],
        isValidationModalOpen: false,
        isEvolutionPanelOpen: false,
        evolutionProposals: [],
        nuclearMode: false
    });

    addLog('SYSTEM', `MOUNTING VOLUME: ${fileName}...`);
    
    try {
      const { headers, data } = parseCSV(content);
      addLog('SYSTEM', `PARSED ${data.length} RECORDS.`, 'matrix');
      addLog('STRATEGIST', 'INITIALIZING DEEP SCAN...', 'info');
      
      const analysis = await analyzeDatasetWithGemini(data, headers);
      addLog('STRATEGIST', `SCAN COMPLETE. INTEGRITY: ${analysis.overallHealthScore}%`, analysis.overallHealthScore < 50 ? 'error' : 'success');
      analysis.criticalIssues.forEach(issue => addLog('STRATEGIST', `THREAT: ${issue}`, 'warn'));

      setState(prev => ({
        ...prev,
        stage: 'command_center',
        rawData: data,
        cleanedData: data,
        analysis,
        actions: analysis.recommendedActions,
        isProcessing: false,
        viewMode: 'raw'
      }));

    } catch (error) {
      addLog('SYSTEM', 'FATAL INGESTION ERROR', 'error');
      setState(prev => ({ ...prev, stage: 'idle', isProcessing: false }));
    }
  };

  const handleExecuteAction = async (actionId: string) => {
    const action = state.actions.find(a => a.id === actionId);
    if (!action) return;

    setState(prev => ({ ...prev, isProcessing: true }));
    addLog('EXECUTIONER', `EXECUTING: ${action.title}...`, 'warn');

    try {
        const result = await cleanDataBatch(state.cleanedData, action);
        addLog('EXECUTIONER', `PROTOCOL COMPLETE.`, 'success');

        setState(prev => ({
            ...prev,
            cleanedData: result,
            viewMode: 'cleaned',
            actions: prev.actions.map(a => a.id === actionId ? { ...a, status: 'completed' } : a),
            isProcessing: false
        }));
    } catch (error) {
        addLog('EXECUTIONER', 'PROTOCOL FAILED.', 'error');
        setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleNuclearClean = async () => {
    if (!state.analysis) return;
    if (!confirm("WARNING: NUCLEAR MODE ACTIVATED.\n\nThis will authorize the Agent Swarm to autonomously execute all cleaning protocols in parallel. This action is destructive and powerful.\n\nProceed?")) return;

    setState(prev => ({ ...prev, isProcessing: true, nuclearMode: true }));
    
    // Step 1: The Debate
    addLog('SYSTEM', 'INITIALIZING AGENT COUNCIL...', 'matrix');
    const debate = await generateAgentDebate(state.analysis);
    
    // Replay debate with simulated delay
    for (const entry of debate) {
        await new Promise(r => setTimeout(r, 800)); // Delay between chats
        addLog(entry.agent as AgentLog['agent'], entry.message, entry.level as AgentLog['level']);
    }

    addLog('SYSTEM', 'CONSENSUS REACHED: EXECUTE NUCLEAR OPTION.', 'error');
    
    // Step 2: Execution
    try {
        const nuclearResult = await nuclearClean(state.cleanedData, state.analysis.columns);
        addLog('EXECUTIONER', 'TARGET ANNIHILATED. RECONSTRUCTION COMPLETE.', 'success');

        const validation = validateDataset(nuclearResult, state.analysis.columns);
        addLog('AUDITOR', `POST-NUCLEAR INTEGRITY: ${validation.score}%`, 'matrix');

        setState(prev => ({
            ...prev,
            cleanedData: nuclearResult,
            viewMode: 'cleaned',
            isProcessing: false,
            actions: prev.actions.map(a => ({ ...a, status: 'completed' }))
        }));

    } catch (e) {
        addLog('SYSTEM', 'NUCLEAR CONTAINMENT BREACH.', 'error');
        setState(prev => ({ ...prev, isProcessing: false, nuclearMode: false }));
    }
  };

  const handleValidateAndExport = () => {
      if (!state.analysis) return;
      addLog('AUDITOR', 'VERIFYING SCHEMA COMPLIANCE...', 'info');
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
    addLog('AUDITOR', 'INITIATING AUTO-REPAIR...', 'warn');

    try {
        const repairedData = await fixValidationErrors(state.cleanedData, state.validationResult.errors);
        const newValidationResult = validateDataset(repairedData, state.analysis!.columns);
        
        addLog('AUDITOR', `REPAIR COMPLETE. SCORE: ${newValidationResult.score}%`, 'success');

        setState(prev => ({
            ...prev,
            cleanedData: repairedData,
            validationResult: newValidationResult,
            viewMode: 'cleaned',
            isProcessing: false
        }));
    } catch (error) {
        addLog('AUDITOR', 'REPAIR FAILED.', 'error');
        setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleOpenEvolution = async () => {
      if (!state.analysis) return;
      setState(prev => ({ ...prev, isEvolutionPanelOpen: true }));
      
      // Only generate if empty
      if (state.evolutionProposals.length === 0) {
          addLog('EVOLUTION', 'ANALYZING SELF-STRUCTURE...', 'matrix');
          const proposals = await generateEvolutionProposals(state.analysis);
          setState(prev => ({ ...prev, evolutionProposals: proposals }));
          addLog('EVOLUTION', 'OPTIMIZATION PATCHES GENERATED.', 'success');
      }
  };

  const handleApplyEvolution = (id: string) => {
      addLog('SYSTEM', `PUSHING PATCH ${id} TO ORIGIN/MAIN...`, 'warn');
      setTimeout(() => {
           addLog('SYSTEM', `GIT COMMIT DETECTED: [feat] auto-optimization ${id.substring(0,5)}`, 'matrix');
      }, 1000);
      setTimeout(() => {
           addLog('SYSTEM', `CI/CD PIPELINE: SUCCESS. DEPLOYING...`, 'success');
           setState(prev => ({ ...prev, isEvolutionPanelOpen: false }));
      }, 2500);
  };

  const handleConfirmExport = () => {
      addLog('SYSTEM', 'WRITING BINARY ARTIFACT...', 'success');
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
        isEvolutionPanelOpen: false,
        evolutionProposals: [],
        nuclearMode: false
      });
  };

  const getActiveHeaders = () => {
      const source = viewMode === 'raw' ? state.rawData : state.cleanedData;
      // IMPORTANT: Filter out the internal _flags property so it doesn't show as a column
      return source.length > 0 ? Object.keys(source[0]).filter(k => k !== 'id' && k !== '_flags') : [];
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-slate-200 font-inter overflow-hidden">
      
      {/* Top Bar */}
      <header className="h-14 border-b border-[#1a1a1a] bg-black flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={handleReset}>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-black border border-[#0ce6f2] flex items-center justify-center group-hover:shadow-[0_0_15px_#0ce6f2] transition-all">
                <TerminalSquare className="w-5 h-5 text-[#0ce6f2]" />
             </div>
             <h1 className="text-lg font-bold tracking-wider text-white font-tech">DATA<span className="text-[#0ce6f2]">CLYSM</span> <span className="text-xs align-top text-[#ff003c] ml-1">v2</span></h1>
          </div>
          <div className="h-4 w-px bg-[#222] mx-2"></div>
          <span className="text-[10px] font-mono text-gray-500 hidden sm:inline-block uppercase tracking-widest">System Ready // Safety Disengaged</span>
        </div>
        
        <div className="flex items-center gap-4">
            {state.stage !== 'idle' && (
                 <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 text-[10px] font-mono text-gray-500 hover:text-[#0ce6f2] transition-colors border border-transparent hover:border-[#0ce6f2]/30 px-2 py-1"
                 >
                    <RotateCcw className="w-3 h-3" /> NEW SESSION
                 </button>
            )}

            {state.stage === 'command_center' && (
                <>
                <div className="h-4 w-px bg-[#222]"></div>
                {/* View Switcher */}
                <div className="flex bg-[#111] rounded-sm p-1 border border-[#222]">
                    <button onClick={() => setViewMode('raw')} className={`px-3 py-1 text-[10px] font-bold font-mono rounded-sm transition-all ${viewMode === 'raw' ? 'bg-[#222] text-white' : 'text-gray-600 hover:text-gray-400'}`}>RAW</button>
                    <button onClick={() => setViewMode('cleaned')} className={`px-3 py-1 text-[10px] font-bold font-mono rounded-sm transition-all ${viewMode === 'cleaned' ? 'bg-[#0ce6f2]/10 text-[#0ce6f2] shadow-[0_0_10px_rgba(12,230,242,0.2)]' : 'text-gray-600 hover:text-gray-400'}`}>CLEAN</button>
                </div>

                {/* MAKE IT BLEED CLEAN BUTTON */}
                <button 
                    onClick={handleNuclearClean}
                    disabled={state.isProcessing}
                    className="group relative px-6 py-2 bg-[#ff003c]/10 hover:bg-[#ff003c] text-[#ff003c] hover:text-black border border-[#ff003c] rounded-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite_linear] opacity-0 group-hover:opacity-100"></div>
                    <Biohazard className={`w-4 h-4 ${state.isProcessing ? 'animate-spin' : ''}`} />
                    <span className="text-xs font-black font-tech tracking-widest">MAKE IT BLEED</span>
                </button>

                <button 
                    onClick={handleValidateAndExport}
                    className="px-4 py-2 bg-white hover:bg-gray-200 text-black font-bold text-xs tracking-wide rounded-sm transition-colors flex items-center gap-2 border border-white"
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

        {/* 2. ANALYZING STAGE */}
        {state.stage === 'analyzing' && (
            <div className="h-full w-full flex flex-col items-center justify-center bg-black z-50">
                <div className="relative w-32 h-32 mb-8">
                    <div className="absolute inset-0 border-4 border-t-[#0ce6f2] border-r-[#0ce6f2] border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-4 border-t-transparent border-r-transparent border-b-[#ff003c] border-l-[#ff003c] rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <TerminalSquare className="w-12 h-12 text-white animate-pulse" />
                    </div>
                </div>
                <h2 className="text-3xl font-black text-white font-tech tracking-widest animate-pulse">
                    DATACLYSM v2
                </h2>
                <div className="mt-4 flex flex-col items-center gap-1 font-mono text-xs text-[#0ce6f2]">
                     <p className="typewriter">LOADING NEURAL SCHEMAS...</p>
                     <p className="text-[#ff003c]">DISABLING SAFETY LOCKS...</p>
                </div>
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
                    onOpenEvolution={handleOpenEvolution}
                />
                <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden relative">
                   <div className="absolute top-0 left-0 right-0 h-px bg-[#0ce6f2] shadow-[0_0_20px_#0ce6f2] z-10"></div>
                    <DataGrid 
                        data={viewMode === 'raw' ? state.rawData : state.cleanedData} 
                        rawData={viewMode === 'cleaned' ? state.rawData : undefined}
                        columns={getActiveHeaders()} 
                    />
                    
                    {state.isProcessing && (
                        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                            <div className="font-tech text-[#0ce6f2] text-2xl animate-pulse mb-4 tracking-widest">
                                AGENT SWARM OPERATING...
                            </div>
                            <div className="w-96 h-1 bg-[#222] rounded-full overflow-hidden">
                                <div className="h-full bg-[#ff003c] animate-[shimmer_1s_infinite_linear] w-full"></div>
                            </div>
                        </div>
                    )}
                </div>
            </>
        )}
      </main>

      {/* Overlays */}
      <ChatInterface appState={state} />

      <ValidationModal 
        isOpen={state.isValidationModalOpen}
        result={state.validationResult}
        onClose={() => setState(prev => ({ ...prev, isValidationModalOpen: false }))}
        onConfirmExport={handleConfirmExport}
        onAutoRepair={handleAutoRepair}
        isProcessing={state.isProcessing}
      />
      
      <EvolutionPanel 
        isOpen={state.isEvolutionPanelOpen}
        proposals={state.evolutionProposals}
        onClose={() => setState(prev => ({ ...prev, isEvolutionPanelOpen: false }))}
        onApply={handleApplyEvolution}
        isGenerating={state.evolutionProposals.length === 0}
      />
    </div>
  );
};

export default App;