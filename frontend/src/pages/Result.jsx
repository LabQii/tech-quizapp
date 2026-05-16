import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { getResult, exportPdf } from '../api';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const categoryLabel = (c) => ({ Advanced: 'Advanced', Intermediate: 'Intermediate' }[c] || 'Beginner');
const categoryColor = (c) => ({ Advanced: 'bg-emerald-100 text-emerald-700 border-emerald-200', Intermediate: 'bg-amber-100 text-amber-700 border-amber-200' }[c] || 'bg-red-100 text-red-700 border-red-200');

export default function Result() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    getResult(id)
      .then((res) => setResult(res.data))
      .catch(() => setError('Hasil tidak ditemukan atau sesi telah habis.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const res = await exportPdf(Number(id));
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Technical-Test-Hasil-${result?.name || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setToast({ show: true, message: 'PDF berhasil diunduh!', type: 'success' });
    } catch {
      setToast({ show: true, message: 'Gagal mengunduh PDF. Pastikan server berjalan.', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-2 border-gray-200 border-t-brand-600 rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Memuat hasil...</span>
      </div>
    </div>
  );

  if (error || !result) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
        <Link to="/quiz" className="inline-block mt-4 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors">Kembali ke Quiz</Link>
      </div>
    </div>
  );

  const correct = result.answers?.filter((a) => a.is_correct).length || 0;
  const wrong = (result.answers?.length || 0) - correct;

  const donutData = {
    labels: ['Benar', 'Salah'],
    datasets: [{ data: [correct, wrong], backgroundColor: ['#10b981', '#ef4444'], borderColor: ['#059669', '#dc2626'], borderWidth: 1 }],
  };
  const donutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#64748b', font: { family: 'Inter', size: 12 }, padding: 16 } },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} soal` } },
    },
  };

  const barData = {
    labels: result.answers?.map((_, i) => `Soal ${i + 1}`) || [],
    datasets: [
      { label: 'Poin Diraih', data: result.answers?.map((a) => a.earned_point) || [], backgroundColor: result.answers?.map((a) => a.is_correct ? '#10b981' : '#ef4444') || [], borderRadius: 4, borderSkipped: false },
      { label: 'Poin Maksimal', data: result.answers?.map((a) => a.point) || [], backgroundColor: 'rgba(5,150,105,0.12)', borderRadius: 4, borderSkipped: false },
    ],
  };
  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#64748b', font: { family: 'Inter', size: 11 }, padding: 12 } } },
    scales: {
      x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
      y: { ticks: { color: '#94a3b8', font: { size: 11 }, stepSize: 5 }, grid: { color: 'rgba(0,0,0,0.04)' }, beginAtZero: true },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10 w-full animate-slideUp">

        <div className="relative result-hero bg-white border border-gray-200 rounded-2xl p-6 sm:p-12 text-center shadow-sm mb-6 overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Skor Akhir Anda</p>
          <div className="text-5xl sm:text-7xl font-extrabold text-brand-600 leading-none mb-3">
            {result.percentage?.toFixed(0)}%
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border ${categoryColor(result.category)}`}>
            {categoryLabel(result.category)}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-8">
            {[
              { label: 'Poin Diraih', value: result.score },
              { label: 'Poin Maksimal', value: result.max_score },
              { label: 'Total Soal', value: result.answers?.length || 0 },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-slate-900">{s.value}</div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-6 sm:mt-4">{result.name} · {result.email}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-5">Visualisasi Performa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs text-slate-400 text-center mb-3">Distribusi Jawaban</p>
              <div className="relative h-48">
                <Doughnut data={donutData} options={donutOptions} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4 text-center pointer-events-none">
                  <div className="text-2xl font-extrabold text-slate-900">{correct}</div>
                  <div className="text-xs text-slate-400">Benar</div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 text-center mb-3">Skor per Soal</p>
              <div className="h-48"><Bar data={barData} options={barOptions} /></div>
            </div>
          </div>
        </div>

        {result.insights?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm mb-6 animate-slideUp">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Analisis Performa</h3>
            <div className="flex flex-col gap-4">
              {result.insights.map((insight, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0 group-hover:scale-125 transition-transform" />
                  <span className="text-[15px] text-slate-600 leading-relaxed font-medium">
                    {insight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.answers?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Rincian Per Soal</h3>
            <div className="flex flex-col gap-2.5">
              {result.answers.map((ans, i) => (
                <div key={i} className={`p-4 rounded-xl border ${ans.is_correct ? 'bg-emerald-50/50 border-emerald-200/60' : 'bg-red-50/50 border-red-200/60'}`}>
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div className="text-sm text-slate-700 flex-1">
                      <span className="font-semibold text-slate-400 mr-2">{i + 1}.</span>
                      {ans.question_text}
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 ${ans.is_correct ? 'text-emerald-600' : 'text-red-500'}`}>
                      {ans.earned_point}/{ans.point} poin
                    </span>
                  </div>
                  <div className="flex gap-5 flex-wrap text-xs">
                    <span className={ans.is_correct ? 'text-emerald-600' : 'text-red-500'}>
                      Jawaban Anda: <strong>{ans.user_answer || '—'}</strong>
                    </span>
                    {!ans.is_correct && (
                      <span className="text-emerald-600">
                        Jawaban Benar: <strong>{ans.correct_answer}</strong>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          <button id="btn-export-pdf" className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-xl transition-colors" onClick={handleExportPDF} disabled={exporting}>
            {exporting ? 'Mengunduh...' : 'Unduh PDF'}
          </button>
          <Link to="/quiz" className="px-8 py-3 border border-gray-300 text-slate-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-center">Coba Lagi</Link>
          <Link to="/history" className="px-8 py-3 border border-gray-300 text-slate-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-center">Riwayat</Link>
        </div>

        {toast.show && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast({ ...toast, show: false })} 
          />
        )}
      </div>
    </div>
  );
}
