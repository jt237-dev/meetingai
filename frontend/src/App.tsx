import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
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
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes wrapped in Layout */}
        <Route
          path="/"
          element={
          <Layout>
              <Dashboard />
            </Layout>
          } />
        
        <Route
          path="/meetings"
          element={
          <Layout>
              <Meetings />
            </Layout>
          } />
        
        <Route
          path="/meetings/:id"
          element={
          <Layout>
              <MeetingDetail />
            </Layout>
          } />
        
        <Route
          path="/import"
          element={
          <Layout>
              <Import />
            </Layout>
          } />
        
        <Route
          path="/participants"
          element={
          <Layout>
              <Participants />
            </Layout>
          } />
        
        <Route
          path="/tasks"
          element={
          <Layout>
              <Tasks />
            </Layout>
          } />
        
        <Route
          path="/analytics"
          element={
          <Layout>
              <Analytics />
            </Layout>
          } />
        
        <Route
          path="/exports"
          element={
          <Layout>
              <Exports />
            </Layout>
          } />
        
        <Route
          path="/settings"
          element={
          <Layout>
              <Settings />
            </Layout>
          } />
        
      </Routes>
    </BrowserRouter>);

}