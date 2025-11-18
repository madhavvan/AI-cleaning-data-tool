import React, { useState, useEffect, useMemo } from 'react';
import { DataRow } from '../types';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle } from 'lucide-react';

interface DataGridProps {
  data: DataRow[];
  rawData?: DataRow[]; // For diffing
  columns: string[];
  highlightColumn?: string;
}

const ROWS_PER_PAGE = 50;

// Memoized Row Component to prevent unnecessary re-renders
const GridRow = React.memo(({ 
  row, 
  rawRow, 
  columns, 
  globalIdx, 
  isEven 
}: { 
  row: DataRow, 
  rawRow: DataRow | null, 
  columns: string[], 
  globalIdx: number, 
  isEven: boolean 
}) => {
  return (
    <tr className="group hover:bg-slate-900/80 transition-colors">
      {/* Sticky First Column Cell */}
      <td className={`sticky left-0 z-30 border-b border-r border-slate-800 px-2 py-2 text-center text-slate-600 font-mono shadow-[2px_0_5px_rgba(0,0,0,0.3)]
          ${isEven ? 'bg-[#0a0a0a]' : 'bg-[#0d0d0d]'} 
          group-hover:bg-slate-900`}
      >
        {globalIdx + 1}
      </td>
      
      {columns.map((col) => {
        const val = row[col] as React.ReactNode;
        const rawVal = rawRow ? rawRow[col] : val;
        
        // Diff check - simplified for speed
        const isChanged = rawRow && val !== rawVal && (val !== null || rawVal !== null);
        
        // Check for flags
        const flagMsg = row._flags && (row._flags as Record<string, string>)[col];
        
        let displayVal: React.ReactNode = val;
        const isNull = val === null || val === undefined || val === '';
        
        if (isNull) displayVal = <span className="text-slate-700 italic">null</span>;
        else if (typeof val === 'boolean') displayVal = <span className={val ? 'text-emerald-500' : 'text-rose-500'}>{String(val).toUpperCase()}</span>;
        
        return (
          <td 
            key={`${row.id}-${col}`} 
            className={`px-4 py-2 border-b border-r border-slate-900/50 whitespace-nowrap truncate max-w-[300px]
              ${isChanged ? 'bg-cyan-950/20 text-cyan-300' : 'text-slate-300'}
              ${!isChanged && isNull ? 'bg-rose-950/5' : ''}
              ${flagMsg ? 'bg-amber-900/20' : ''}
            `}
            title={typeof val === 'string' ? val : String(val)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
               {flagMsg && (
                 <span title={String(flagMsg)} className="flex items-center shrink-0 cursor-help">
                   <AlertTriangle className="w-3 h-3 text-amber-500" />
                 </span>
               )}
              {isChanged && !flagMsg && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></div>}
              <span className="truncate">{displayVal}</span>
            </div>
          </td>
        );
      })}
    </tr>
  );
}, (prev, next) => {
  // Custom comparison function for performance
  // Only re-render if the specific row data or global index changed
  return prev.row === next.row && prev.rawRow === next.rawRow && prev.globalIdx === next.globalIdx;
});

export const DataGrid: React.FC<DataGridProps> = ({ data, rawData, columns, highlightColumn }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when data changes source
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]); // Only reset if length changes significantly, usually implies new dataset

  if (!data || data.length === 0) return (
    <div className="h-full w-full flex items-center justify-center bg-[#0a0a0a] text-slate-500 font-mono">
      <div className="flex flex-col items-center gap-2">
        <div className="w-2 h-2 bg-slate-600 rounded-full animate-pulse"></div>
        <span className="tracking-widest text-xs">AWAITING DATA STREAM</span>
      </div>
    </div>
  );

  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  
  // Memioze the current slice to prevent recalc on interactions outside grid
  const currentData = useMemo(() => data.slice(startIndex, endIndex), [data, startIndex, endIndex]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-xs font-mono select-none relative">
      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-auto custom-scrollbar will-change-scroll">
        <table className="min-w-full border-separate border-spacing-0 table-fixed">
          <thead className="bg-black">
            <tr>
              {/* Sticky IDX Header (Top-Left Corner) */}
              <th className="sticky left-0 top-0 z-50 bg-black border-b border-r border-slate-800 text-slate-500 font-bold px-4 py-3 w-[60px] text-center shadow-[2px_2px_5px_rgba(0,0,0,0.5)]">
                IDX
              </th>
              
              {/* Sticky Column Headers */}
              {columns.map((col) => (
                <th 
                  key={col} 
                  className={`sticky top-0 z-40 bg-black border-b border-r border-slate-800 px-4 py-3 text-left uppercase tracking-wider whitespace-nowrap min-w-[150px] max-w-[300px] truncate ${
                    highlightColumn === col ? 'text-cyan-400 bg-cyan-950/20' : 'text-slate-400'
                  }`}
                  title={col}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[#0a0a0a]">
            {currentData.map((row, localIdx) => {
               const globalIdx = startIndex + localIdx;
               const rawRow = rawData && rawData[globalIdx] ? rawData[globalIdx] : null;
               const isEven = globalIdx % 2 === 0;
               
               return (
                 <GridRow 
                    key={row.id || globalIdx} 
                    row={row} 
                    rawRow={rawRow} 
                    columns={columns} 
                    globalIdx={globalIdx} 
                    isEven={isEven}
                 />
               );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="h-10 bg-black border-t border-slate-800 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="text-[10px] text-slate-500 font-mono">
          VIEWING {startIndex + 1}-{Math.min(endIndex, data.length)} OF {data.length}
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="mx-3 flex items-center gap-1 text-[10px] font-mono">
            <span className="text-slate-500">PAGE</span>
            <span className="text-cyan-400 font-bold">{currentPage}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-500">{totalPages}</span>
          </div>

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};