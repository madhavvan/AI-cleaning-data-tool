
export type CellValue = string | number | boolean | null | undefined;

export interface DataRow {
  id: string;
  _flags?: Record<string, string>;
  [key: string]: CellValue | Record<string, string>; // Broaden index signature to allow _flags
}

export interface ColumnStats {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'mixed';
  missingCount: number;
  uniqueCount: number;
  issues: string[];
  sampleValues: string[];
}

export interface CleaningAction {
  id: string;
  type: 'impute' | 'remove_duplicates' | 'standardize_format' | 'remove_outliers' | 'fix_typos' | 'nuclear_opt';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  columnTarget?: string; 
  status: 'pending' | 'processing' | 'completed';
}

export interface DatasetAnalysis {
  rowCount: number;
  columnCount: number;
  columns: ColumnStats[];
  overallHealthScore: number; 
  criticalIssues: string[];
  recommendedActions: CleaningAction[];
}

export interface ValidationError {
  column: string;
  expectedType: string;
  issueCount: number;
  examples: string[];
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  errors: ValidationError[];
  totalRowsChecked: number;
}

export interface AgentLog {
  timestamp: string;
  agent: 'STRATEGIST' | 'EXECUTIONER' | 'AUDITOR' | 'SYSTEM' | 'EVOLUTION';
  message: string;
  level: 'info' | 'warn' | 'success' | 'error' | 'matrix';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface EvolutionProposal {
  id: string;
  title: string;
  description: string;
  targetFile: string;
  codePatch: string;
  performanceImpact: string;
}

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter';

export interface ChartConfig {
  type: ChartType;
  xAxis: string;
  yAxis: string; // In a more complex app, this could be string[] for multi-line
  aggregation: 'sum' | 'avg' | 'count' | 'none';
  color: string;
}

export interface AppState {
  stage: 'idle' | 'analyzing' | 'command_center';
  rawData: DataRow[];
  cleanedData: DataRow[];
  analysis: DatasetAnalysis | null;
  actions: CleaningAction[];
  isProcessing: boolean;
  agentLogs: AgentLog[];
  validationResult?: ValidationResult;
  isValidationModalOpen: boolean;
  isEvolutionPanelOpen: boolean;
  evolutionProposals: EvolutionProposal[];
  nuclearMode: boolean;
  viewMode: 'raw' | 'cleaned' | 'visualize'; // Added 'visualize'
}
