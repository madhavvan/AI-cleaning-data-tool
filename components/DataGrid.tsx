import React from 'react';
import { DataRow } from '../types';

interface DataGridProps {
  data: DataRow[];
  rawData?: DataRow[]; // For diffing
  columns: string[];
  highlightColumn?: string;
}

export const DataGrid: React.FC<DataGridProps> = ({ data, rawData, columns, highlightColumn }) => {
  if (!data || data.length === 0) return <div className="p-8 text-center text-slate-500 font-mono">NO DATA STREAM</div>;

  return (
    <div className="overflow-auto h-full bg-[#0a0a0a] custom-scrollbar">
      <table className="w-full border-collapse text-left text-sm whitespace-nowrap font-mono">
        <thead className="bg-black sticky top-0 z-10">
          <tr>
            <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 bg-black">
              ID
            </th>
            {columns.map((col) => (
              <th 
                key={col} 
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800 border-r border-slate-900 ${
                  highlightColumn === col ? 'text-cyan-400 bg-cyan-900/20' : 'text-slate-400'
                }`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900">
          {data.map((row, idx) => {
            // Compare with rawData if available to find changes
            const rawRow = rawData ? rawData[idx] : null;

            return (
              <tr key={row.id || idx} className="hover:bg-slate-900/50 transition-colors group">
                <td className="px-4 py-2 text-[10px] text-slate-600 border-r border-slate-900 bg-black/50">
                  {idx + 1}
                </td>
                {columns.map((col) => {
                  const val = row[col];
                  const rawVal = rawRow ? rawRow[col] : val;
                  const isChanged = rawRow && val !== rawVal;
                  
                  let displayVal: React.ReactNode = val as React.ReactNode;
                  const isNull = val === null || val === undefined || val === '';
                  
                  if (isNull) displayVal = <span className="text-slate-700">NULL</span>;
                  else if (typeof val === 'boolean') displayVal = <span className={val ? 'text-emerald-500' : 'text-rose-500'}>{String(val).toUpperCase()}</span>;
                  
                  return (
                    <td 
                      key={`${row.id}-${col}`} 
                      className={`px-4 py-2 border-r border-slate-900/50 transition-all duration-500 ${
                         isChanged ? 'bg-cyan-900/20 text-cyan-200' : 'text-slate-400'
                      } ${highlightColumn === col ? 'bg-slate-800/30' : ''}`}
                    >
                      {displayVal}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};