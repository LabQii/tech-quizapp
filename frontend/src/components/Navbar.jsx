import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getMe } from '../api';


export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState(localStorage.getItem('role') || '');
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem('role') || '');
    if (localStorage.getItem('token')) {
      getMe().then(res => setUser(res.data)).catch(() => setUser(null));
    } else {
      setUser(null);
    }
    setIsOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
      isActive(path)
        ? 'text-brand-600 bg-brand-50/80 shadow-sm'
        : 'text-slate-500 hover:text-slate-900 hover:bg-gray-50'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20">
        <Link to="/quiz" className="text-slate-900 font-bold text-lg no-underline tracking-tight hover:opacity-70 transition-opacity">
          Technical Test
        </Link>

        
        <div className="hidden md:flex items-center gap-1.5">
          {role === 'admin' && (
            <Link to="/admin" className={linkClass('/admin')}>Admin</Link>
          )}
          <Link to="/quiz" className={linkClass('/quiz')}>Quiz</Link>
          <Link to="/history" className={linkClass('/history')}>Riwayat</Link>
          
          <div className="h-8 w-px bg-gray-200/60 mx-2"></div>

          {user && (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-2xl border border-transparent">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-900 leading-none">{user.full_name}</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">@{user.username}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-brand-600/10 ring-2 ring-white">
                {user.full_name?.charAt(0)}
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="ml-2 w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-300 group"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>

        
        <div className="flex items-center gap-3 md:hidden">
          {user && (
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white">
              {user.full_name?.charAt(0)}
            </div>
          )}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-slate-600"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isOpen ? <line x1="18" y1="6" x2="6" y2="18"></line> : <line x1="3" y1="12" x2="21" y2="12"></line>}
              {isOpen ? <line x1="6" y1="6" x2="18" y2="18"></line> : <><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></>}
            </svg>
          </button>
        </div>
      </div>

      
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 p-4 flex flex-col gap-2 animate-fadeIn">
          {role === 'admin' && (
            <Link to="/admin" className={linkClass('/admin')}>Dashboard Admin</Link>
          )}
          <Link to="/quiz" className={linkClass('/quiz')}>Daftar Quiz</Link>
          <Link to="/history" className={linkClass('/history')}>Riwayat Saya</Link>
          <div className="h-px bg-gray-100 my-2"></div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Keluar dari Akun
          </button>
        </div>
      )}
    </nav>
  );
}
