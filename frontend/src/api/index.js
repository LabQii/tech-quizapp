import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const login = (data) => API.post('/login', data);
export const register = (data) => API.post('/register', data);
export const getMe = () => API.get('/me');

export const getQuizzes = (all = false) => API.get(all ? '/quizzes?all=true' : '/quizzes');
export const getQuiz = (id) => API.get(`/quiz/${id}`);
export const createQuiz = (data) => API.post('/quiz', data);
export const updateQuiz = (id, data) => API.put(`/quiz/${id}`, data);
export const archiveQuiz = (id) => API.put(`/quiz/${id}/archive`);
export const deleteQuiz = (id) => API.delete(`/quiz/${id}`);

export const createQuestion = (data) => API.post('/question', data);
export const updateQuestion = (id, data) => API.put(`/question/${id}`, data);
export const deleteQuestion = (id) => API.delete(`/question/${id}`);

export const submitQuiz = (data) => API.post('/submit', data);
export const getResult = (id) => API.get(`/result/${id}`);
export const getHistory = (email) => API.get(`/history?email=${email}`);

export const getAdminStats = () => API.get('/stats');
export const getAllAttempts = () => API.get('/all-attempts');
export const getAllUsers = () => API.get('/users');

export const exportPdf = (attemptId) =>
  API.post('/export-pdf', { attempt_id: attemptId }, { responseType: 'blob' });

export default API;
