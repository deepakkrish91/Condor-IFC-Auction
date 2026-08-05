import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import TeamDashboard from './pages/TeamDashboard'
import MyTeamDashboard from './pages/MyTeamDashboard'

function PrivateRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  if (!token) return <Navigate to="/" replace />
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />
  return children
}

export default function App() {
  // Keep AudioContext alive — resume on every click since browsers suspend it aggressively
  useEffect(() => {
    function unlock() {
      if (!window._sharedAudioCtx) {
        window._sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)()
      }
      if (window._sharedAudioCtx.state === 'suspended') {
        window._sharedAudioCtx.resume()
      }
    }
    window.addEventListener('click', unlock)
    window.addEventListener('keydown', unlock)
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

        {/* Admin: full control panel */}
        <Route path="/admin" element={
          <PrivateRoute requiredRole="admin">
            <AdminDashboard />
          </PrivateRoute>
        } />

        {/* Admin: all-teams budget overview (via floating button) */}
        <Route path="/teams" element={
          <PrivateRoute requiredRole="admin">
            <TeamDashboard />
          </PrivateRoute>
        } />

        {/* Per-team: individual team dashboard (only their own data) */}
        <Route path="/team" element={
          <PrivateRoute requiredRole="team">
            <MyTeamDashboard />
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
