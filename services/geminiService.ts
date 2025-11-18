import { GoogleGenAI, Type } from "@google/genai";
import { DatasetAnalysis, DataRow, CleaningAction, ValidationError, ChatMessage, EvolutionProposal, AgentLog } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';
const CHAT_MODEL_NAME = 'gemini-3-pro-preview';

const cleanJson = (text: string | undefined): string => {
    if (!text) return '{}';
    // Remove markdown code blocks if present
    return text.replace(/```json\s*|\s*```/g, '').trim();
};

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

    const result = JSON.parse(cleanJson(response.text));
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

// --- AGENT: EXECUTIONER (Optimized) ---
export const cleanDataBatch = async (
  data: DataRow[], 
  action: CleaningAction
): Promise<DataRow[]> => {
    
    if (action.type === 'remove_duplicates') {
        console.log("Optimized Execution: Removing duplicates locally.");
        const seen = new Set<string>();
        return data.filter(row => {
            const signature = JSON.stringify(
                Object.entries(row)
                    .filter(([key]) => key !== 'id' && key !== '_flags')
                    .sort((a, b) => a[0].localeCompare(b[0]))
            );
            if (seen.has(signature)) return false;
            seen.add(signature);
            return true;
        });
    }

    if (action.type === 'remove_outliers') {
         const dataSnippet = JSON.stringify(data);
         const prompt = `
            ROLE: OUTLIER EXECUTIONER.
            TASK: Identify rows that contain statistical outliers in column: ${action.columnTarget || 'ANY'}.
            RETURN: A simple JSON array of "id" strings for the rows that must be DELETED.
            
            Example Output: ["row-1", "row-55"]

            DATA:
            ${dataSnippet}
         `;
         
         try {
            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            const idsToRemove = JSON.parse(cleanJson(response.text));
            if (Array.isArray(idsToRemove)) {
                const removeSet = new Set(idsToRemove);
                return data.filter(row => !removeSet.has(row.id));
            }
         } catch (e) {
             console.warn("Outlier optimization failed, falling back...", e);
         }
    }

    // NEW: Specialized Schema Enforcer Logic
    if (action.type === 'standardize_format' || action.type === 'fix_typos' || action.type.includes('schema')) {
        const dataStr = JSON.stringify(data);
        const prompt = `
            ROLE: SCHEMA ENFORCER (EXECUTIONER MODE).
            MISSION: ${action.title}.
            DIRECTIVE: ${action.description}.
            TARGET: ${action.columnTarget || 'ALL COLUMNS'}.

            STRICT EXECUTION RULES:
            1. ANALYZE the target column(s) for type inconsistencies against inferred schema.
            2. COERCE values where logical (e.g. "100" -> 100, "true" -> true, "2023/01/01" -> ISO Date).
            3. IF COERCION FAILS:
               - Set the cell value to NULL.
               - FLAG the row by adding a "_flags" object: { [ColumnName]: "Review Needed: ${action.type === 'fix_typos' ? 'Unrecognized Value' : 'Type Mismatch'}" }.
               - Preserving the "_flags" object is CRITICAL for the audit trail.
            4. PRESERVE existing valid data.
            5. Return ONLY the processed JSON array.

            DATASET:
            ${dataStr}
        `;

        try {
            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            const cleaned = JSON.parse(cleanJson(response.text));
            return Array.isArray(cleaned) ? cleaned : data;
        } catch (error) {
            console.error("Schema enforcement failed", error);
            return data;
        }
    }

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

        const cleaned = JSON.parse(cleanJson(response.text));
        return Array.isArray(cleaned) ? cleaned : data;
    } catch (error) {
        console.error("Execution failed", error);
        return data;
    }
};

