import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

// Nanti kita akan buat file-file ini di folder pages
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Halaman-halaman ini akan masuk ke dalam Outlet di MainLayout */}
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<div>Inventory Page</div>} />
          <Route path="2d-layout" element={<div>2D Layout Page</div>} />
          <Route path="ai-assistant" element={<div>AI Assistant Page</div>} />
          <Route path="markdown" element={<div>Markdown Page</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}