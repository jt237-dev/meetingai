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

export default api