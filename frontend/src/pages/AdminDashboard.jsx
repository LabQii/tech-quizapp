import { useEffect, useState } from 'react';
import { getQuizzes, getQuiz, createQuiz, updateQuiz, archiveQuiz, deleteQuiz, createQuestion, updateQuestion, deleteQuestion, getAdminStats, getAllAttempts, getAllUsers } from '../api';
import Navbar from '../components/Navbar';

const inputCls = 'w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all';

function QuizModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSave({ name });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl mx-4 animate-slideUp">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-slate-900">{initial ? 'Edit Quiz' : 'Tambah Quiz Baru'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>
        {error && <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Quiz</label>
            <input id="quiz-name-input" type="text" className={inputCls} placeholder="Contoh: Quiz Python Dasar" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <button type="button" className="px-4 py-2.5 text-sm font-semibold border border-gray-300 rounded-lg text-slate-600 hover:bg-gray-50 transition-colors" onClick={onClose}>Batal</button>
            <button id="btn-save-quiz" type="submit" className="px-6 py-2.5 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuestionModal({ initial, quizId, onClose, onSave }) {
  const [form, setForm] = useState({
    text: initial?.text || '',
    options: initial?.options || { A: '', B: '', C: '', D: '' },
    correct_answer: initial?.correct_answer || 'A',
    point: initial?.point || 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSave({ ...form, quiz_id: quizId, point: Number(form.point) });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl mx-4 animate-slideUp">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-slate-900">{initial ? 'Edit Soal' : 'Tambah Soal Baru'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>
        {error && <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teks Soal</label>
            <textarea id="question-text-input" className={inputCls} rows={3} placeholder="Tulis pertanyaan di sini..." value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required />
          </div>
          {['A', 'B', 'C', 'D'].map((key) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pilihan {key}</label>
              <input id={`option-${key}`} type="text" className={inputCls} placeholder={`Pilihan ${key}`} value={form.options[key]} onChange={(e) => setForm({ ...form, options: { ...form.options, [key]: e.target.value } })} required />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jawaban Benar</label>
              <select id="correct-answer-select" className={`${inputCls} pr-10 appearance-none bg-no-repeat bg-[length:1.2em] bg-[right_0.75rem_center]`} style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }} value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}>
                {['A', 'B', 'C', 'D'].map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Poin</label>
              <input id="point-input" type="number" min="1" className={inputCls} value={form.point} onChange={(e) => setForm({ ...form, point: e.target.value })} required />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <button type="button" className="px-4 py-2.5 text-sm font-semibold border border-gray-300 rounded-lg text-slate-600 hover:bg-gray-50 transition-colors" onClick={onClose}>Batal</button>
            <button id="btn-save-question" type="submit" className="px-6 py-2.5 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('quiz');
  const [quizzes, setQuizzes] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState(null);
  const [stats, setStats] = useState(null);
  const [allAttempts, setAllAttempts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [customModal, setCustomModal] = useState({ show: false, title: '', message: '', onConfirm: null, type: 'info' });
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const showAlert = (title, message) => setCustomModal({ show: true, title, message, onConfirm: null, type: 'info' });
  const showConfirm = (title, message, onConfirm) => setCustomModal({ show: true, title, message, onConfirm, type: 'confirm' });
  const closeCustomModal = () => setCustomModal({ ...customModal, show: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const resQ = await getQuizzes(true);
      const list = resQ.data.quizzes || [];
      setQuizzes(list);
      if (list.length > 0) {
        const targetId = quiz?.id || list[0].id;
        const res = await getQuiz(targetId);
        setQuiz(res.data.quiz);
        setQuestions(res.data.questions || []);
      } else {
        setQuiz(null);
        setQuestions([]);
      }
      const [resStats, resAllAtt, resUsers] = await Promise.all([
        getAdminStats(),
        getAllAttempts(),
        getAllUsers()
      ]);
      setStats(resStats.data);
      setAllAttempts(resAllAtt.data.attempts || []);
      setAllUsers(resUsers.data.users || []);
    } catch (err) {
      console.error(err);
      setQuiz(null);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSelectQuiz = async (q) => {
    setLoading(true);
    try {
      const res = await getQuiz(q.id);
      setQuiz(res.data.quiz);
      setQuestions(res.data.questions || []);
      setTab('questions');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveQuiz = async (id, isArchived) => {
    try {
      await archiveQuiz(id);
      addToast(isArchived ? 'Quiz dikeluarkan dari arsip' : 'Quiz berhasil diarsipkan', 'success');
      fetchData();
    } catch {
      addToast('Gagal memproses arsip', 'error');
    }
  };

  const handleDeleteQuiz = async (id) => {
    showConfirm(
      'Hapus Quiz?',
      'Apakah Anda yakin ingin menghapus quiz ini? Semua soal di dalamnya akan ikut terhapus secara permanen.',
      async () => {
        closeCustomModal();
        await deleteQuiz(id);
        addToast('Quiz berhasil dihapus', 'success');
        fetchData();
      }
    );
  };

  const handleDeleteQuestion = async (id) => {
    showConfirm(
      'Hapus Soal?',
      'Apakah Anda yakin ingin menghapus soal ini secara permanen?',
      async () => {
        closeCustomModal();
        await deleteQuestion(id);
        addToast('Soal berhasil dihapus', 'success');
        fetchData();
      }
    );
  };

  const handleSaveQuiz = async (data) => {
    try {
      if (modalState.data) await updateQuiz(modalState.data.id, data);
      else await createQuiz(data);
      addToast(modalState.data ? 'Quiz diperbarui' : 'Quiz ditambahkan');
      setModalState(null);
      fetchData();
    } catch { addToast('Gagal menyimpan quiz', 'error'); }
  };

  const handleSaveQuestion = async (data) => {
    try {
      if (modalState.data) await updateQuestion(modalState.data.id, data);
      else await createQuestion({ ...data, quiz_id: quiz.id });
      addToast(modalState.data ? 'Soal diperbarui' : 'Soal ditambahkan');
      setModalState(null);
      fetchData();
    } catch { addToast('Gagal menyimpan soal', 'error'); }
  };

  const tabCls = (t) => `px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${tab === t ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {customModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fadeIn" onClick={closeCustomModal} />
          <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 animate-slideUp overflow-hidden border border-white/20">
            <div className="mb-8 text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${customModal.type === 'confirm' ? 'bg-red-50 text-red-500' : 'bg-brand-50 text-brand-600'}`}>
                {customModal.type === 'confirm' ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" /></svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">{customModal.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed px-2">{customModal.message}</p>
            </div>
            <div className="flex gap-3">
              {customModal.type === 'confirm' ? (
                <>
                  <button className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-400 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100" onClick={closeCustomModal}>Batal</button>
                  <button className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-600/20 transition-all transform active:scale-95" onClick={customModal.onConfirm}>Hapus</button>
                </>
              ) : (
                <button className="w-full px-6 py-3.5 rounded-2xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 shadow-xl shadow-brand-600/20 transition-all transform active:scale-95" onClick={closeCustomModal}>Mengerti</button>
              )}
            </div>
          </div>
        </div>
      )}

      
      <div className="fixed top-24 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto min-w-[280px] border border-white shadow-2xl shadow-slate-200/50 rounded-3xl p-4 flex items-center gap-4 animate-slideInRight backdrop-blur-sm ${t.type === 'success' ? 'bg-emerald-50/90' : 'bg-rose-50/90'}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${t.type === 'success' ? 'bg-white text-emerald-600' : 'bg-white text-rose-600'}`}>
              {t.type === 'success' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4 10-10" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              )}
            </div>
            <div className={`text-sm font-bold ${t.type === 'success' ? 'text-emerald-900' : 'text-rose-900'}`}>{t.message}</div>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full animate-fadeIn">

        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-full sm:w-fit mb-8 overflow-x-auto whitespace-nowrap">
          <button className={`flex-1 sm:flex-none ${tabCls('quiz')}`} onClick={() => setTab('quiz')}>Quiz</button>
          <button className={`flex-1 sm:flex-none ${tabCls('questions')}`} onClick={() => setTab('questions')}>Soal</button>
          <button className={`flex-1 sm:flex-none ${tabCls('stats')}`} onClick={() => setTab('stats')}>Statistik</button>
          <button className={`flex-1 sm:flex-none ${tabCls('progress')}`} onClick={() => setTab('progress')}>Progres User</button>
        </div>

        {tab === 'quiz' && (
          <div>
            <div className="flex justify-end mb-5">
              <button id="btn-add-quiz" className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors" onClick={() => setModalState({ type: 'quiz', data: null })}>
                + Tambah Quiz
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-16"><div className="w-9 h-9 border-2 border-gray-200 border-t-brand-600 rounded-full animate-spin" /></div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                <p className="text-slate-700 font-semibold">Belum ada quiz</p>
                <p className="text-sm text-slate-400 mt-1">Tambahkan quiz pertama Anda untuk memulai.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {quizzes.map((q) => (
                  <div key={q.id} className={`bg-white border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm transition-all ${q.is_archived ? 'opacity-70 grayscale-[0.3] border-dashed bg-gray-50/50' : 'border-gray-200 hover:border-brand-400'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-slate-900">{q.name}</div>
                        {q.is_archived && <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-tighter">Terarsip</span>}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">ID: {q.id} · {q.question_count} soal</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 text-xs font-semibold bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors border border-brand-100" onClick={() => handleSelectQuiz(q)}>Kelola Soal</button>
                      <button id={`btn-edit-quiz-${q.id}`} className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg text-slate-600 hover:bg-gray-50 transition-colors" onClick={() => setModalState({ type: 'quiz', data: q })}>Edit</button>
                      <button id={`btn-archive-quiz-${q.id}`} className={`px-3 py-1.5 text-xs font-semibold border rounded-lg transition-colors ${q.is_archived ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100' : 'bg-white border-gray-300 text-slate-600 hover:bg-gray-50'}`} onClick={() => handleArchiveQuiz(q.id, q.is_archived)}>
                        {q.is_archived ? 'Buka Arsip' : 'Arsipkan'}
                      </button>
                      <button id={`btn-delete-quiz-${q.id}`} className="px-3 py-1.5 text-xs font-semibold bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors" onClick={() => handleDeleteQuiz(q.id)}>Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'questions' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pilih Quiz:</span>
                <select 
                  className="bg-white border border-gray-200 rounded-lg pl-3 pr-10 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-brand-600 appearance-none bg-no-repeat bg-[length:1.2em] bg-[right_0.5rem_center]"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
                  value={quiz?.id || ''}
                  onChange={(e) => {
                    const selected = quizzes.find(q => q.id === parseInt(e.target.value));
                    if (selected) handleSelectQuiz(selected);
                  }}
                >
                  {quizzes.map(q => (
                    <option key={q.id} value={q.id}>{q.name}</option>
                  ))}
                </select>
              </div>
              <button
                id="btn-add-question"
                className="ml-auto bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                onClick={() => setModalState({ type: 'question', data: null })}
                disabled={!quiz}
                title={!quiz ? 'Buat quiz terlebih dahulu' : ''}
              >
                + Tambah Soal
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-16"><div className="w-9 h-9 border-2 border-gray-200 border-t-brand-600 rounded-full animate-spin" /></div>
            ) : questions.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                <p className="text-slate-700 font-semibold">Belum ada soal</p>
                <p className="text-sm text-slate-400 mt-1">Tambahkan soal ke dalam quiz Anda.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {questions.map((q, i) => (
                  <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm hover:border-brand-400 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center bg-brand-50 text-brand-600 text-xs font-bold rounded-lg flex-shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0 sm:hidden">
                          <div className="text-xs text-slate-400">Soal {i + 1}</div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-800 font-medium leading-relaxed">{q.text}</div>
                        <div className="text-xs text-slate-400 mt-1">Poin: {q.point}</div>
                      </div>
                      <div className="flex gap-2 sm:flex-shrink-0">
                        <button id={`btn-edit-question-${q.id}`} className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg text-slate-600 hover:bg-gray-50 transition-colors" onClick={() => setModalState({ type: 'question', data: q })}>Edit</button>
                        <button id={`btn-delete-question-${q.id}`} className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors" onClick={() => handleDeleteQuestion(q.id)}>Hapus</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === 'stats' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fadeIn">
            <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-sm">
              <div className="text-3xl font-black text-brand-600 mb-1">{stats?.total_users || 0}</div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total User</div>
            </div>
            <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-sm">
              <div className="text-3xl font-black text-brand-600 mb-1">{stats?.total_quizzes || 0}</div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Quiz</div>
            </div>
            <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-sm">
              <div className="text-3xl font-black text-brand-600 mb-1">{stats?.total_attempts || 0}</div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Percobaan</div>
            </div>

            <div className="sm:col-span-3 bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-slate-900">Daftar Pengguna</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white">
                      <th className="px-8 py-4">Nama</th>
                      <th className="px-8 py-4">Username</th>
                      <th className="px-8 py-4">Email</th>
                      <th className="px-8 py-4">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map(u => (
                      <tr key={u.id} className="border-b border-gray-100 text-sm text-slate-600 hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-4 font-semibold text-slate-900">{u.full_name}</td>
                        <td className="px-8 py-4">@{u.username}</td>
                        <td className="px-8 py-4">{u.email}</td>
                        <td className="px-8 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-slate-500'}`}>
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'progress' && (
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm animate-fadeIn">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-slate-900">Progres & Riwayat Seluruh User</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-4">User</th>
                    <th className="px-8 py-4">Quiz</th>
                    <th className="px-8 py-4">Skor</th>
                    <th className="px-8 py-4">Kategori</th>
                    <th className="px-8 py-4">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {allAttempts.map(a => (
                    <tr key={a.id} className="border-b border-gray-100 text-sm text-slate-600 hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="font-semibold text-slate-900">{a.name}</div>
                        <div className="text-xs text-slate-400">{a.email}</div>
                      </td>
                      <td className="px-8 py-4 font-medium">{a.quiz_name}</td>
                      <td className="px-8 py-4">
                        <div className="font-bold text-brand-600">{a.percentage.toFixed(0)}%</div>
                        <div className="text-[10px] text-slate-400">{a.score}/{a.max_score}</div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${a.category === 'Advanced' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            a.category === 'Intermediate' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-red-50 text-red-600 border-red-100'
                          }`}>
                          {a.category}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-xs">
                        {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                  {allAttempts.length === 0 && (
                    <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-400">Belum ada progres user tercatat.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modalState?.type === 'quiz' && (
        <QuizModal initial={modalState.data} onClose={() => setModalState(null)} onSave={handleSaveQuiz} />
      )}
      {modalState?.type === 'question' && (
        <QuestionModal initial={modalState.data} quizId={quiz?.id} onClose={() => setModalState(null)} onSave={handleSaveQuestion} />
      )}
    </div>
  );
}
