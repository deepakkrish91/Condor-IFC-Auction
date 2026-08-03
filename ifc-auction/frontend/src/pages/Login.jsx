import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api'
import toast from 'react-hot-toast'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const form = new URLSearchParams()
      form.append('username', username)
      form.append('password', password)
      const res = await api.post('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('role', res.data.role)
      if (res.data.role === 'admin') navigate('/admin')
      else navigate('/teams')
    } catch {
      toast.error('Invalid credentials. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a0a2e 0%, #080C1A 70%)' }}
    >
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: '#C41E3A' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: '#1A3C6E' }} />

      <motion.div
        className="relative z-10 w-full max-w-md px-6"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo / title */}
        <div className="text-center mb-10">
          <motion.div
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center glow-gold"
            style={{ background: 'linear-gradient(135deg, #C41E3A, #FFD700)' }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            <span className="text-3xl">⚽</span>
          </motion.div>
          <h1 className="font-orbitron text-3xl font-black text-white tracking-widest">
            CONDOR IFC
          </h1>
          <p className="font-rajdhani text-yellow-400 tracking-[0.3em] uppercase text-sm mt-1">
            Mega Auction 2026
          </p>
        </div>

        {/* Login card */}
        <div
          className="rounded-2xl p-8 border border-white/10"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}
        >
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white
                  focus:outline-none focus:border-yellow-400 transition-colors font-rajdhani text-lg"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white
                  focus:outline-none focus:border-yellow-400 transition-colors font-rajdhani text-lg"
                placeholder="Enter password"
                required
              />
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-orbitron font-bold tracking-widest uppercase
                text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(90deg, #C41E3A, #8B0000)' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Logging in...' : 'Enter Auction'}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6 font-rajdhani tracking-widest">
          CONDOR IFC · POWERED BY IRIS
        </p>
      </motion.div>
    </div>
  )
}
