import React, { useState } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import { Square, MousePointer2, Save, Undo, Trash2 } from 'lucide-react';

export default function Layout2D() {
  // Data statis untuk bentuk (rak/zona) di dalam kanvas
  const [shapes, setShapes] = useState([
    { id: 'rack-1', x: 50, y: 50, width: 120, height: 40, fill: '#e5e7eb', stroke: '#9ca3af', text: 'Rack A1' },
    { id: 'rack-2', x: 50, y: 120, width: 120, height: 40, fill: '#e5e7eb', stroke: '#9ca3af', text: 'Rack A2' },
    { id: 'zone-1', x: 250, y: 50, width: 200, height: 150, fill: '#dcfce7', stroke: '#22c55e', text: 'Receiving Zone' },
  ]);

  // Fungsi untuk mengupdate posisi saat item digeser
  const handleDragEnd = (e, id) => {
    const newShapes = shapes.map((shape) => {
      if (shape.id === id) {
        return {
          ...shape,
          x: e.target.x(),
          y: e.target.y(),
        };
      }
      return shape;
    });
    setShapes(newShapes);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Editor */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Warehouse Layout Editor</h1>
          <p className="text-sm text-gray-500">Drag and drop zones and racks to map your physical inventory.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm hover:bg-gray-100">
            <Undo size={16} /> Reset
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800">
            <Save size={16} /> Save Layout
          </button>
        </div>
      </div>

      {/* Area Utama Editor */}
      <div className="flex flex-1 gap-4 overflow-hidden min-h-[500px]">
        
        {/* Toolbar Kiri */}
        <div className="w-64 bg-white p-4 rounded-xl border border-gray-100 shadow-sm shrink-0 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">Tools</h3>
          
          <button className="flex items-center gap-3 w-full p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium">
            <MousePointer2 size={18} /> Select & Move
          </button>
          
          <button className="flex items-center gap-3 w-full p-3 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium">
            <Square size={18} /> Add Rack
          </button>

          <button className="flex items-center gap-3 w-full p-3 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium">
            <Square size={18} className="text-green-500 fill-green-100" /> Add Zone
          </button>

          <div className="mt-auto pt-4 border-t border-gray-100">
            <button className="flex items-center justify-center gap-2 w-full p-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">
              <Trash2 size={16} /> Delete Selected
            </button>
          </div>
        </div>

        {/* Area Kanvas Konva */}
        <div className="flex-1 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden relative shadow-inner flex items-center justify-center">
          {/* Stage adalah pembungkus utama kanvas. Ukuran diset fixed sementara untuk kestabilan */}
          <Stage width={800} height={600} className="bg-white shadow-sm border border-gray-200">
            <Layer>
              {shapes.map((shape) => (
                <Group
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  draggable
                  onDragEnd={(e) => handleDragEnd(e, shape.id)}
                >
                  <Rect
                    width={shape.width}
                    height={shape.height}
                    fill={shape.fill}
                    stroke={shape.stroke}
                    strokeWidth={2}
                    cornerRadius={4}
                    shadowColor="black"
                    shadowBlur={5}
                    shadowOpacity={0.1}
                    shadowOffsetY={2}
                  />
                  <Text
                    text={shape.text}
                    fontSize={14}
                    fontFamily="Inter, sans-serif"
                    fill="#374151"
                    width={shape.width}
                    height={shape.height}
                    align="center"
                    verticalAlign="middle"
                  />
                </Group>
              ))}
            </Layer>
          </Stage>
        </div>

      </div>
    </div>
  );
}