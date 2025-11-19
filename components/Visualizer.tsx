
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter 
} from 'recharts';
import { DataRow, ChartConfig, ChartType } from '../types';
import { Settings, BarChart2, TrendingUp, PieChart as PieIcon, Activity, Grid, Palette, LayoutTemplate, Database, MousePointerClick } from 'lucide-react';

interface VisualizerProps {
  data: DataRow[];
  columns: string[];
}

const NEON_PALETTE = [
  '#0ce6f2', // Cyan
  '#ff003c', // Red
  '#00ff41', // Green
  '#b569ff', // Purple
  '#facc15', // Yellow
  '#f97316'  // Orange
];

const CHART_TYPES = [
  { id: 'bar', icon: BarChart2, label: 'Bar Chart' },
  { id: 'line', icon: TrendingUp, label: 'Line Chart' },
  { id: 'area', icon: Activity, label: 'Area Chart' },
  { id: 'pie', icon: PieIcon, label: 'Pie Chart' },
  { id: 'scatter', icon: Grid, label: 'Scatter Plot' },
];

export const Visualizer: React.FC<VisualizerProps> = ({ data, columns }) => {
  // Default Config
  const [config, setConfig] = useState<ChartConfig>({
    type: 'bar',
    xAxis: columns[0] || '',
    yAxis: columns.find(c => typeof data[0]?.[c] === 'number') || columns[1] || '',
    aggregation: 'sum',
    color: NEON_PALETTE[0]
  });

  // --- Data Aggregation Logic ---
  const chartData = useMemo(() => {
    if (!data.length || !config.xAxis || !config.yAxis) return [];

    // 1. Grouping
    const groups: Record<string, number[]> = {};
    
    data.forEach(row => {
      const xVal = String(row[config.xAxis] ?? 'Unknown');
      const yVal = Number(row[config.yAxis]);
      
      if (!groups[xVal]) groups[xVal] = [];
      if (!isNaN(yVal)) groups[xVal].push(yVal);
    });

    // 2. Aggregation
    const processed = Object.keys(groups).map(key => {
      const values = groups[key];
      let resultValue = 0;

      if (config.aggregation === 'count') {
        resultValue = values.length;
      } else if (config.aggregation === 'sum') {
        resultValue = values.reduce((a, b) => a + b, 0);
      } else if (config.aggregation === 'avg') {
        resultValue = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      } else {
        resultValue = values[0] || 0; 
      }

      return {
        name: key,
        value: resultValue,
      };
    });

    return processed.slice(0, 50); // Limit to 50 data points for performance/readability
  }, [data, config]);

  // --- Renderers ---
  const renderChart = () => {
    const CommonAxis = [
      <CartesianGrid strokeDasharray="3 3" stroke="#222" key="grid" />,
      <XAxis dataKey="name" stroke="#555" tick={{fill: '#888', fontSize: 10}} key="x" />,
      <YAxis stroke="#555" tick={{fill: '#888', fontSize: 10}} key="y" />,
      <Tooltip 
        contentStyle={{ backgroundColor: '#050505', border: `1px solid ${config.color}`, borderRadius: '4px' }} 
        itemStyle={{ color: config.color, fontFamily: 'monospace' }}
        labelStyle={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold', marginBottom: '0.5rem' }}
        key="tooltip"
      />,
      <Legend wrapperStyle={{ paddingTop: '20px' }} key="legend" />
    ];

    switch (config.type) {
      case 'line':
        return (
          <LineChart data={chartData}>
            {CommonAxis}
            <Line type="monotone" dataKey="value" stroke={config.color} strokeWidth={3} dot={{fill: '#000', stroke: config.color, strokeWidth: 2, r: 4}} activeDot={{r: 6, fill: config.color}} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={chartData}>
            {CommonAxis}
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.6}/>
                <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={config.color} fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={NEON_PALETTE[index % NEON_PALETTE.length]} stroke="#000" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip 
                contentStyle={{ backgroundColor: '#050505', borderColor: '#333' }} 
                itemStyle={{ color: '#fff' }}
            />
            <Legend />
          </PieChart>
        );
      case 'scatter':
        return (
          <ScatterChart>
            {CommonAxis}
            <Scatter name="Values" data={chartData} fill={config.color} />
          </ScatterChart>
        );
      case 'bar':
      default:
        return (
          <BarChart data={chartData}>
            {CommonAxis}
            <Bar dataKey="value" fill={config.color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-slate-200 font-mono overflow-hidden">
      
      {/* TOP TOOLBAR: Chart Type Selection */}
      <div className="h-16 border-b border-[#1a1a1a] bg-black flex items-center justify-between px-6 shrink-0">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[#0ce6f2]">
                <LayoutTemplate className="w-5 h-5" /> 
                <span className="font-bold font-tech tracking-widest text-lg">VISUALIZER</span>
            </div>
            
            <div className="h-6 w-px bg-[#222]"></div>

            <div className="flex gap-1 bg-[#111] p-1 rounded border border-[#222]">
                {CHART_TYPES.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setConfig(prev => ({ ...prev, type: t.id as ChartType }))}
                        className={`px-3 py-1.5 rounded-sm flex items-center gap-2 transition-all text-xs font-bold uppercase tracking-wider ${
                            config.type === t.id 
                            ? 'bg-[#0ce6f2]/10 text-[#0ce6f2] shadow-[0_0_10px_rgba(12,230,242,0.1)] border border-[#0ce6f2]/30' 
                            : 'text-gray-500 hover:text-white hover:bg-[#222] border border-transparent'
                        }`}
                        title={t.label}
                    >
                        <t.icon className="w-4 h-4" />
                        <span className="hidden lg:inline">{t.label}</span>
                    </button>
                ))}
            </div>
         </div>

         <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest hidden md:block">
             Real-time Rendering Engine
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR: Data & Style Config */}
        <div className="w-80 bg-black border-r border-[#1a1a1a] flex flex-col overflow-y-auto z-20 shadow-2xl">
            
            {/* Section: Data Mapping */}
            <div className="p-6 border-b border-[#1a1a1a]">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2 font-tech tracking-widest text-sm">
                    <Database className="w-4 h-4 text-[#00ff41]" /> DATA MAPPING
                </h3>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                            <span>Group By (X-Axis)</span>
                            <span className="text-[#0ce6f2]">Category</span>
                        </label>
                        <div className="relative group">
                            <select 
                                className="w-full appearance-none bg-[#0a0a0a] border border-[#333] rounded p-3 text-xs text-gray-300 focus:border-[#0ce6f2] focus:outline-none focus:shadow-[0_0_10px_rgba(12,230,242,0.1)] transition-all cursor-pointer"
                                value={config.xAxis}
                                onChange={(e) => setConfig(prev => ({ ...prev, xAxis: e.target.value }))}
                            >
                                <option value="" disabled>Select a column...</option>
                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600 group-hover:text-[#0ce6f2] transition-colors">
                                <MousePointerClick className="w-3 h-3" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                            <span>Metric (Y-Axis)</span>
                            <span className="text-[#ff003c]">Value</span>
                        </label>
                        <div className="relative group">
                            <select 
                                className="w-full appearance-none bg-[#0a0a0a] border border-[#333] rounded p-3 text-xs text-gray-300 focus:border-[#ff003c] focus:outline-none focus:shadow-[0_0_10px_rgba(255,0,60,0.1)] transition-all cursor-pointer"
                                value={config.yAxis}
                                onChange={(e) => setConfig(prev => ({ ...prev, yAxis: e.target.value }))}
                            >
                                 <option value="" disabled>Select a column...</option>
                                 {columns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600 group-hover:text-[#ff003c] transition-colors">
                                <MousePointerClick className="w-3 h-3" />
                            </div>
                        </div>
                    </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Aggregation Method</label>
                        <div className="grid grid-cols-3 gap-1 bg-[#111] p-1 rounded border border-[#222]">
                            {['sum', 'avg', 'count'].map(agg => (
                                <button
                                    key={agg}
                                    onClick={() => setConfig(prev => ({ ...prev, aggregation: agg as any }))}
                                    className={`py-2 text-[10px] font-bold uppercase rounded-sm transition-all ${
                                        config.aggregation === agg 
                                        ? 'bg-gray-800 text-white shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-400 hover:bg-[#1a1a1a]'
                                    }`}
                                >
                                    {agg}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section: Styling */}
            <div className="p-6">
                 <h3 className="text-white font-bold mb-6 flex items-center gap-2 font-tech tracking-widest text-sm">
                    <Palette className="w-4 h-4 text-[#b569ff]" /> ESTHETICS
                </h3>
                <div className="grid grid-cols-6 gap-3">
                    {NEON_PALETTE.map(color => (
                        <button
                            key={color}
                            onClick={() => setConfig(prev => ({ ...prev, color }))}
                            className={`w-8 h-8 rounded-md border transition-all hover:scale-110 relative group ${
                                config.color === color ? 'border-white shadow-[0_0_10px_white]' : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: color }}
                        >
                             {config.color === color && (
                                 <div className="absolute inset-0 flex items-center justify-center">
                                     <div className="w-2 h-2 bg-black rounded-full" />
                                 </div>
                             )}
                        </button>
                    ))}
                </div>
                <p className="text-[10px] text-gray-600 mt-4 font-mono leading-relaxed">
                    Select a neon accent color to apply to the chart elements. 
                </p>
            </div>

            <div className="mt-auto p-6 border-t border-[#1a1a1a]">
                <div className="bg-[#050505] border border-[#222] rounded p-4 flex items-center justify-between">
                     <div>
                         <span className="text-[10px] text-gray-500 uppercase block">Data Points</span>
                         <span className="text-xl font-bold text-white font-tech">{chartData.length}</span>
                     </div>
                     <div className="h-8 w-px bg-[#222]"></div>
                     <div>
                         <span className="text-[10px] text-gray-500 uppercase block">Type</span>
                         <span className="text-xs font-bold text-[#0ce6f2] font-mono uppercase">{config.type}</span>
                     </div>
                </div>
            </div>
        </div>

        {/* MAIN CHART AREA */}
        <div className="flex-1 bg-[#050505] relative flex flex-col">
             {/* Grid Background Effect */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none"></div>
             <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none"></div>

             <div className="flex-1 p-8 min-h-0">
                 <div className="h-full w-full border border-[#1a1a1a] bg-black/40 backdrop-blur-sm rounded-xl p-4 relative shadow-2xl">
                    
                    {!config.xAxis || !config.yAxis ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 pointer-events-none z-10">
                            <Settings className="w-12 h-12 mb-4 opacity-20 animate-spin-slow" />
                            <p className="font-tech text-lg tracking-widest">AWAITING CONFIGURATION</p>
                            <p className="text-xs font-mono mt-2 opacity-50">Select X and Y axes from the sidebar</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            {renderChart()}
                        </ResponsiveContainer>
                    )}

                 </div>
             </div>
        </div>

      </div>
    </div>
  );
};
