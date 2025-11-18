import { DataRow } from '../types';

export const parseCSV = (content: string): { headers: string[], data: DataRow[] } => {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return { headers: [], data: [] };

  // Simple comma split (handling quotes would require a more complex regex/parser)
  // For this demo, we use a semi-robust regex for comma splitting
  const parseLine = (line: string) => {
    const res = [];
    let entry = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        res.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    res.push(entry.trim());
    return res.map(e => e.replace(/^"|"$/g, '')); // Remove surrounding quotes
  };

  const headers = parseLine(lines[0]);
  const data: DataRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === headers.length) {
      const row: DataRow = { id: `row-${i}` };
      headers.forEach((header, index) => {
        const val = values[index];
        // Basic type inference
        const numVal = Number(val);
        if (val === '' || val.toLowerCase() === 'null' || val.toLowerCase() === 'nan') {
            row[header] = null;
        } else if (!isNaN(numVal) && val.trim() !== '') {
            row[header] = numVal;
        } else if (val.toLowerCase() === 'true') {
            row[header] = true;
        } else if (val.toLowerCase() === 'false') {
            row[header] = false;
        } else {
            row[header] = val;
        }
      });
      data.push(row);
    }
  }

  return { headers, data };
};

export const exportCSV = (data: DataRow[]): string => {
    if (data.length === 0) return '';
    
    // Extract headers, excluding 'id'
    const headers = Object.keys(data[0]).filter(k => k !== 'id');
    
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            const escaped = ('' + (val ?? '')).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
};