import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHistory, getMe } from '../api';
import Navbar from '../components/Navbar';

const categoryColor = (c) => ({
  Advanced: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-amber-100 text-amber-700 border-amber-200',
}[c] || 'bg-red-100 text-red-700 border-red-200');

const categoryLabel = (c) => ({ Advanced: 'Advanced', Intermediate: 'Intermediate' }[c] || 'Beginner');

const formatDate = (s) =>
  new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    getMe()
      .then((res) => {
        setUser(res.data);
        return getHistory(res.data.email);
      })
      .then((res) => setHistory(res.data.attempts || []))
      .catch(() => setError('Gagal memuat riwayat.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10 w-full">

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="w-9 h-9 border-2 border-gray-200 border-t-brand-600 rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Memuat riwayat...</span>
          </div>
        ) : error ? (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
        ) : !user || history.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
            <p className="text-slate-700 font-semibold">Belum ada riwayat quiz</p>
            <p className="text-sm text-slate-400 mt-1 mb-5">Selesaikan quiz pertama Anda untuk melihat hasilnya di sini.</p>
            <Link to="/quiz" className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm">
              Mulai Quiz
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {history.map((h) => (
              <div key={h.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-brand-400 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{h.quiz_name}</div>
                    <div className="text-sm text-slate-400 mt-0.5">{formatDate(h.created_at)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-extrabold text-brand-600">{h.percentage?.toFixed(0)}%</div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border mt-1 ${categoryColor(h.category)}`}>
                      {categoryLabel(h.category)}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Progres</span>
                    <span>{h.score}/{h.max_score} poin</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-600 rounded-full" style={{ width: `${h.percentage}%` }} />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Link to={`/result/${h.id}`} className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                    Lihat Detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