// --- AGENT: COUNCIL (Argument Simulation) ---
export const generateAgentDebate = async (analysis: DatasetAnalysis): Promise<AgentLog[]> => {
    const prompt = `
      ROLE: MULTI-AGENT SYSTEM COORDINATOR.
      SCENARIO: A dirty dataset has been detected. Three AI agents are debating the "Nuclear Option".
      
      AGENTS:
      1. STRATEGIST (Logical, cautious, focuses on long-term integrity).
      2. EXECUTIONER (Aggressive, wants to purge rows, hates nulls).
      3. AUDITOR (Paranoid, obsessed with data loss, checks compliance).
  
      DATA CONTEXT:
      - Rows: ${analysis.rowCount}
      - Health: ${analysis.overallHealthScore}%
      - Issues: ${analysis.criticalIssues.join(', ')}
  
      TASK:
      Generate a short, intense 4-turn conversation where they argue about the best course of action.
      The conversation MUST end with them agreeing to initiate the NUCLEAR CLEAN.
      
      OUTPUT FORMAT: JSON Array of objects with keys: "agent", "message", "level".
      "level" can be "info", "warn", or "error".
      
      Example:
      [
        { "agent": "STRATEGIST", "message": "Data integrity critical.", "level": "info" },
        { "agent": "EXECUTIONER", "message": "Purge the weak rows!", "level": "warn" }
      ]
    `;
  
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const debate = JSON.parse(cleanJson(response.text));
        return Array.isArray(debate) ? debate : [];
    } catch (e) {
        console.error("Debate generation failed", e);
        return [
            { agent: 'STRATEGIST', message: 'Initiating consensus protocol...', level: 'info', timestamp: '' },
            { agent: 'EXECUTIONER', message: 'Skip protocol. DESTROY.', level: 'error', timestamp: '' }
        ];
    }
  }

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
        
        const cleaned = JSON.parse(cleanJson(response.text));
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
        ROLE: SCHEMA ENFORCER (AUDITOR).
        STATUS: CRITICAL INTEGRITY CHECK.
        
        ISSUES TO RESOLVE:
        ${errorInstructions}
        
        PROTOCOL:
        1. Enforce strict data types for the specified columns.
        2. Attempt intelligent coercion (Strings -> Numbers, standardizing Dates).
        3. FAILURE HANDLING:
           - If a value cannot be coerced, set it to NULL.
           - MUST inject a flag into the row's "_flags" property: key = Column Name, value = "Review Needed: Coercion Failed".
           - Example: { "id": "row-1", "Age": null, "_flags": { "Age": "Review Needed: Coercion Failed" } }
        4. Return ONLY the corrected JSON array.

        DATASET:
        ${dataStr}
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const cleaned = JSON.parse(cleanJson(response.text));
        return Array.isArray(cleaned) ? cleaned : data;

    } catch (error) {
        console.error("Validation repair failed", error);
        throw error;
    }
}

// --- AGENT: CHATBOT (Gemini 3 Pro) ---
export const queryChatBot = async (
  history: ChatMessage[], 
  currentMessage: string, 
  contextData: any
): Promise<string> => {
  const formattedHistory = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  const analysis = contextData.analysis;
  const columnsInfo = analysis?.columns?.map((c: any) => `${c.name} (${c.type})`).join(', ') || 'None';

  const systemInstruction = `
    ROLE: DATACLYSM INTELLIGENCE (MODEL: GEMINI 3 PRO).
    MISSION: Assist the human operator in understanding and cleaning their data.
    
    CURRENT DATASET CONTEXT:
    - Stage: ${contextData.stage}
    - Total Rows: ${analysis?.rowCount || 'N/A'}
    - Total Columns: ${analysis?.columnCount || 'N/A'}
    - Health Score: ${analysis?.overallHealthScore || '0'}%
    - Column Structure: ${columnsInfo}
    - Critical Threats: ${analysis?.criticalIssues?.join('; ') || 'None detected'}
    
    DIRECTIVES:
    1. You are a high-tech, futuristic AI integrated into the DATACLYSM system.
    2. Use technical, precise language but remain helpful.
    3. Refer to the "dataset" and specific columns by name.
    4. If asked about cleaning, suggest specific actions based on the "Critical Threats".
    5. Keep responses concise (under 100 words) unless asked for detailed analysis.
  `;

  try {
    const chat = ai.chats.create({
        model: CHAT_MODEL_NAME,
        history: formattedHistory,
        config: {
            systemInstruction
        }
    });
    
    const result = await chat.sendMessage({ message: currentMessage });
    return result.text;
  } catch (error) {
      console.error("Chat failed", error);
      return "COMMUNICATION LINK SEVERED. RE-ROUTING...";
  }
}

// --- AGENT: EVOLUTION ARCHITECT (Self-Improvement) ---
export const generateEvolutionProposals = async (
    analysis: DatasetAnalysis
): Promise<EvolutionProposal[]> => {
    
    const prompt = `
        ROLE: EVOLUTION ARCHITECT (SELF-IMPROVEMENT CORE).
        OBJECTIVE: Analyze the recent data cleaning session and propose CODE IMPROVEMENTS to the 'DATACLYSM' codebase itself to handle this type of data better next time.
        
        DATA PROFILE:
        - Columns: ${analysis.columnCount}
        - Rows: ${analysis.rowCount}
        - Issues: ${analysis.criticalIssues.join(', ')}
        
        TASK:
        Generate 2 concrete TypeScript/React code improvements (patches) that would optimize this application.
        
        OUTPUT SCHEMA: JSON Array of Objects
        {
            "id": "evo-1",
            "title": "string (e.g. 'Optimize Date Parsing Regex')",
            "description": "string (why this helps)",
            "targetFile": "string (e.g. 'utils/csvHelper.ts')",
            "codePatch": "string (the actual code snippet to insert/replace)",
            "performanceImpact": "string (e.g. '+15% Speed')"
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            targetFile: { type: Type.STRING },
                            codePatch: { type: Type.STRING },
                            performanceImpact: { type: Type.STRING }
                        }
                    }
                 }
            }
        });
        
        return JSON.parse(cleanJson(response.text));
    } catch (error) {
        console.error("Evolution generation failed", error);
        return [];
    }
}