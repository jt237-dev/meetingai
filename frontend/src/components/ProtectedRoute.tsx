import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../lib/api';

/**
 * Enveloppe les pages protégées : si l'utilisateur n'est pas connecté,
 * il est redirigé vers /login. Sinon, la page s'affiche normalement.
 *
 * Usage dans App.tsx :
 *   <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    // `state` mémorise la page demandée, pour pouvoir y revenir après connexion.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}