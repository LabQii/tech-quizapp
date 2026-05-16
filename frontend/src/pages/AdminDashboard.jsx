import { useEffect, useState } from 'react';
import { getQuizzes, getQuiz, createQuiz, updateQuiz, deleteQuiz, createQuestion, updateQuestion, deleteQuestion } from '../api';
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
              <select id="correct-answer-select" className={`${inputCls} form-select`} value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}>
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

  const [customModal, setCustomModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'info'
  });

  const showAlert = (title, message) => setCustomModal({ show: true, title, message, onConfirm: null, type: 'info' });
  const showConfirm = (title, message, onConfirm) => setCustomModal({ show: true, title, message, onConfirm, type: 'confirm' });
  const closeCustomModal = () => setCustomModal({ ...customModal, show: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const resQ = await getQuizzes();
      const list = resQ.data.quizzes || [];
      setQuizzes(list);
      if (list.length > 0) {
        const res = await getQuiz(list[0].id);
        setQuiz(res.data.quiz);
        setQuestions(res.data.questions || []);
      } else {
        setQuiz(null);
        setQuestions([]);
      }
    } catch {
      setQuiz(null);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteQuiz = async (id) => {
    showConfirm(
      'Hapus Quiz?',
      'Apakah Anda yakin ingin menghapus quiz ini? Semua soal di dalamnya akan ikut terhapus secara permanen.',
      async () => {
        closeCustomModal();
        await deleteQuiz(id);
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
        fetchData();
      }
    );
  };

  const tabCls = (t) => `px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
    tab === t ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-gray-100'
  }`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      {customModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={closeCustomModal} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 animate-slideUp overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 ${customModal.type === 'confirm' ? 'bg-red-500' : 'bg-brand-600'}`} />
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{customModal.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{customModal.message}</p>
            </div>
            <div className="flex gap-3">
              {customModal.type === 'confirm' ? (
                <>
                  <button className="flex-1 px-5 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-gray-100 transition-all" onClick={closeCustomModal}>Batal</button>
                  <button className="flex-1 px-5 py-3 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all" onClick={customModal.onConfirm}>Hapus</button>
                </>
              ) : (
                <button className="w-full px-5 py-3 rounded-xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all" onClick={closeCustomModal}>Mengerti</button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full animate-fadeIn">
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Dashboard Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola quiz dan soal-soal di sini</p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-full sm:w-fit mb-8">
          <button id="tab-quiz" className={`flex-1 sm:flex-none ${tabCls('quiz')}`} onClick={() => setTab('quiz')}>Quiz</button>
          <button id="tab-questions" className={`flex-1 sm:flex-none ${tabCls('questions')}`} onClick={() => setTab('questions')}>Soal ({questions.length})</button>
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
                  <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:border-brand-400 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900">{q.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">ID: {q.id} · {q.question_count} soal</div>
                    </div>
                    <div className="flex gap-2">
                      <button id={`btn-edit-quiz-${q.id}`} className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg text-slate-600 hover:bg-gray-50 transition-colors" onClick={() => setModalState({ type: 'quiz', data: q })}>Edit</button>
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
            <div className="flex items-center justify-between mb-5">
              {quiz && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-600 border border-brand-100">
                  {quiz.name}
                </span>
              )}
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
      </div>

      {modalState?.type === 'quiz' && (
        <QuizModal initial={modalState.data} onClose={() => { setModalState(null); fetchData(); }} onSave={modalState.data ? (d) => updateQuiz(modalState.data.id, d) : createQuiz} />
      )}
      {modalState?.type === 'question' && (
        <QuestionModal initial={modalState.data} quizId={quiz?.id} onClose={() => { setModalState(null); fetchData(); }} onSave={modalState.data ? (d) => updateQuestion(modalState.data.id, d) : createQuestion} />
      )}
    </div>
  );
}
