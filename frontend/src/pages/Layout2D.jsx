import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Save, Sparkles, Send, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Stage, Layer, Line, Text, Group, Circle } from 'react-konva';
import { useSearchParams } from 'react-router-dom';
import { sendLayoutCommand } from '../ai/services/layoutAIApi';

export default function Layout2D() {
  const [chatInput, setChatInput] = useState('');
  const [markdownCode, setMarkdownCode] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [zones, setZones] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true); 
  const [currentFilename, setCurrentFilename] = useState('warehouse.md');
  const [currentFileId, setCurrentFileId] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: 'Hi! Saya bisa membantu pindahkan item, zona, atau update posisi. Contoh: "pindahkan ITEM-01 ke zona Rak B"' }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const aiBottomRef = useRef(null);
  const [searchParams] = useSearchParams();
  const fileIdFromUrl = searchParams.get('fileId');
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

  // 1. Jalankan fetch pertama kali saat komponen mounting
  useEffect(() => {
    fetchActiveLayout();
  }, []);

  // 2. Live-preview otomatis HANYA dipicu setelah initial load selesai dilakukan
  useEffect(() => {
    if (!isInitialLoad && markdownCode) {
      parseMarkdownData(markdownCode);
    }
  }, [markdownCode, isInitialLoad]);

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
    if (!fileIdFromUrl) {
      setIsInitialLoad(false);
      return;
    }
    try {
      const response = await axios.get(
        `http://localhost:5000/api/markdown/files/${fileIdFromUrl}`,
        getAuthHeader()
      );

      if (response.data) {
        if (response.data.projectId) {
          setProjectId(response.data.projectId);
        }

        if (response.data.rawMarkdown) {
          setMarkdownCode(response.data.rawMarkdown);
        }
        if (response.data.filename) {
          setCurrentFilename(response.data.filename);
        }
        if (response.data.fileId) {
          setCurrentFileId(response.data.fileId);
        }

        const runtimeData = response.data.data;
        if (runtimeData && runtimeData.zones && Array.isArray(runtimeData.zones)) {
          const formattedZones = transformBackendZones(runtimeData.zones);
          setZones(formattedZones);
        }
        
        // Matikan flag initial load setelah data resmi dari backend masuk ke state
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error("Gagal mengambil data JSON runtime layout:", error);
      setIsInitialLoad(false);
    }
  };

  const transformBackendZones = (backendZones) => {
    return backendZones.map((zone, idx) => {
      const zX = Number(zone.x) || 0;
      const zY = Number(zone.y) || 0;
      const zW = Number(zone.width) || 100;
      const zH = Number(zone.height) || 100;

      return {
        id: zone.id || `zone_${idx}`,
        name: zone.name || 'Unnamed Zone',
        points: [0, 0, zW, 0, zW, zH, 0, zH],
        color: zone.color || '#D1FAF5',
        items: zone.items || [],
        x: zX,
        y: zY
      };
    });
  };

  // ==========================================
  // LIVE TEXT-EDITOR PARSER (SUDAH DIPERBAIKI 🚀)
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
        if (trimmedLine.startsWith('## ') && /\[Zone\]/i.test(trimmedLine)) {
          if (currentZone) {
            tempZones.push(currentZone);
          }

          const zoneNameMatch = trimmedLine.match(/\[Zone\]\s*([^(#\n|]+)/i);
          const widthMatch = trimmedLine.match(/W\s*:\s*(\d+)/i);
          const heightMatch = trimmedLine.match(/H\s*:\s*(\d+)/i);
          const xMatch = trimmedLine.match(/X\s*:\s*(\d+)/i);
          const yMatch = trimmedLine.match(/Y\s*:\s*(\d+)/i);

          const zX = xMatch ? parseInt(xMatch[1], 10) : 0;
          const zY = yMatch ? parseInt(yMatch[1], 10) : 0;
          const zW = widthMatch ? parseInt(widthMatch[1], 10) : 100;
          const zH = heightMatch ? parseInt(heightMatch[1], 10) : 100;

          currentZone = {
            id: `zone_${tempZones.length}`,
            name: zoneNameMatch ? zoneNameMatch[1].trim() : "Unknown Zone",
            points: [0, 0, zW, 0, zW, zH, 0, zH],
            color: '#D1FAF5',
            items: [],
            x: zX,
            y: zY
          };
        }
        
        // Mendeteksi baris Item dan memisahkan Kode | Nama (FIXED)
        else if (trimmedLine.startsWith('-') && currentZone) {
          const cleanLine = trimmedLine.substring(1).trim();
          const parts = cleanLine.split('|').map(p => p.trim());

          if (parts.length > 0 && parts[0] !== "") {
            const itemCode = parts[0]; // Contoh: "GDT-001"
            // Jika ada parameter nama di kolom kedua, pakai nama tersebut. Jika tidak, samakan dengan kode.
            const itemName = parts[1] && !parts[1].toLowerCase().startsWith('qty:') ? parts[1] : parts[0]; 

            let pos = [20, 40]; 

            parts.forEach(part => {
              if (part.toLowerCase().startsWith('pos:')) {
                const coords = part.replace(/pos:\s*/i, '').split(',').map(c => parseInt(c.trim(), 10));
                if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) pos = coords;
              }
            });

            currentZone.items.push({
              id: itemCode, // Jadikan kode unik (GDT-001) sebagai ID untuk relasi DB
              name: itemName, // Menyimpan nama aslinya (iPhone 15 Pro Max)
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

  const handleAiSend = async () => {
    const q = chatInput.trim();
    if (!q || isAiLoading) return;
  
    setChatInput('');
    setAiMessages(prev => [...prev, { sender: 'user', text: q }]);
    setIsAiLoading(true);
  
    try {
      const result = await sendLayoutCommand(q);
  
      setAiMessages(prev => [...prev, {
        sender: 'ai',
        text: result.answer || 'Tidak ada jawaban.',
        intent: result.intent
      }]);
  
      // Jika ada markdown baru dari AI, update canvas langsung
      if (result.success && result.updatedMarkdown) {
        setMarkdownCode(result.updatedMarkdown);
        // Tandai perlu di-save
        setAiMessages(prev => [...prev, {
          sender: 'ai',
          text: '💾 Layout diperbarui di editor. Klik **Save Changes** untuk menyimpan ke database.'
        }]);
      }
  
    } catch (err) {
      setAiMessages(prev => [...prev, {
        sender: 'ai',
        text: 'Gagal menghubungi AI server. Pastikan Flask (inference.py) sedang berjalan.',
        intent: 'error'
      }]);
    } finally {
      setIsAiLoading(false);
      setTimeout(() => aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  // ==========================================
  // HANDLER SAVE CHANGES (SUDAH DIPERBAIKI 🚀)
  // ==========================================
  const handleSaveChanges = async () => {
    try {
      if (!projectId) {
        alert("Waduh, ID Proyek belum termuat sempurna. Coba refresh halaman, bro.");
        return;
      }

      // Mengekstrak struktur objek item secara lengkap agar lolos filter backend & inventory database
      const extractedItems = zones.flatMap(zone => 
        (zone.items || []).map(item => ({
          item_id: item.id, // Kode unik, misal: GDT-001
          name: item.name,  // Nama barang, misal: iPhone 15 Pro Max
          zone: zone.name,
          location_x: item.pos[0],
          location_y: item.pos[1]
        }))
      );

      await axios.post(`http://localhost:5000/api/markdown/save`, { 
        markdown: markdownCode,
        projectId: projectId,
        fileId: currentFileId,
        items: extractedItems
      }, getAuthHeader());

      alert('Layout berhasil disimpan & Sinkronisasi file sukses! 🚀');
    } catch (error) {
      console.error("Detail Error Simpan:", error);
      alert('Gagal menyimpan perubahan. Cek kembali koneksi backend.');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
    {!fileIdFromUrl && (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-gray-500 text-sm font-medium">Tidak ada file yang dipilih.</p>
        <a href="/markdown" className="px-4 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 transition-colors">
          Pilih File di Markdown Files
        </a>
      </div>
    )}
    {fileIdFromUrl && <>
      {/* Top Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
          {currentFilename}
        </h1>

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
        <div className="flex bg-gray-100 border-b border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 justify-between items-center">
        <span className="truncate">{currentFilename}</span>
        <button
          onClick={() => setShowTutorial(true)}
          className="ml-2 shrink-0 px-2 py-0.5 bg-white border border-gray-300 text-gray-500 rounded text-xs hover:bg-gray-50 hover:text-green-700 hover:border-green-400 transition-colors"
        >
          ? Sintaks
        </button>
      </div>
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
                    <Group key={zone.id || idx} x={Number(zone.x) || 0} y={Number(zone.y) || 0}>
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
                          x={item.pos ? Number(item.pos[0]) : 0} 
                          y={item.pos ? Number(item.pos[1]) : 0}
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

    {/* Right Side: AI Layout Assistant Panel */}
    <div className={`${activeTab === 'ai' ? 'flex' : 'hidden'} md:flex md:w-[240px] bg-white border border-gray-200 rounded-lg flex-col shadow-sm shrink-0 w-full h-full`}>
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
            <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
              <Sparkles size={16} /> Layout AI
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 font-bold rounded-full">
              TensorFlow
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 bg-white overflow-y-auto flex flex-col gap-3">
            {aiMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-2.5 text-xs leading-relaxed rounded-2xl whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-green-700 text-white rounded-tr-sm'
                    : msg.intent === 'error'
                    ? 'bg-red-50 text-red-600 border border-red-100 rounded-tl-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.text.split('**').map((part, i) =>
                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                  )}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-400 text-xs p-2.5 rounded-2xl rounded-tl-sm animate-pulse">
                  Memproses...
                </div>
              </div>
            )}
            <div ref={aiBottomRef} />
          </div>

          {/* Suggested commands */}
          {aiMessages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-col gap-1">
              {[
                'pindahkan ITEM-01 ke zona Rak B',
                'resize zona Default Zone 400x300',
                'update posisi ITEM-01 ke 50, 80'
              ].map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => { setChatInput(cmd); }}
                  className="text-left text-[10px] text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-lg hover:bg-green-100 transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
              placeholder="Ketik perintah layout..."
              disabled={isAiLoading}
              className="flex-1 bg-transparent text-xs outline-none border border-gray-300 rounded-xl px-3 py-1.5 focus:border-green-500 disabled:opacity-50"
            />
            <button
              onClick={handleAiSend}
              disabled={isAiLoading || !chatInput.trim()}
              className="bg-green-700 text-white p-1.5 rounded-lg hover:bg-green-800 transition-colors disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
        </div>

{/* MODAL TUTORIAL SINTAKS */}
{showTutorial && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
        <div>
          <h2 className="text-base font-bold text-gray-800">Panduan Sintaks .md</h2>
          <p className="text-xs text-gray-400 mt-0.5">Format penulisan file denah gudang</p>
        </div>
        <button onClick={() => setShowTutorial(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 text-lg leading-none">&times;</button>
      </div>

      <div className="p-6 space-y-6">

        {/* STRUKTUR UMUM */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Struktur File</p>
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 leading-6">
            <span className="text-yellow-400"># [Room]</span> Nama Gudang (W: 800, H: 600){'\n'}
            {'\n'}
            <span className="text-blue-400">## [Zone]</span> Nama Zona | W: 300 | H: 200 | X: 50 | Y: 50{'\n'}
            <span className="text-green-400">- KODE-001</span> | Nama Item | qty: 10 | unit_value: 50000 | pos: 30, 45{'\n'}
            <span className="text-green-400">- KODE-002</span> | Nama Item 2 | qty: 5 | unit_value: 20000 | pos: 60, 45
          </div>
        </div>

        {/* ROOM */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded"># ROOM</span>
            <span className="text-xs text-gray-500">Wajib ada 1 per file, di baris pertama</span>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-yellow-300 mb-2">
            # [Room] Gudang Utama (W: 800, H: 600)
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="bg-gray-50 rounded-lg p-2"><span className="font-bold text-gray-700">W</span> — Lebar ruangan (px)</div>
            <div className="bg-gray-50 rounded-lg p-2"><span className="font-bold text-gray-700">H</span> — Tinggi ruangan (px)</div>
          </div>
        </div>

        {/* ZONE */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">## ZONE</span>
            <span className="text-xs text-gray-500">Bisa banyak zona per file</span>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-blue-300 mb-2">
            ## [Zone] Rak A | W: 300 | H: 200 | X: 50 | Y: 50
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="bg-gray-50 rounded-lg p-2"><span className="font-bold text-gray-700">W</span> — Lebar zona (px)</div>
            <div className="bg-gray-50 rounded-lg p-2"><span className="font-bold text-gray-700">H</span> — Tinggi zona (px)</div>
            <div className="bg-gray-50 rounded-lg p-2"><span className="font-bold text-gray-700">X</span> — Posisi horizontal zona</div>
            <div className="bg-gray-50 rounded-lg p-2"><span className="font-bold text-gray-700">Y</span> — Posisi vertikal zona</div>
          </div>
        </div>

        {/* ITEM */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">- ITEM</span>
            <span className="text-xs text-gray-500">Ditulis di dalam zona, awali dengan strip -</span>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-green-300 mb-2">
            - GDT-001 | iPhone 15 Pro | qty: 10 | unit_value: 15000000 | pos: 30, 45
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="bg-gray-50 rounded-lg p-2"><span className="font-bold text-gray-700">Kolom 1</span> — Kode unik item</div>
            <div className="bg-gray-50 rounded-lg p-2"><span className="font-bold text-gray-700">Kolom 2</span> — Nama item</div>
            <div className="bg-gray-50 rounded-lg p-2"><span className="font-bold text-gray-700">qty</span> — Jumlah stok</div>
            <div className="bg-gray-50 rounded-lg p-2"><span className="font-bold text-gray-700">unit_value</span> — Harga per unit (Rp)</div>
            <div className="bg-gray-50 rounded-lg p-2 col-span-2"><span className="font-bold text-gray-700">pos</span> — Posisi X, Y item <span className="text-gray-400">di dalam zona</span></div>
          </div>
        </div>

        {/* CONTOH LENGKAP */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contoh Lengkap</p>
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs leading-6">
            <span className="text-yellow-400"># [Room]</span><span className="text-slate-300"> Gudang Hub Bandung (W: 800, H: 600)</span>{'\n'}
            {'\n'}
            <span className="text-blue-400">## [Zone]</span><span className="text-slate-300"> Rak Elektronik | W: 300 | H: 200 | X: 50 | Y: 50</span>{'\n'}
            <span className="text-green-400">- GDT-001</span><span className="text-slate-300"> | iPhone 15 Pro | qty: 10 | unit_value: 15000000 | pos: 30, 45</span>{'\n'}
            <span className="text-green-400">- GDT-002</span><span className="text-slate-300"> | MacBook Air M2 | qty: 5 | unit_value: 18000000 | pos: 60, 45</span>{'\n'}
            {'\n'}
            <span className="text-blue-400">## [Zone]</span><span className="text-slate-300"> Rak Aksesoris | W: 200 | H: 150 | X: 400 | Y: 50</span>{'\n'}
            <span className="text-green-400">- AKS-001</span><span className="text-slate-300"> | Charger USB-C | qty: 30 | unit_value: 250000 | pos: 30, 40</span>
          </div>
        </div>

        {/* TIPS */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-xs text-green-800 space-y-1">
          <p className="font-bold mb-1">💡 Tips</p>
          <p>• Kode item harus unik per file (misal: GDT-001, AKS-002)</p>
          <p>• Posisi <span className="font-mono">pos:</span> dihitung relatif terhadap pojok kiri atas zona</p>
          <p>• Setelah mengedit, klik <span className="font-semibold">Save Changes</span> untuk menyimpan ke database</p>
          <p>• Preview 2D otomatis terupdate saat mengetik</p>
        </div>

      </div>

      <div className="px-6 pb-5">
        <button onClick={() => setShowTutorial(false)} className="w-full py-2.5 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 transition-colors">
          Mengerti, Tutup
        </button>
      </div>
    </div>
  </div>
)}

</>}
</div>
  );
}