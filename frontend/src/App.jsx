import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Layout2D from "./pages/Layout2D";
import AIAssistant from "./pages/AIAssistant";
import MarkdownDocs from "./pages/MarkdownDocs";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect awal ke login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Route tanpa layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Route dengan MainLayout */}
        <Route path="/app" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="2d-layout" element={<Layout2D />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="markdown" element={<MarkdownDocs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}