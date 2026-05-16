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

// Auth
export const login = (data) => API.post('/login', data);
export const register = (data) => API.post('/register', data);
export const getMe = () => API.get('/me');

// Quiz
export const getQuizzes = () => API.get('/quizzes');
export const getQuiz = (id) => API.get(`/quiz/${id}`);
export const createQuiz = (data) => API.post('/quiz', data);
export const updateQuiz = (id, data) => API.put(`/quiz/${id}`, data);
export const deleteQuiz = (id) => API.delete(`/quiz/${id}`);

// Questions
export const createQuestion = (data) => API.post('/question', data);
export const updateQuestion = (id, data) => API.put(`/question/${id}`, data);
export const deleteQuestion = (id) => API.delete(`/question/${id}`);

// Submit & Result
export const submitQuiz = (data) => API.post('/submit', data);
export const getResult = (id) => API.get(`/result/${id}`);
export const getHistory = (email) => API.get(`/history?email=${email}`);

// PDF Export
export const exportPdf = (attemptId) =>
  API.post('/export-pdf', { attempt_id: attemptId }, { responseType: 'blob' });

export default API;
