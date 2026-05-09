import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Layout2D from './pages/Layout2D';
import AIAssistant from './pages/AIAssistant';
import MarkdownDocs from './pages/MarkdownDocs';
import Login from './pages/Login';
import Register from './pages/Register';

// Komponen Satpam (Protected Route)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    // Kalau gak ada token, tendang ke login
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Jalur Publik (Gak perlu Login) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 2. Jalur Terproteksi (Semua yang pakai Sidebar/Header) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="2d-layout" element={<Layout2D />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="markdown" element={<MarkdownDocs />} />
        </Route>

        {/* 3. Jika user ngetik asal, lempar ke dashboard (yang nanti akan dicek tokennya) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}