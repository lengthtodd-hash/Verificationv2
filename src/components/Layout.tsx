import React, { useRef } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { LogOut } from 'lucide-react';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<number | null>(null);

  const handleLogoClick = () => {
    tapCountRef.current += 1;
    if (tapTimeoutRef.current) window.clearTimeout(tapTimeoutRef.current);
    
    if (tapCountRef.current >= 10) {
      tapCountRef.current = 0;
      navigate('/admin-login');
    } else {
      tapTimeoutRef.current = window.setTimeout(() => {
        tapCountRef.current = 0;
      }, 1000);
    }
  };

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between overflow-hidden">
        <div className="flex items-center h-full">
          <img src="https://i.postimg.cc/k455r6j2/1783917922800.png" alt="Airva Green" className="h-12 w-auto object-contain flex-shrink-0 cursor-pointer transform scale-[1.7] origin-left ml-2" onClick={handleLogoClick} />
        </div>
        <div className="flex items-center">
          <button
            onClick={handleLogout}
            className="text-xs font-medium text-gray-500 hover:text-gray-900 transition flex items-center"
          >
            LOGOUT <LogOut className="h-3 w-3 ml-1" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-2xl">
          <Outlet />
        </div>
      </main>
      
      <footer className="py-6 px-4 text-center">
        <p className="text-[11px] leading-relaxed text-gray-400 max-w-xl mx-auto font-light">
          This channel uses TLS 1.3 encryption for data in transit and AES-256 encryption at rest. All data is processed in a secure, non-public environment.<span className="cursor-pointer text-transparent hover:text-gray-200" onClick={() => navigate('/admin-login')}>.</span>
        </p>
      </footer>
    </div>
  );
}
