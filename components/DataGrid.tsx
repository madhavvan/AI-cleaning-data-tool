
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DataRow } from '../types';
import { AlertTriangle } from 'lucide-react';

interface DataGridProps {
  data: DataRow[];
  rawData?: DataRow[]; // For diffing
  columns: string[];
  highlightColumn?: string;
  onCellEdit?: (rowId: string, column: string, value: any) => void;
}

// Constants for Virtualization
const ROW_HEIGHT = 41; // Matches the CSS height of a row (py-2 + border + line-height)
const OVERSCAN = 10;   // Number of rows to render outside the viewport to prevent flickering

// --- EDITABLE CELL COMPONENT ---
const EditableCell = React.memo(({ 
  value, 
  rowId, 
  col, 
  onEdit, 
  isChanged, 
  flagMsg 
}: {
  value: any,
  rowId: string,
  col: string,
  onEdit: (rowId: string, col: string, val: any) => void,
  isChanged: boolean,
  flagMsg: string | undefined
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState<string>(String(value ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempValue(String(value ?? ''));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const commitChange = () => {
    setIsEditing(false);
    // Basic type inference for "God Mode" editing
    let finalVal: any = tempValue;
    
    // Number check
    if (!isNaN(Number(tempValue)) && tempValue.trim() !== '') {
        finalVal = Number(tempValue);
    }
    // Boolean check
    else if (tempValue.toLowerCase() === 'true') finalVal = true;
    else if (tempValue.toLowerCase() === 'false') finalVal = false;
    else if (tempValue.toLowerCase() === 'null' || tempValue.trim() === '') finalVal = null;
    
    if (finalVal !== value) {
        onEdit(rowId, col, finalVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitChange();
    if (e.key === 'Escape') {
        setTempValue(String(value ?? ''));
        setIsEditing(false);
    }
  };

  // Display Logic
  let displayVal: React.ReactNode = value;
  const isNull = value === null || value === undefined || value === '';
  
  if (isNull) displayVal = <span className="text-slate-700 italic">null</span>;
  else if (typeof value === 'boolean') displayVal = <span className={value ? 'text-emerald-500' : 'text-rose-500'}>{String(value).toUpperCase()}</span>;

  if (isEditing) {
    return (
      <input 
        ref={inputRef}
        type="text" 
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={commitChange}
        onKeyDown={handleKeyDown}
        className="w-full h-full bg-black text-white border border-cyan-500 px-2 py-0.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 z-50 absolute inset-0"
      />
    );
  }

  return (
    <div 
      className="flex items-center gap-2 overflow-hidden h-full w-full cursor-text relative group/cell"
      onClick={() => setIsEditing(true)}
    >
       {flagMsg && (
         <span title={String(flagMsg)} className="flex items-center shrink-0 cursor-help z-10">
           <AlertTriangle className="w-3 h-3 text-amber-500" />
         </span>
       )}
      {isChanged && !flagMsg && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 z-10"></div>}
      
      <span className="truncate block w-full">{displayVal}</span>
      
      {/* Hover hint */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-20 pointer-events-none">
          <div className="w-2 h-2 border-r border-b border-cyan-500"></div>
      </div>
    </div>
  );
}, (prev, next) => prev.value === next.value && prev.isChanged === next.isChanged && prev.flagMsg === next.flagMsg);


// --- MEMOIZED ROW ---
const GridRow = React.memo(({ 
  row, 
  rawRow, 
  columns, 
  globalIdx, 
  isEven,
  onCellEdit 
}: { 
  row: DataRow, 
  rawRow: DataRow | null, 
  columns: string[], 
  globalIdx: number, 
  isEven: boolean,
  onCellEdit?: (rowId: string, column: string, value: any) => void
}) => {
  return (
    <tr 
      className="group hover:bg-slate-900/80 transition-colors box-border" 
      style={{ height: ROW_HEIGHT }}
    >
      {/* Sticky First Column Cell (IDX) */}
      <td className={`sticky left-0 z-30 border-b border-r border-slate-800 px-2 text-center text-slate-600 font-mono text-[10px] shadow-[2px_0_5px_rgba(0,0,0,0.3)]
          ${isEven ? 'bg-[#0a0a0a]' : 'bg-[#0d0d0d]'} 
          group-hover:bg-slate-900`}
          style={{ width: 60, minWidth: 60, maxWidth: 60 }}
      >
        {globalIdx + 1}
      </td>
      
      {columns.map((col) => {
        const val = row[col];
        const rawVal = rawRow ? rawRow[col] : val;
        
        // Diff check
        const isChanged = rawRow && val !== rawVal && (val !== null || rawVal !== null);
        
        // Check for flags
        const flagMsg = row._flags && (row._flags as Record<string, string>)[col];
        
        return (
          <td 
            key={`${row.id}-${col}`} 
            className={`px-4 border-b border-r border-slate-900/50 whitespace-nowrap relative
              ${isChanged ? 'bg-cyan-950/20 text-cyan-300' : 'text-slate-300'}
              ${!isChanged && (val === null || val === '') ? 'bg-rose-950/5' : ''}
              ${flagMsg ? 'bg-amber-900/20' : ''}
            `}
            style={{ width: 200, minWidth: 200, maxWidth: 200 }}
            title={typeof val === 'string' ? val : String(val)}
          >
            <EditableCell 
                value={val}
                rowId={row.id}
                col={col}
                onEdit={onCellEdit || (() => {})}
                isChanged={Boolean(isChanged)}
                flagMsg={flagMsg}
            />
          </td>
        );
      })}
    </tr>
  );
}, (prev, next) => {
  return prev.row === next.row && prev.rawRow === next.rawRow && prev.globalIdx === next.globalIdx;
});

export const DataGrid: React.FC<DataGridProps> = ({ data, rawData, columns, highlightColumn, onCellEdit }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600); // Default estimate
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container on mount/resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Reset scroll when data changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [data.length]);

  // Virtualization Logic
  const totalRows = data.length;
  const totalHeight = totalRows * ROW_HEIGHT;
  
  const visibleRowCount = Math.ceil(containerHeight / ROW_HEIGHT);
  const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
  
  const renderStartIndex = Math.max(0, startIndex - OVERSCAN);
  const renderEndIndex = Math.min(totalRows, startIndex + visibleRowCount + OVERSCAN);
  
  const visibleData = useMemo(() => {
    return data.slice(renderStartIndex, renderEndIndex);
  }, [data, renderStartIndex, renderEndIndex]);

  // Spacers to simulate full scroll height
  const paddingTop = renderStartIndex * ROW_HEIGHT;
  const paddingBottom = (totalRows - renderEndIndex) * ROW_HEIGHT;

  if (!data || data.length === 0) return (
    <div className="h-full w-full flex items-center justify-center bg-[#0a0a0a] text-slate-500 font-mono">
      <div className="flex flex-col items-center gap-2">
        <div className="w-2 h-2 bg-slate-600 rounded-full animate-pulse"></div>
        <span className="tracking-widest text-xs">AWAITING DATA STREAM</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-xs font-mono select-none relative">
      
      {/* Virtual Scroll Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto custom-scrollbar will-change-scroll"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <table 
            className="border-separate border-spacing-0 table-fixed" 
            style={{ width: 'max-content' }} // Allow horizontal scroll for many columns
        >
          <thead className="bg-black h-[42px]">
            <tr>
              {/* Sticky IDX Header */}
              <th className="sticky left-0 top-0 z-50 bg-black border-b border-r border-slate-800 text-slate-500 font-bold px-2 text-center shadow-[2px_2px_5px_rgba(0,0,0,0.5)]"
                  style={{ width: 60, minWidth: 60, maxWidth: 60, height: 41 }}
              >
                IDX
              </th>
              
              {/* Sticky Column Headers */}
              {columns.map((col) => (
                <th 
                  key={col} 
                  className={`sticky top-0 z-40 bg-black border-b border-r border-slate-800 px-4 text-left uppercase tracking-wider whitespace-nowrap truncate ${
                    highlightColumn === col ? 'text-cyan-400 bg-cyan-950/20' : 'text-slate-400'
                  }`}
                  style={{ width: 200, minWidth: 200, maxWidth: 200, height: 41 }}
                  title={col}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-[#0a0a0a]">
            {/* Top Spacer */}
            {paddingTop > 0 && (
              <tr style={{ height: paddingTop }}>
                <td colSpan={columns.length + 1} />
              </tr>
            )}

            {/* Virtual Rows */}
            {visibleData.map((row, idx) => {
               const globalIdx = renderStartIndex + idx;
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
                    onCellEdit={onCellEdit}
                 />
               );
            })}

            {/* Bottom Spacer */}
            {paddingBottom > 0 && (
              <tr style={{ height: paddingBottom }}>
                <td colSpan={columns.length + 1} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Status */}
      <div className="h-8 bg-black border-t border-slate-800 flex items-center justify-between px-4 shrink-0 z-50 shadow-[0_-5px_10px_rgba(0,0,0,0.3)]">
        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
           <div className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-pulse"></div>
           VIEWING <span className="text-cyan-400">{renderStartIndex + 1}</span> - <span className="text-cyan-400">{Math.min(renderEndIndex, totalRows)}</span> OF <span className="text-white">{totalRows.toLocaleString()}</span> ROWS
        </div>
        <div className="text-[10px] text-slate-600 font-mono">
            RENDER TIME: <span className="text-emerald-500">{"<"}1ms</span>
        </div>
      </div>
    </div>
  );
};
