import axios from 'axios'

// L'URL de l'API est configurable via la variable d'environnement VITE_API_URL
// (définie sur Vercel en production, ex: "https://mon-backend.up.railway.app/api").
// En développement local, on retombe sur le backend local par défaut.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Authentification ────────────────────────────────────────────
// Intercepteur : ajoute automatiquement le jeton JWT à chaque requête,
// pour que le backend sache qui est connecté.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur de réponse : si le backend renvoie 401 (session expirée ou
// jeton invalide), on déconnecte et on renvoie vers la page de login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export interface AuthUser {
  id: number
  email: string
  full_name: string | null
  is_admin: boolean
}

export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password })
  localStorage.setItem('token', res.data.access_token)
  localStorage.setItem('user', JSON.stringify(res.data.user))
  return res.data.user as AuthUser
}

export const register = async (
  email: string,
  password: string,
  full_name?: string
) => {
  const res = await api.post('/auth/register', { email, password, full_name })
  localStorage.setItem('token', res.data.access_token)
  localStorage.setItem('user', JSON.stringify(res.data.user))
  return res.data.user as AuthUser
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export const isAuthenticated = () => !!localStorage.getItem('token')

export const getStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem('user')
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const getProfile = () => api.get<AuthUser>('/auth/me')

export const updateProfile = (data: { full_name?: string; email?: string }) =>
  api.put<AuthUser>('/auth/me', data)

export const changePassword = (current_password: string, new_password: string) =>
  api.put('/auth/me/password', { current_password, new_password })

// ── Meetings ────────────────────────────────────────────────────
export const getMeetings = () => api.get('/meetings/')

export const getMeeting = (id: number) => api.get(`/meetings/${id}`)

export const deleteMeeting = (id: number) => api.delete(`/meetings/${id}`)

// ── Upload ──────────────────────────────────────────────────────
export const uploadMeeting = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}



// ── Tasks ───────────────────────────────────────────────────────
export const getTasks = () => api.get('/tasks/')

export const getDecisions = () => api.get('/tasks/decisions')

export const updateTaskStatus = (taskId: number, status: string) =>
  api.patch(`/tasks/${taskId}/status`, { status })



// ── Participants ────────────────────────────────────────────────
export const getParticipants = () => api.get('/participants/')

export const getMeetingParticipants = (meetingId: number) =>
  api.get(`/participants/meeting/${meetingId}`)

export const addParticipant = (
  meetingId: number,
  data: { name: string; email?: string; role?: string; present?: boolean }
) => api.post(`/participants/meeting/${meetingId}`, data)

export const updateParticipant = (
  participantId: number,
  data: Partial<{ name: string; email: string; role: string; present: boolean }>
) => api.put(`/participants/${participantId}`, data)

export const deleteParticipant = (participantId: number) =>
  api.delete(`/participants/${participantId}`)



// ── Export PDF ──────────────────────────────────────────────────
export const exportPDF = (
  meetingId: number,
  template= 'classic',
  companyName= 'Mon Entreprise',
  primaryColor= 'C41230',
  accentColor= 'FFCC00',
  darkColor= '231F20'
) => {
  const params = new URLSearchParams({
    template,
    company_name: companyName,
    primary_color: primaryColor,
    accent_color: accentColor,
    dark_color: darkColor,
  })
  return api.get(`/export/meeting/${meetingId}/pdf?${params}`, {
    responseType: 'blob',
  })
}

// ── Export Word (.docx) ─────────────────────────────────────────
export const exportDOCX = (meetingId: number) => {
  return api.get(`/export/meeting/${meetingId}/docx`, {
    responseType: 'blob',
  })
}

// ── Chatbot ─────────────────────────────────────────────────────
export interface ChatReference {
  id: number
  title: string
  date: string | null
}
export interface ChatResponse {
  answer: string
  references: ChatReference[]
}
export const sendChatMessage = (question: string) =>
  api.post<ChatResponse>('/chat/', { question })

// ── Analytics ───────────────────────────────────────────────────
export const getAnalytics = (period: 'week' | 'month' | 'year' = 'month') =>
  api.get(`/analytics/?period=${period}`)

// Met à jour une réunion (ex: corriger sa date).
export const updateMeeting = (
  id: number,
  data: Partial<{ date: string; title: string }>
) => api.put(`/meetings/${id}`, data)

export default api