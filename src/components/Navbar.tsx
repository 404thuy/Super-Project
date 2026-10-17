import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, History, User as UserIcon, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
      <header className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-8 pt-3 sm:pt-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 shadow-lg shadow-purple-500/5 flex items-center justify-between transition-all">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    LoveCard
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 uppercase">
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

      {/* Sleek Mobile Bottom Navigation Bar: Only Trang chủ, Mẫu thiệp, Lịch sử */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 px-6 py-2 shadow-2xl flex items-center justify-around">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            location.pathname === '/' ? 'text-rose-600 font-bold' : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <Heart className={`w-5 h-5 ${location.pathname === '/' ? 'fill-rose-500' : ''}`} />
          <span className="text-[10px]">Trang chủ</span>
        </Link>

        <Link
          to="/templates"
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            location.pathname === '/templates' ? 'text-purple-600 font-bold' : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px]">Mẫu thiệp</span>
        </Link>

        <Link
          to="/history"
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            location.pathname === '/history' || location.pathname === '/dashboard'
              ? 'text-purple-600 font-bold'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px]">Lịch sử</span>
        </Link>
      </nav>
    </>
  );
}
