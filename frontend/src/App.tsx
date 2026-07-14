import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Meetings } from './pages/Meetings';
import { MeetingDetail } from './pages/MeetingDetail';
import { Import } from './pages/Import';
import { Participants } from './pages/Participants';
import { Tasks } from './pages/Tasks';
import { Analytics } from './pages/Analytics';
import { Exports } from './pages/Exports';
import { Settings } from './pages/Settings';

/**
 * Petit raccourci : toute page protégée est enveloppée dans ProtectedRoute
 * (redirige vers /login si non connecté) puis dans Layout (sidebar, etc.).
 * Évite de répéter la même imbrication sur chaque route.
 */
function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Seule route publique : la page de connexion */}
        <Route path="/login" element={<Login />} />

        {/* Routes protégées : accessibles uniquement si connecté */}
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/meetings" element={<Protected><Meetings /></Protected>} />
        <Route path="/meetings/:id" element={<Protected><MeetingDetail /></Protected>} />
        <Route path="/import" element={<Protected><Import /></Protected>} />
        <Route path="/participants" element={<Protected><Participants /></Protected>} />
        <Route path="/tasks" element={<Protected><Tasks /></Protected>} />
        <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
        <Route path="/exports" element={<Protected><Exports /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
      </Routes>
    </BrowserRouter>
  );
}