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

export interface DatasetAnalysis {
  rowCount: number;
  columnCount: number;
  columns: ColumnStats[];
  overallHealthScore: number; // 0 to 100
  criticalIssues: string[];
  recommendedActions: CleaningAction[];
}

export interface CleaningAction {
  id: string;
  type: 'impute' | 'remove_duplicates' | 'standardize_format' | 'remove_outliers' | 'fix_typos';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  columnTarget?: string; // If specific to a column
  status: 'pending' | 'processing' | 'completed';
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

export interface AppState {
  stage: 'idle' | 'analyzing' | 'review' | 'export';
  rawData: DataRow[];
  cleanedData: DataRow[];
  analysis: DatasetAnalysis | null;
  actions: CleaningAction[];
  isProcessing: boolean;
  loadingMessage: string;
  validationResult?: ValidationResult;
  isValidationModalOpen: boolean;
}