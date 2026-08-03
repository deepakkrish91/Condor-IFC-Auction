import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import TeamDashboard from './pages/TeamDashboard'

function PrivateRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  if (!token) return <Navigate to="/" replace />
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />
  return children
}

export default function App() {
  // Unlock AudioContext on first user interaction so sounds work without delay
  useEffect(() => {
    function unlock() {
      if (!window._audioCtxUnlocked) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        ctx.resume().then(() => { window._audioCtxUnlocked = true })
        // Store so Overlays can reuse it
        window._sharedAudioCtx = ctx
      }
    }
    window.addEventListener('click', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 600,
          },
          error: { style: { borderColor: '#EF4444' } },
          success: { style: { borderColor: '#22C55E' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={
          <PrivateRoute requiredRole="admin">
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/teams" element={
          <PrivateRoute>
            <TeamDashboard />
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
