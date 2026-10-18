import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, History, User as UserIcon, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { soundFx } from '../utils/soundEffects';

export default function Navbar() {
  const location = useLocation();
  const { user, openAuthModal, openSettingsModal, logout } = useAuth();
  const [profileDropdown, setProfileDropdown] = useState(false);

  const navLinks = [
    { to: '/', label: 'Trang Chủ', icon: <Heart className="w-4 h-4" /> },
    { to: '/templates', label: 'Kho Mẫu', icon: <Sparkles className="w-4 h-4" /> },
    { to: '/history', label: 'Lịch Sử', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Top Header for Desktop & Mobile Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 px-2.5 sm:px-8 pt-2 sm:pt-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-xl sm:rounded-2xl px-3 sm:px-6 py-1.5 sm:py-3 shadow-md shadow-purple-500/5 flex items-center justify-between transition-all">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base sm:text-xl tracking-tight bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    LoveCard
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 uppercase">
                    20/10
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block">
                  Thiệp Tương Tác Cảm Xúc
                </p>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to || (link.to === '/history' && location.pathname === '/dashboard');
                return (
                  <Link key={link.to} to={link.to}>
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-white text-purple-700 shadow-sm shadow-purple-500/10'
                          : 'text-slate-600 hover:text-purple-600 hover:bg-white/60'
                      }`}
                    >
                      <span className={isActive ? 'text-rose-500' : 'text-slate-400'}>
                        {link.icon}
                      </span>
                      <span>{link.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Auth / Profile Area */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdown(!profileDropdown)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 transition-colors border border-slate-200"
                  >
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="w-7 h-7 rounded-full object-cover border border-rose-300"
                    />
                    <span className="text-xs font-bold hidden sm:inline max-w-[120px] truncate">
                      {user.displayName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
                  </button>

                  <AnimatePresence>
                    {profileDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
                          onClick={() => setProfileDropdown(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50"
                        >
                          <div className="px-3 py-2.5 border-b border-slate-100">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {user.displayName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setProfileDropdown(false);
                              openSettingsModal();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors mt-1"
                          >
                            <Settings className="w-4 h-4 text-purple-600" />
                            <span>Cài đặt tài khoản</span>
                          </button>
                          <button
                            onClick={() => {
                              setProfileDropdown(false);
                              logout();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Đăng xuất</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Đăng Nhập</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Floating Frosted Glass Mobile Bottom Navigation Capsule (Slim, Sleek & Compact) */}
      <div className="md:hidden fixed bottom-2.5 inset-x-0 z-40 px-3 pointer-events-none flex justify-center">
        <nav className="pointer-events-auto w-full max-w-[260px] bg-white/85 backdrop-blur-2xl border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.10)] rounded-full p-1 flex items-center justify-between ring-1 ring-black/5">
          {/* Trang chủ */}
          <Link
            to="/"
            onClick={() => soundFx.playPinClick()}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-full transition-all duration-200 active:scale-95 ${
              location.pathname === '/'
                ? 'bg-rose-100/90 text-rose-600 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                location.pathname === '/' ? 'fill-rose-500 scale-105' : ''
              }`}
            />
            <span className="text-[9px] leading-none mt-0.5">Trang chủ</span>
          </Link>

          {/* Mẫu thiệp */}
          <Link
            to="/templates"
            onClick={() => soundFx.playPinClick()}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-full transition-all duration-200 active:scale-95 ${
              location.pathname === '/templates'
                ? 'bg-purple-100/90 text-purple-700 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Sparkles
              className={`w-4 h-4 transition-transform ${
                location.pathname === '/templates' ? 'scale-105' : ''
              }`}
            />
            <span className="text-[9px] leading-none mt-0.5">Mẫu thiệp</span>
          </Link>

          {/* Lịch sử */}
          <Link
            to="/history"
            onClick={() => soundFx.playPinClick()}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-full transition-all duration-200 active:scale-95 ${
              location.pathname === '/history' || location.pathname === '/dashboard'
                ? 'bg-purple-100/90 text-purple-700 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <History
              className={`w-4 h-4 transition-transform ${
                location.pathname === '/history' || location.pathname === '/dashboard'
                  ? 'scale-105'
                  : ''
              }`}
            />
            <span className="text-[9px] leading-none mt-0.5">Lịch sử</span>
          </Link>
        </nav>
      </div>
    </>
  );
}
