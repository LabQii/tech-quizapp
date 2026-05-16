import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuizzes, getQuiz, submitQuiz, getMe } from '../api';
import Navbar from '../components/Navbar';


export default function Quiz() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [doubtfulAnswers, setDoubtfulAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('list');

  const [modal, setModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'info'
  });

  const showAlert = (title, message) => {
    setModal({ show: true, title, message, onConfirm: null, type: 'info' });
  };

  const showConfirm = (title, message, onConfirm) => {
    setModal({ show: true, title, message, onConfirm, type: 'confirm' });
  };

  const closeModal = () => setModal({ ...modal, show: false });

  useEffect(() => {
    getQuizzes()
      .then((res) => setQuizzes(res.data.quizzes || []))
      .catch(() => setError('Gagal memuat daftar quiz. Pastikan server backend berjalan.'))
      .finally(() => setLoading(false));

    getMe()
      .then((res) => setUser(res.data))
      .catch(() => {});
  }, []);

  const handleSelectQuiz = async (quizId) => {
    setLoading(true);
    setError('');
    try {
      const res = await getQuiz(quizId);
      const fetchedQuestions = res.data.questions || [];
      if (fetchedQuestions.length === 0) {
        showAlert('Quiz Belum Siap', 'Maaf, belum ada soal yang ditambahkan untuk quiz ini oleh admin.');
        return;
      }
      setQuiz(res.data.quiz);
      setQuestions(fetchedQuestions);
      setAnswers({});
      setDoubtfulAnswers({});
      setCurrentIndex(0);
      setStep('quiz');
    } catch {
      setError('Gagal memuat detail quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qId, option) =>
    setAnswers((prev) => ({ ...prev, [String(qId)]: option }));

  const toggleDoubtful = (qId) => {
    setDoubtfulAnswers((prev) => ({
      ...prev,
      [String(qId)]: !prev[String(qId)],
    }));
  };

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  const handleSubmit = async () => {
    if (answeredCount < questions.length) {
      showAlert('Periksa Kembali', `Masih ada ${questions.length - answeredCount} soal yang belum dijawab. Mohon lengkapi semua jawaban sebelum mengumpulkan.`);
      return;
    }
    
    const hasDoubtful = Object.values(doubtfulAnswers).some(v => v);
    if (hasDoubtful) {
      showConfirm(
        'Konfirmasi Pengumpulan', 
        'Masih ada soal yang ditandai ragu-ragu. Apakah Anda yakin ingin tetap mengumpulkan jawaban sekarang?',
        executeSubmit
      );
    } else {
      showConfirm(
        'Kumpulkan Jawaban', 
        'Apakah Anda yakin ingin mengakhiri quiz dan mengumpulkan semua jawaban?',
        executeSubmit
      );
    }
  };

  const executeSubmit = async () => {
    closeModal();
    setSubmitting(true);
    try {
      const res = await submitQuiz({ 
        quiz_id: quiz.id, 
        email: user?.email, 
        name: user?.full_name, 
        answers 
      });
      navigate(`/result/${res.data.attempt_id}`);
    } catch {
      setError('Gagal mengirim jawaban. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center flex-1 py-24 gap-3">
      <div className="w-9 h-9 border-2 border-gray-200 border-t-brand-600 rounded-full animate-spin" />
      <span className="text-sm text-slate-400">Memuat data...</span>
    </div>
  );

  const CustomModal = () => {
    if (!modal.show) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fadeIn" onClick={closeModal} />
        <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 animate-slideUp overflow-hidden border border-white/20">
          <div className="mb-8 text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${modal.type === 'confirm' ? 'bg-amber-50 text-amber-500' : 'bg-brand-50 text-brand-600'}`}>
              {modal.type === 'confirm' ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
              )}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">{modal.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed px-2">{modal.message}</p>
          </div>
          <div className="flex gap-3">
            {modal.type === 'confirm' ? (
              <>
                <button className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-400 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100" onClick={closeModal}>Batal</button>
                <button className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 shadow-xl shadow-brand-600/20 transition-all transform active:scale-95" onClick={modal.onConfirm}>Ya, Lanjutkan</button>
              </>
            ) : (
              <button className="w-full px-6 py-3.5 rounded-2xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 shadow-xl shadow-brand-600/20 transition-all transform active:scale-95" onClick={closeModal}>Mengerti</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <LoadingSpinner />
    </div>
  );

  if (error && step !== 'list') return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10 w-full">
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-4">{error}</div>
        <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-slate-600 hover:bg-gray-50 transition-colors" onClick={() => { setError(''); setStep('list'); }}>
          Kembali ke Daftar Quiz
        </button>
      </div>
    </div>
  );

  if (step === 'list') return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-4 w-full">
        {error && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-white text-rose-500 flex items-center justify-center shrink-0 shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div className="text-sm font-bold text-rose-900">{error}</div>
          </div>
        )}

        {quizzes.length === 0 && !error ? (
          <div className="mt-10 text-center py-20 bg-white border border-gray-200 rounded-2xl">
            <p className="text-slate-700 font-semibold">Belum ada quiz tersedia</p>
            <p className="text-sm text-slate-400 mt-1">Silakan minta admin untuk menambahkan quiz baru.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            {quizzes.map((q, i) => {
              const gradients = [
                'linear-gradient(135deg, #059669 0%, #0d9488 50%, #10b981 100%)',
                'linear-gradient(225deg, #065f46 0%, #059669 50%, #10b981 100%)',
                'linear-gradient(to right, #047857, #10b981)',
                'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
                'linear-gradient(45deg, #065f46 0%, #0d9488 100%)'
              ];
              const decorationPos = [
                '-right-5 -top-5',
                '-left-5 -bottom-5',
                '-right-10 -bottom-10',
                '-left-10 -top-10',
                'right-1/4 -top-10'
              ];
              return (
                <div
                  key={q.id}
                  className="border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-brand-500 transition-all shadow-sm animate-slideUp"
                  onClick={() => handleSelectQuiz(q.id)}
                >
                  <div className="relative h-40 flex flex-col justify-between p-7 overflow-hidden"
                    style={{ background: gradients[i % gradients.length] }}
                  >
                    <div className={`absolute ${decorationPos[i % decorationPos.length]} w-44 h-44 rounded-full`} style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <button
                      className="absolute top-3 right-3 p-1.5 rounded text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>
                    <h3 className="text-xl font-bold text-white max-w-[65%] leading-snug" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      {q.name}
                    </h3>
                    <div className="flex items-center gap-2 text-white/85 text-xs font-medium">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-white/20">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </span>
                      {q.question_count || 0} Soal
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <CustomModal />
      <div className="max-w-6xl mx-auto px-6 py-10 w-full flex flex-col md:flex-row gap-8">
        
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm animate-fadeIn relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
              <div>
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">
                  Soal {currentIndex + 1} dari {questions.length}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{quiz?.name}</h2>
              </div>
              <div className="flex flex-col sm:items-end">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1.5">Progress</div>
                <div className="w-full sm:w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="progress-fill h-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className="text-base sm:text-lg font-semibold text-slate-800 leading-relaxed mb-8">
              {currentQuestion?.text}
            </div>

            <div className="flex flex-col gap-3">
              {currentQuestion?.options && Object.entries(currentQuestion.options).map(([key, val]) => (
                <button
                  key={key}
                  id={`q${currentQuestion.id}-opt-${key}`}
                  onClick={() => handleAnswer(currentQuestion.id, key)}
                  className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl text-left border transition-all ${
                    answers[String(currentQuestion.id)] === key
                      ? 'border-brand-600 bg-brand-50 shadow-sm ring-1 ring-brand-600'
                      : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-xs sm:text-sm font-bold flex-shrink-0 transition-colors ${
                    answers[String(currentQuestion.id)] === key
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-slate-400 border border-gray-200'
                  }`}>
                    {key}
                  </span>
                  <span className={`text-sm font-medium ${answers[String(currentQuestion.id)] === key ? 'text-slate-900' : 'text-slate-600'}`}>
                    {val}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <button 
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-gray-100 transition-all disabled:opacity-30 border border-transparent hover:border-gray-200"
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  <span className="sm:inline">Kembali</span>
                </button>

                <button 
                  onClick={() => toggleDoubtful(currentQuestion.id)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    doubtfulAnswers[String(currentQuestion.id)]
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-amber-500 text-amber-600 hover:bg-amber-50'
                  }`}
                  title={doubtfulAnswers[String(currentQuestion.id)] ? 'Ragu-ragu Terpasang' : 'Tandai Ragu-ragu'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  <span className="sm:hidden">Ragu</span>
                  <span className="hidden sm:inline">
                    {doubtfulAnswers[String(currentQuestion.id)] ? 'Ragu-ragu Terpasang' : 'Tandai Ragu-ragu'}
                  </span>
                </button>
              </div>

              {currentIndex < questions.length - 1 ? (
                <button 
                  className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-md shadow-brand-600/20"
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                >
                  Selanjutnya
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              ) : (
                <button 
                  className="flex items-center justify-center gap-2 px-8 py-3 sm:py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Mengirim...' : 'Selesai & Kumpulkan'}
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 px-4 italic">*) Jawaban otomatis tersimpan saat Anda memilih salah satu opsi.</p>
        </div>

        <div className="w-full md:w-80 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm sticky top-24">
            <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Navigasi Soal
            </h3>
            
            <div className="grid grid-cols-5 gap-3 mb-8">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[String(q.id)];
                const isDoubtful = !!doubtfulAnswers[String(q.id)];
                const isCurrent = currentIndex === idx;
                
                let bgColor = 'bg-white border-gray-200 text-slate-400';
                if (isAnswered) bgColor = 'bg-brand-600 border-brand-600 text-white';
                if (isDoubtful) bgColor = 'bg-amber-500 border-amber-500 text-white';
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 w-full rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center ${bgColor} ${
                      isCurrent ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : 'hover:scale-105'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-brand-600"></div>
                <span className="text-xs font-medium text-slate-600">Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-amber-500"></div>
                <span className="text-xs font-medium text-slate-600">Ragu-ragu</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded border-2 border-gray-200 bg-white"></div>
                <span className="text-xs font-medium text-slate-600">Belum Dijawab</span>
              </div>
            </div>

            {currentIndex === questions.length - 1 && (
              <button 
                className="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-600/20"
                onClick={handleSubmit}
                disabled={submitting}
              >
                Kumpulkan Sekarang
              </button>
            )}
            
            <button 
              className="w-full mt-3 border border-gray-200 text-slate-500 hover:bg-gray-50 font-bold py-3 px-6 rounded-2xl transition-all"
              onClick={() => { 
                showConfirm(
                  'Batalkan Quiz?', 
                  'Apakah Anda yakin ingin keluar? Semua progres jawaban Anda pada sesi ini akan hilang.',
                  () => { closeModal(); setStep('list'); }
                );
              }}
            >
              Batal & Keluar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
