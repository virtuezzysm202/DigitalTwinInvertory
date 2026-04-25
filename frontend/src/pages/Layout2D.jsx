import React, { useState } from 'react';
import { 
  Eye, Columns, Maximize, Save, X, Plus, RefreshCw, 
  ZoomIn, ZoomOut, Send, Sparkles, Code, LayoutTemplate 
} from 'lucide-react';
import { Stage, Layer, Line, Text, Group, Circle } from 'react-konva';

export default function Layout2D() {
  const [chatInput, setChatInput] = useState('');

  // Simulasi kode markdown
  const markdownCode = `# Main Warehouse
Scale: 1:100
Unit: meters

## Zones

### Production Area
id: production
points: [[0,0], [12,0], [12,8], [0,8]]
color: #EFEFEF
items:
  - id: cnc_01
    name: "CNC Machine 01"
    pos: [2,2]
    icon: machine
  - id: rack_a
    name: "Pallet Rack A"
    pos: [6,5]
    rotation: 45
    count: 12

### Storage A
id: storage_a
points: [[12,0], [20,0], [20,15], [15,15], [15,8], [12,8]]
color: #D1FAE5
`;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* 1. HEADER UTAMA */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex justify-between items-center shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800">Main Warehouse</h1>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Location: /layouts/main_warehouse.md</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-md text-sm font-medium transition-colors">
            <Eye size={16} /> Preview
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-white bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium transition-colors">
            <Columns size={16} /> Split View
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-md text-sm font-medium transition-colors">
            <Maximize size={16} /> Fullscreen
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 text-white bg-green-700 hover:bg-green-800 rounded-md text-sm font-medium transition-colors ml-2 shadow-sm">
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      {/* 2. AREA 3-KOLOM (WORKSPACE) */}
      <div className="flex flex-1 overflow-hidden p-2 gap-2">
        
        {/* KOLOM KIRI: Markdown Editor */}
        <div className="w-[30%] bg-white border border-gray-200 rounded-lg flex flex-col shadow-sm overflow-hidden shrink-0">
          {/* Tabs */}
          <div className="flex bg-gray-100 border-b border-gray-200">
            <div className="flex items-center gap-2 bg-white px-4 py-2 border-r border-gray-200 border-t-2 border-t-green-600 text-sm font-medium text-gray-700">
              main_warehouse.md
              <X size={14} className="text-gray-400 hover:text-gray-700 cursor-pointer" />
            </div>
            <div className="flex items-center px-3 py-2 text-gray-500 hover:bg-gray-200 cursor-pointer">
              <Plus size={16} />
            </div>
          </div>
          
          {/* Editor Toolbar */}
          <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-md">
              <button className="px-3 py-1 bg-white shadow-sm rounded text-xs font-medium text-gray-700">Markdown</button>
              <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">Format</button>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded text-xs font-medium border border-green-200">
              <RefreshCw size={12} /> Sync Preview
            </button>
          </div>

          {/* Text Area (Simulasi Line Numbers) */}
          <div className="flex-1 flex overflow-auto bg-white font-mono text-sm">
            <div className="bg-gray-50 text-gray-400 px-3 py-2 text-right border-r border-gray-200 select-none">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre className="p-2 text-gray-800 outline-none w-full overflow-auto whitespace-pre-wrap">
              <span className="text-green-700 font-bold"># Main Warehouse</span>{'\n'}
              <span className="text-blue-600">Scale:</span> 1:100{'\n'}
              <span className="text-blue-600">Unit:</span> meters{'\n\n'}
              <span className="text-green-600 font-bold">## Zones</span>{'\n\n'}
              <span className="text-green-500 font-bold">### Production Area</span>{'\n'}
              <span className="text-red-500">id:</span> production{'\n'}
              <span className="text-red-500">points:</span> [[0,0], [12,0], [12,8], [0,8]]{'\n'}
              <span className="text-red-500">color:</span> <span className="text-purple-600">#EFEFEF</span>{'\n'}
              <span className="text-red-500">items:</span>{'\n'}
              {'  '}<span className="text-gray-500">-</span> <span className="text-blue-500">id:</span> cnc_01{'\n'}
              {'    '}<span className="text-blue-500">name:</span> "CNC Machine 01"{'\n'}
              {'    '}<span className="text-blue-500">pos:</span> [2,2]{'\n'}
              {'    '}<span className="text-blue-500">icon:</span> machine{'\n'}
            </pre>
          </div>

          {/* Footer Editor */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-1.5 flex justify-between items-center text-xs text-gray-500">
            <span>Lines 48, Words 158</span>
            <span className="flex items-center gap-1 text-green-600"><span className="w-2 h-2 rounded-full bg-green-500"></span> No errors</span>
          </div>
        </div>

        {/* KOLOM TENGAH: 2D Layout Preview (Konva Canvas) */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg flex flex-col shadow-sm overflow-hidden min-w-[400px]">
          {/* Header Preview */}
          <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-200 bg-white">
            <h2 className="font-semibold text-gray-800">2D Layout Preview</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">100%</span>
              <div className="flex items-center bg-gray-100 rounded-md border border-gray-200 overflow-hidden">
                <button className="p-1.5 text-gray-600 hover:bg-gray-200"><ZoomOut size={16} /></button>
                <div className="w-px h-4 bg-gray-300"></div>
                <button className="p-1.5 text-gray-600 hover:bg-gray-200"><ZoomIn size={16} /></button>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-600">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#EFEFEF] border border-gray-300"></span> Production Area</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#D1FAE5] border border-green-300"></span> Storage A</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#DBEAFE] border border-blue-300"></span> Office</div>
          </div>

          {/* Area Kanvas Konva (Simulasi bentuk seperti di desain) */}
          <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50 overflow-hidden relative flex items-center justify-center">
            <Stage width={500} height={400}>
              <Layer>
                {/* Garis Pengukur (Ruler) */}
                <Text text="0m" x={20} y={10} fontSize={12} fill="#9ca3af" />
                <Text text="10m" x={250} y={10} fontSize={12} fill="#9ca3af" />
                <Text text="20m" x={450} y={10} fontSize={12} fill="#9ca3af" />
                <Line points={[20, 25, 480, 25]} stroke="#d1d5db" strokeWidth={1} />

                {/* Zona Production (Abu-abu) */}
                <Group x={40} y={40}>
                  <Line points={[0,0, 180,0, 150,220, 0,220]} fill="#f3f4f6" stroke="#9ca3af" strokeWidth={2} closed />
                  <Text text="Production Area" x={10} y={10} fontSize={12} fontStyle="bold" fill="#374151" padding={4} />
                  
                  {/* Item di Production */}
                  <Circle x={90} y={90} radius={15} fill="#e5e7eb" stroke="#6b7280" strokeWidth={2} />
                  <Text text="CNC Machine 01" x={40} y={115} fontSize={11} fill="#4b5563" />
                  
                  <Circle x={110} y={170} radius={10} fill="#e5e7eb" stroke="#6b7280" strokeWidth={2} />
                  <Text text="Pallet Rack A" x={70} y={190} fontSize={11} fill="#4b5563" />
                </Group>

                {/* Zona Storage (Hijau) */}
                <Group x={220} y={40}>
                  <Line points={[0,0, 200,0, 200,300, 100,300, 100,220, -30,220]} fill="#dcfce7" stroke="#86efac" strokeWidth={2} closed />
                  <Text text="Storage A" x={90} y={10} fontSize={12} fontStyle="bold" fill="#166534" padding={4} />
                  
                  {/* Item di Storage */}
                  <Circle x={120} y={140} radius={12} fill="#bbf7d0" stroke="#22c55e" strokeWidth={2} />
                  <Text text="Box Sensor 01" x={80} y={160} fontSize={11} fill="#166534" />
                  <Text text="48 items" x={100} y={175} fontSize={10} fill="#15803d" />
                </Group>

                {/* Zona Office (Biru) */}
                <Group x={40} y={260}>
                  <Line points={[0,0, 120,0, 100,100, 0,100]} fill="#dbeafe" stroke="#93c5fd" strokeWidth={2} closed />
                  <Text text="Office" x={10} y={10} fontSize={12} fontStyle="bold" fill="#1e3a8a" padding={4} />
                </Group>

              </Layer>
            </Stage>
          </div>

          {/* Footer Preview */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center gap-6 text-sm text-gray-700 font-medium">
            <span>Total Items: 65</span>
            <span>Zones: 3</span>
            <span>Area: 196.00 m²</span>
          </div>
        </div>

        {/* KOLOM KANAN: AI Assistant Panel */}
        <div className="w-[280px] bg-white border border-gray-200 rounded-lg flex flex-col shadow-sm shrink-0">
          {/* Header AI */}
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
            <div className="flex items-center gap-2 text-green-700 font-bold">
              <Sparkles size={16} /> AI Assistant
            </div>
            <button className="text-xs text-gray-500 hover:text-gray-800">Clear</button>
          </div>

          {/* Area Chat */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {/* AI Welcome Message */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-tl-none p-3 text-sm text-gray-700 shadow-sm">
              Hi! I'm your inventory assistant. You can ask me anything about your stock and locations.
            </div>

            {/* Quick Prompts */}
            <div className="space-y-2 mt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Try these examples:</p>
              <button className="w-full text-left bg-green-50 text-green-700 text-sm p-2.5 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                Where is the CNC Machine?
              </button>
              <button className="w-full text-left bg-green-50 text-green-700 text-sm p-2.5 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                Show me items with low stock
              </button>
              <button className="w-full text-left bg-green-50 text-green-700 text-sm p-2.5 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                Move 10 boxes from Storage A to Production Area
              </button>
            </div>
          </div>

          {/* Input Chat */}
          <div className="p-3 border-t border-gray-100 bg-white">
            <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-all">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything..." 
                className="flex-1 bg-transparent text-sm outline-none text-gray-700"
              />
              <button className="bg-green-700 text-white p-1.5 rounded-lg hover:bg-green-800 transition-colors">
                <Send size={14} />
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-2">
              AI can make mistakes. Verify important data.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}