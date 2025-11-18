import { GoogleGenAI, Type } from "@google/genai";
import { DatasetAnalysis, DataRow, CleaningAction, ValidationError } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

// --- AGENT: STRATEGIST ---
export const analyzeDatasetWithGemini = async (
  sampleData: DataRow[], 
  headers: string[]
): Promise<DatasetAnalysis> => {
  
  const dataSnippet = JSON.stringify(sampleData.slice(0, 50));
  
  const prompt = `
    ROLE: LEAD DATA STRATEGIST (Codename: OVERWATCH).
    OBJECTIVE: Analyze the provided dataset snippet with extreme scrutiny. Identify every flaw, weakness, and anomaly.
    
    OUTPUT FORMAT: JSON Object matching the schema below.
    
    TASK:
    1. Infer strict data types (Boolean, Number, String, Date).
    2. Detect NULLs, NANs, and missing values.
    3. Flag mixed types, outliers, and inconsistencies as CRITICAL THREATS.
    4. Calculate a Health Score (0-100).
    5. Formulate a battle plan (Recommended Actions) to purify the data.
    
    DATA CONTEXT:
    Headers: ${headers.join(', ')}
    Sample: ${dataSnippet}
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
              rowCount: { type: Type.INTEGER },
              columnCount: { type: Type.INTEGER },
              overallHealthScore: { type: Type.INTEGER },
              columns: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    missingCount: { type: Type.INTEGER },
                    uniqueCount: { type: Type.INTEGER },
                    issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                    sampleValues: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              criticalIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedActions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    impact: { type: Type.STRING },
                    columnTarget: { type: Type.STRING }
                  }
                }
              }
            }
          }
      }
    });

    const result = JSON.parse(response.text || '{}');
    const actions = result.recommendedActions?.map((a: any) => ({
        ...a,
        status: 'pending'
    })) || [];

    return { ...result, recommendedActions: actions };
  } catch (error) {
    console.error("Analysis failed", error);
    throw new Error("Strategist Agent failed to analyze dataset.");
  }
};

// --- AGENT: EXECUTIONER (Targeted) ---
export const cleanDataBatch = async (
  data: DataRow[], 
  action: CleaningAction
): Promise<DataRow[]> => {
    const dataStr = JSON.stringify(data); 
    
    const prompt = `
        ROLE: EXECUTIONER AGENT.
        MISSION: Execute specific cleaning protocol.
        PROTOCOL: ${action.title} (${action.type})
        DIRECTIVE: ${action.description}
        TARGET: ${action.columnTarget || 'GLOBAL SCOPE'}
        
        RULES:
        1. ANNIHILATE dirty data.
        2. IMPUTE missing values using context or statistical inference.
        3. DO NOT change the schema structure unless ordered.
        4. Return ONLY the cleaned JSON array.
        
        DATASET:
        ${dataStr}
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const cleaned = JSON.parse(response.text || '[]');
        return Array.isArray(cleaned) ? cleaned : data;
    } catch (error) {
        console.error("Execution failed", error);
        return data;
    }
};

// --- AGENT: SWARM (Nuclear Option) ---
export const nuclearClean = async (
    data: DataRow[],
    columns: any[]
): Promise<DataRow[]> => {
    const dataStr = JSON.stringify(data);
    const schemaDesc = columns.map(c => `${c.name} (${c.type})`).join(', ');

    const prompt = `
        ROLE: GOD-MODE DATA ANNIHILATOR.
        MISSION: NUCLEAR CLEAN.
        
        DIRECTIVES:
        1. You have full autonomy.
        2. Fix ALL types to match schema: ${schemaDesc}.
        3. Remove duplicates.
        4. Fix typos in categorical strings.
        5. Impute missing values with high-confidence estimates.
        6. Standardize dates to ISO 8601.
        7. Return ONLY the perfected JSON array.
        
        DATASET:
        ${dataStr}
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const cleaned = JSON.parse(response.text || '[]');
        return Array.isArray(cleaned) ? cleaned : data;
    } catch (error) {
        throw error;
    }
}

// --- AGENT: AUDITOR (Validation Repair) ---
export const fixValidationErrors = async (
    data: DataRow[],
    errors: ValidationError[]
): Promise<DataRow[]> => {
    const dataStr = JSON.stringify(data);
    const errorInstructions = errors.map(e => 
        `- Column "${e.column}": Enforce type "${e.expectedType}". Example fix: ${JSON.stringify(e.examples)}.`
    ).join('\n');

    const prompt = `
        ROLE: SCHEMA ENFORCER.
        STATUS: CRITICAL FAILURE DETECTED.
        
        REPAIR ORDERS:
        ${errorInstructions}
        
        TACTICS:
        1. Coerce aggressively (e.g. "100" -> 100).
        2. If coercion fails, NULLIFY the cell.
        3. Return ONLY the compliant JSON array.

        DATASET:
        ${dataStr}
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const cleaned = JSON.parse(response.text || '[]');
        return Array.isArray(cleaned) ? cleaned : data;

    } catch (error) {
        console.error("Validation repair failed", error);
        throw error;
    }
}