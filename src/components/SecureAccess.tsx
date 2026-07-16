import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { KeyRound, Loader2 } from 'lucide-react';
import { api } from '../lib/apiClient';

export function SecureAccess() {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<number | null>(null);

  const handleLogoClick = () => {
    // Hidden URL routing only now for max security.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.employeeLogin(accessCode);
      await login(data.token, data.user);
      navigate('/employee');
    } catch (err: any) {
      setError(err.message || 'Invalid access code');
    } finally {
      setLoading(false);
    }
  };

  // Tucked away admin link - double click the logo or a hidden button?
  // Let's just add a very subtle invisible div or rely on direct URL navigation to /admin-login.
  // We'll also just add a subtle dot in the footer to access admin.

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-6 h-16 flex items-center overflow-hidden">
        <img src="https://i.postimg.cc/k455r6j2/1783917922800.png" alt="Airva Green" className="h-12 w-auto object-contain flex-shrink-0 cursor-pointer transform scale-[1.7] origin-left ml-2" onClick={handleLogoClick} />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="bg-[#fafafa] px-8 pt-12 pb-8 flex flex-col items-center border-b border-gray-100">
            <div className="bg-black rounded-full p-4 mb-6">
              <KeyRound className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-normal text-gray-900 mb-2">Secure Access</h2>
            <p className="text-gray-500 text-sm font-light">Enter your 6-digit access code to proceed.</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="accessCode" className="block text-[11px] font-bold tracking-wider text-gray-500 text-center uppercase mb-4">
                  Access Code
                </label>
                <div className="relative">
                  <input
                    id="accessCode"
                    name="accessCode"
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="block w-full text-center text-3xl tracking-[0.5em] font-light text-gray-900 bg-transparent border-0 border-b border-black focus:ring-0 focus:border-black py-2"
                    style={{ outline: 'none' }}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || accessCode.length !== 6}
                className="w-full flex justify-center items-center py-4 px-4 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'ENTER PORTAL'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="py-6 px-4 text-center">
        <p className="text-[11px] leading-relaxed text-gray-400 max-w-xl mx-auto font-light">
          This channel uses TLS 1.3 encryption for data in transit and AES-256 encryption at rest. All data is processed in a secure, non-public environment.
        </p>
      </footer>
    </div>
  );
}
