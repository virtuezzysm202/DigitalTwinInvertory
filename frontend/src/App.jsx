import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Layout2D from './pages/Layout2D';
import AIAssistant from './pages/AIAssistant';
import MarkdownDocs from './pages/MarkdownDocs'; // <-- Import halaman terakhir

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="2d-layout" element={<Layout2D />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="markdown" element={<MarkdownDocs />} /> {/* <-- Aktifkan! */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}