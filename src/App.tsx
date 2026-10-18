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
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <AuthModal />
        <SettingsModal />
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
  );
}

export default App;
