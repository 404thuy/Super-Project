import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Landing from './pages/Landing';
import Templates from './pages/Templates';
import Studio from './pages/Studio';
import CardViewer from './pages/CardViewer';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import DatabaseModal from './components/DatabaseModal';
import { AuthProvider, useAuth } from './context/AuthContext';

import ErrorBoundary from './components/ErrorBoundary';

function ModalsContainer() {
  const { isDbModalOpen, closeDbModal } = useAuth();
  return (
    <>
      <AuthModal />
      <SettingsModal />
      <DatabaseModal isOpen={isDbModalOpen} onClose={closeDbModal} />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 text-slate-800">
          <ModalsContainer />
          <AnimatePresence mode="wait">
            <Routes>
            <Route
              path="/"
              element={
                <>
                  <Navbar />
                  <Landing />
                </>
              }
            />
            <Route
              path="/templates"
              element={
                <>
                  <Navbar />
                  <Templates />
                </>
              }
            />
            <Route path="/studio/:templateId" element={<Studio />} />
            <Route path="/card/:cardId/*" element={<CardViewer />} />
            <Route path="/card/:cardId" element={<CardViewer />} />
            <Route path="/card/*" element={<CardViewer />} />
            <Route
              path="/history"
              element={
                <>
                  <Navbar />
                  <Dashboard />
                </>
              }
            />
            <Route
              path="/dashboard"
              element={
                <>
                  <Navbar />
                  <Dashboard />
                </>
              }
            />
          </Routes>
        </AnimatePresence>
      </div>
    </AuthProvider>
  </ErrorBoundary>
  );
}

export default App;
