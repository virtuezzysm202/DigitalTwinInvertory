import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Save, Sparkles, Send, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Stage, Layer, Line, Text, Group, Circle } from 'react-konva';

export default function Layout2D() {
  const [chatInput, setChatInput] = useState('');
  const [markdownCode, setMarkdownCode] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [zones, setZones] = useState([]);

  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 450 });

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    fetchActiveLayout();
  }, []);

  // Live-preview otomatis dipicu saat isi textarea berubah
  useEffect(() => {
    if (markdownCode) {
      parseMarkdownData(markdownCode);
    }
  }, [markdownCode]);

  // Handle responsive auto-resize canvas stage
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: width || 600,
          height: height || 450
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // ==========================================
  // FETCH LAYOUT DARI API BACKEND
  // ==========================================
  const fetchActiveLayout = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/markdown/layout', getAuthHeader());
      
      if (response.data) {
        if (response.data.rawMarkdown) {
          setMarkdownCode(response.data.rawMarkdown);
        }
        
        const runtimeData = response.data.data;
        if (runtimeData && runtimeData.zones && Array.isArray(runtimeData.zones)) {
          const formattedZones = transformBackendZones(runtimeData.zones);
          setZones(formattedZones);
        }
      }
    } catch (error) {
      console.error("Gagal mengambil data JSON runtime layout:", error);
    }
  };

  // Helper standarisasi koordinat lokal Konva Line [x1, y1, x2, y2...]
  const transformBackendZones = (backendZones) => {
    return backendZones.map((zone, idx) => {
      const zX = zone.x || 0;
      const zY = zone.y || 0;
      const zW = zone.width || 100;
      const zH = zone.height || 100;

      return {
        id: zone.id || `zone_${idx}`,
        name: zone.name || 'Unnamed Zone',
        points: [0, 0, zW, 0, zW, zH, 0, zH], // Diubah ke lokal 0,0 terhadap Group koordinat X & Y
        color: zone.color || '#D1FAF5',
        items: zone.items || [],
        x: zX,
        y: zY
      };
    });
  };

  // ==========================================
  // LIVE TEXT-EDITOR PARSER (PERBAIKAN LOGIKA)
  // ==========================================
  const parseMarkdownData = (text) => {
    if (!text) return;
    try {
      const lines = text.split('\n');
      const tempZones = [];
      let currentZone = null;

      lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Mendeteksi baris Zone baru
        if (trimmedLine.startsWith('## ') && trimmedLine.includes('[Zone]')) {
          if (currentZone) {
            tempZones.push(currentZone);
          }

          const zoneNameMatch = trimmedLine.match(/\[Zone\]\s*([^(]+)/);
          const widthMatch = trimmedLine.match(/W:\s*(\d+)/i);
          const heightMatch = trimmedLine.match(/H:\s*(\d+)/i);
          const xMatch = trimmedLine.match(/X:\s*(\d+)/i);
          const yMatch = trimmedLine.match(/Y:\s*(\d+)/i);

          const zX = xMatch ? parseInt(xMatch[1]) : 0;
          const zY = yMatch ? parseInt(yMatch[1]) : 0;
          const zW = widthMatch ? parseInt(widthMatch[1]) : 100;
          const zH = heightMatch ? parseInt(heightMatch[1]) : 100;

          currentZone = {
            id: `zone_${tempZones.length}`,
            name: zoneNameMatch ? zoneNameMatch[1].trim() : "Unknown Zone",
            points: [0, 0, zW, 0, zW, zH, 0, zH], // Gunakan koordinat lokal grup
            color: '#D1FAF5',
            items: [],
            x: zX,
            y: zY
          };
        }
        // Mendeteksi baris Item di dalam Zone aktif
        else if (trimmedLine.startsWith('-') && currentZone) {
          const cleanLine = trimmedLine.substring(1).trim();
          const parts = cleanLine.split('|').map(p => p.trim());

          if (parts.length > 0 && parts[0] !== "") {
            const itemName = parts[0];
            let pos = [20, 40]; // default offset inside zone

            parts.forEach(part => {
              if (part.toLowerCase().startsWith('pos:')) {
                const coords = part.replace(/pos:\s*/i, '').split(',').map(c => parseInt(c.trim()));
                if (coords.length === 2) pos = coords;
              }
            });

            currentZone.items.push({
              id: `item_${currentZone.items.length}`,
              name: itemName,
              pos: pos
            });
          }
        }
      });

      if (currentZone) {
        tempZones.push(currentZone);
      }

      if (tempZones.length > 0) {
        setZones(tempZones);
      }
    } catch (e) {
      console.error("Gagal melakukan live-parsing teks:", e);
    }
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const boundedScale = Math.max(0.4, Math.min(newScale, 4));

    setScale(boundedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * boundedScale,
      y: pointer.y - mousePointTo.y * boundedScale,
    });
  };

  const zoomManual = (factor) => {
    setScale((prev) => Math.max(0.4, Math.min(prev * factor, 4)));
  };

  const resetZoom = () => {
    setScale(1);
    setStagePos({ x: 0, y: 0 });
  };

  // ==========================================
  // SAVE CHANGES KE ENDPOINT API BACKEND BARU
  // ==========================================
  const handleSaveChanges = async () => {
    try {
      const extractedItems = zones.flatMap(zone => 
        (zone.items || []).map(item => ({
          item_id: item.id, 
          name: item.name,
          zone: zone.name,
          location_x: item.pos[0],
          location_y: item.pos[1]
        }))
      );

      await axios.post(`http://localhost:5000/api/markdown/save`, { 
        markdown: markdownCode,
        items: extractedItems
      }, getAuthHeader());

      alert('Layout berhasil disimpan & Sinkronisasi file warehouse.md sukses! 🚀');
    } catch (error) {
      console.error("Detail Error Simpan:", error);
      alert('Gagal menyimpan perubahan. Pastikan rute backend POST /api/markdown/save sudah aktif.');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Top Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">Main Warehouse Layout</h1>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>
          </div>
        </div>
        <button onClick={handleSaveChanges} className="px-4 py-2 text-white bg-green-700 hover:bg-green-800 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-2">
          <Save size={16} /> Save Changes
        </button>
      </div>

      {/* Tabs Menu Mobile */}
      <div className="md:hidden flex bg-white border-b border-gray-200 text-center shrink-0">
        <button onClick={() => setActiveTab('editor')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'editor' ? 'border-green-600 text-green-600' : 'text-gray-500'}`}>Editor</button>
        <button onClick={() => setActiveTab('preview')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'preview' ? 'border-green-600 text-green-600' : 'text-gray-500'}`}>2D Preview</button>
        <button onClick={() => setActiveTab('ai')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'ai' ? 'border-green-600 text-green-600' : 'text-gray-500'}`}>AI Assistant</button>
      </div>

      {/* Workspace Panel Layout */}
      <div className="flex flex-1 overflow-hidden p-2 gap-2 relative">
        
        {/* Left Side: Markdown Code Editor */}
        <div className={`${activeTab === 'editor' ? 'flex' : 'hidden'} md:flex md:w-[32%] bg-white border border-gray-200 rounded-lg flex-col shadow-sm overflow-hidden shrink-0 w-full h-full`}>
          <div className="flex bg-gray-100 border-b border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">warehouse.md</div>
          <textarea
            value={markdownCode}
            onChange={(e) => setMarkdownCode(e.target.value)}
            className="flex-1 p-4 text-gray-800 bg-white outline-none resize-none font-mono text-sm leading-relaxed"
            placeholder="Ketik kode markdown layout..."
          />
        </div>

        {/* Center: 2D Konva Canvas Preview */}
        <div className={`${activeTab === 'preview' ? 'flex' : 'hidden'} md:flex flex-1 bg-white border border-gray-200 rounded-lg flex-col shadow-sm overflow-hidden w-full h-full`}>
          <div className="px-4 py-2.5 border-b border-gray-200 bg-white font-semibold text-gray-800 flex justify-between items-center text-sm">
            <span>2D Layout Preview (Live)</span>
            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              Zoom: {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Badges Info Label */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-600 max-h-[80px] overflow-y-auto">
            {zones.map((zone, idx) => (
              <div key={zone.id || idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-gray-400" style={{ backgroundColor: zone.color }}></span> 
                {zone.name} ({zone.items?.length || 0} Items)
              </div>
            ))}
          </div>

          {/* Canvas Box Target Container */}
          <div ref={containerRef} className="flex-1 bg-gray-50 overflow-hidden p-2 min-h-0 w-full relative select-none">
            {/* Control Panel Zoom Buttons floating */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-20 bg-white p-1.5 rounded-xl shadow-md border border-gray-200">
              <button title="Zoom In" onClick={() => zoomManual(1.2)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                <ZoomIn size={18} />
              </button>
              <button title="Zoom Out" onClick={() => zoomManual(0.8)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                <ZoomOut size={18} />
              </button>
              <div className="border-t border-gray-200 my-0.5"></div>
              <button title="Reset View" onClick={resetZoom} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                <Maximize2 size={18} />
              </button>
            </div>

            {/* Stage Box Render */}
            <div className="w-full h-full border border-dashed border-gray-200 bg-white rounded-md shadow-inner overflow-hidden cursor-grab active:cursor-grabbing">
              <Stage 
                width={dimensions.width} 
                height={dimensions.height}
                scaleX={scale}
                scaleY={scale}
                x={stagePos.x}
                y={stagePos.y}
                draggable={true} 
                onDragEnd={(e) => {
                  setStagePos({ x: e.target.x(), y: e.target.y() });
                }}
                onWheel={handleWheel} 
              >
                <Layer>
                  {/* Grid Ruler Sederhana */}
                  <Text text="0px" x={20} y={10} fontSize={10} fill="#9ca3af" />
                  <Line points={[20, 25, dimensions.width - 20, 25]} stroke="#e5e7eb" strokeWidth={1} />

                  {/* Render Setiap Zona */}
                  {zones.map((zone, idx) => (
                    <Group key={zone.id || idx} x={zone.x || 0} y={zone.y || 0}>
                      {/* Bidang Kotak Zona */}
                      <Line points={zone.points} fill={zone.color} stroke="#64748b" strokeWidth={1.5} closed />
                      
                      {/* Label Nama Zona */}
                      <Text 
                        text={zone.name} 
                        x={10} 
                        y={10} 
                        fontSize={11} 
                        fontStyle="bold" 
                        fill="#1e293b" 
                      />

                      {/* Render Item di Dalam Zona Terkait */}
                      {zone.items && zone.items.map((item, itemIdx) => (
                        <Group 
                          key={item.id || itemIdx} 
                          x={item.pos ? item.pos[0] : 0} 
                          y={item.pos ? item.pos[1] : 0}
                        >
                          <Circle radius={5} fill="#ffffff" stroke="#0f172a" strokeWidth={1.5} />
                          <Circle radius={1.5} fill="#ef4444" />
                          <Text 
                            text={item.name || item.id} 
                            x={-35} 
                            y={8} 
                            width={70}
                            align="center"
                            fontSize={9} 
                            fill="#334155" 
                            fontStyle="bold"
                          />
                        </Group>
                      ))}
                    </Group>
                  ))}
                </Layer>
              </Stage>
            </div>
          </div>
        </div>

        {/* Right Side: AI Assistant Panel */}
        <div className={`${activeTab === 'ai' ? 'flex' : 'hidden'} md:flex md:w-[240px] bg-white border border-gray-200 rounded-lg flex-col shadow-sm shrink-0 w-full h-full`}>
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 text-green-700 font-bold text-sm bg-gray-50">
            <Sparkles size={16} /> AI Assistant
          </div>
          <div className="flex-1 p-4 bg-white overflow-y-auto">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-tl-none p-3 text-xs text-gray-700 shadow-2xs">
              Hi! I can assist you with your markdown code formatting and items localization. Try modifying coordinates in the text editor!
            </div>
          </div>
          <div className="p-3 border-t border-gray-100 flex items-center gap-2">
            <input 
              type="text" 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              placeholder="Ask anything..." 
              className="flex-1 bg-transparent text-xs outline-none border border-gray-300 rounded-xl px-3 py-1.5 focus:border-green-500" 
            />
            <button className="bg-green-700 text-white p-1.5 rounded-lg hover:bg-green-800 transition-colors">
              <Send size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}