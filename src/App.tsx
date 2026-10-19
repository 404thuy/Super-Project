import { Routes, Route, useParams } from 'react-router-dom';
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

function StudioRoute() {
  const { templateId } = useParams<{ templateId: string }>();
  return <Studio key={templateId || 'default'} />;
}

function CardViewerRoute() {
  const params = useParams();
  const cardId = params['*']
    ? params.cardId
      ? `${params.cardId}/${params['*']}`
      : params['*']
    : params.cardId;
  return <CardViewer key={cardId || 'default'} />;
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
            <Route path="/studio/:templateId" element={<StudioRoute />} />
            <Route path="/studio" element={<StudioRoute />} />
            <Route path="/card/:cardId/*" element={<CardViewerRoute />} />
            <Route path="/card/:cardId" element={<CardViewerRoute />} />
            <Route path="/card/*" element={<CardViewerRoute />} />
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
