import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', full_name: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Pendaftaran gagal. Coba lagi.');
      setForm(prev => ({ ...prev, password: '' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-10 shadow-sm animate-slideUp">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Buat Akun Baru</h1>
          <p className="text-sm text-slate-500 mt-1">Bergabung dan uji kemampuan teknis Anda</p>
        </div>

        {error && (
          <div key={error} className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-shake">
            <div className="w-8 h-8 rounded-full bg-white text-rose-500 flex items-center justify-center shrink-0 shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div className="text-sm font-bold text-rose-900">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
            <input
              id="register-fullname"
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
              placeholder="Masukkan nama lengkap"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
            <input
              id="register-email"
              type="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
              placeholder="Masukkan alamat email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</label>
            <input
              id="register-username"
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
              placeholder="Buat username unik"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
            <input
              id="register-password"
              type="password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
              placeholder="Minimal 6 karakter"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button
            id="btn-register"
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors mt-1"
          >
            {loading ? 'Mendaftarkan...' : 'Daftar'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-500">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
