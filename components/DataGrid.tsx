import React from 'react';
import { DataRow } from '../types';

interface DataGridProps {
  data: DataRow[];
  columns: string[];
  highlightColumn?: string;
}

export const DataGrid: React.FC<DataGridProps> = ({ data, columns, highlightColumn }) => {
  if (!data || data.length === 0) return <div className="p-8 text-center text-slate-500">No data to display</div>;

  return (
    <div className="overflow-x-auto h-full bg-slate-900/50">
      <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-800 sticky top-0 z-10 shadow-sm">
          <tr>
            <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
              #
            </th>
            {columns.map((col) => (
              <th 
                key={col} 
                className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider border-b border-slate-700 ${
                  highlightColumn === col ? 'bg-cyan-900/30 text-cyan-300' : 'text-slate-300'
                }`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {data.map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-slate-800/50 transition-colors">
              <td className="px-6 py-3 font-mono text-xs text-slate-500 border-r border-slate-800/50">
                {idx + 1}
              </td>
              {columns.map((col) => {
                const val = row[col];
                let displayVal: React.ReactNode = val as React.ReactNode;
                let isNull = val === null || val === undefined || val === '';
                
                if (isNull) displayVal = <span className="text-rose-400/50 italic">null</span>;
                else if (typeof val === 'boolean') displayVal = <span className={val ? 'text-emerald-400' : 'text-rose-400'}>{String(val)}</span>;
                
                return (
                  <td 
                    key={`${row.id}-${col}`} 
                    className={`px-6 py-3 text-slate-300 ${
                       highlightColumn === col ? 'bg-cyan-900/10' : ''
                    }`}
                  >
                    {displayVal}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};