export type CellValue = string | number | boolean | null;

export interface DataRow {
  id: string;
  [key: string]: CellValue;
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
  agent: 'STRATEGIST' | 'EXECUTIONER' | 'AUDITOR' | 'SYSTEM';
  message: string;
  level: 'info' | 'warn' | 'success' | 'error';
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
  nuclearMode: boolean;
}