import { GoogleGenAI, Type } from "@google/genai";
import { DatasetAnalysis, DataRow, CleaningAction, ValidationError } from '../types';

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const analyzeDatasetWithGemini = async (
  sampleData: DataRow[], 
  headers: string[]
): Promise<DatasetAnalysis> => {
  
  // Convert first 50 rows to JSON string for analysis
  const dataSnippet = JSON.stringify(sampleData.slice(0, 50));
  
  const prompt = `
    You are an expert Data Scientist. Analyze the following dataset snippet (JSON format).
    
    Identify:
    1. Data types for each column.
    2. Missing value counts (approximate based on sample).
    3. Quality issues (inconsistent formatting, outliers, typos, mixed types).
    4. An overall health score (0-100).
    5. A list of recommended automated cleaning actions.

    Dataset Headers: ${headers.join(', ')}
    Dataset Sample: ${dataSnippet}
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
    
    // Post-process actions to add status
    const actions = result.recommendedActions?.map((a: any) => ({
        ...a,
        status: 'pending'
    })) || [];

    return {
        ...result,
        recommendedActions: actions
    };

  } catch (error) {
    console.error("Analysis failed", error);
    throw new Error("Failed to analyze dataset.");
  }
};

export const cleanDataBatch = async (
  data: DataRow[], 
  action: CleaningAction
): Promise<DataRow[]> => {
    const dataStr = JSON.stringify(data); // Send whole chunk for demo
    
    const prompt = `
        Perform the following data cleaning action on the provided JSON dataset:
        Action: ${action.title} (${action.type})
        Description: ${action.description}
        Target Column: ${action.columnTarget || 'Global'}
        
        Rules:
        - Return ONLY the cleaned JSON array.
        - Do not change structure or keys unless specified.
        - If filling missing values, use statistical inference (median/mode) or context.
        - If fixing typos, use closest logical match.
        
        Dataset:
        ${dataStr}
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const cleaned = JSON.parse(response.text || '[]');
        if (Array.isArray(cleaned)) {
             return cleaned.map((row, idx) => ({
                ...row,
                id: data[idx]?.id || `row-${Date.now()}-${idx}`
            }));
        }
        return data;
    } catch (error) {
        console.error("Cleaning failed", error);
        return data;
    }
};

export const fixValidationErrors = async (
    data: DataRow[],
    errors: ValidationError[]
): Promise<DataRow[]> => {
    const dataStr = JSON.stringify(data);

    // Construct a specific instruction for errors
    const errorInstructions = errors.map(e => 
        `- Column "${e.column}" expects type "${e.expectedType}". Fix values like: ${JSON.stringify(e.examples)}.`
    ).join('\n');

    const prompt = `
        The following dataset has failed schema validation. Please repair the data automatically.
        
        Specific Errors to Fix:
        ${errorInstructions}
        
        General Rules:
        1. Attempt to coerce types (e.g. string "100" -> number 100).
        2. If a value is completely invalid for the target type (e.g. "N/A" in a number column), replace it with null.
        3. Return ONLY the corrected JSON array.
        4. Preserve all other columns and data exactly.

        Dataset:
        ${dataStr}
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const cleaned = JSON.parse(response.text || '[]');
        if (Array.isArray(cleaned)) {
             return cleaned.map((row, idx) => ({
                ...row,
                id: data[idx]?.id || `row-${Date.now()}-${idx}`
            }));
        }
        return data;

    } catch (error) {
        console.error("Validation repair failed", error);
        throw error;
    }
}