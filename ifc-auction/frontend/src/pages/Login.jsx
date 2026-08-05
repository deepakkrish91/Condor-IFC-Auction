import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api'
import toast from 'react-hot-toast'
import condorLogo from '../assets/condor-iris-logo.png'

const PLAYERS = [
  { src: '/messi.png',   name: 'Messi',   side: 'left',  x: '-8%',  width: 420 },
  { src: '/ronaldo.png', name: 'Ronaldo', side: 'right', x: '-8%',  width: 380 },
  { src: '/yamal.png',   name: 'Yamal',   side: 'right', x: '18%',  width: 320 },
]

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
      if (res.data.team_id) {
        localStorage.setItem('team_id', res.data.team_id)
        navigate('/team')
      } else if (res.data.role === 'admin') {
        navigate('/admin')
      } else {
        // Legacy shared team login
        navigate('/team')
      }
    } catch {
      toast.error('Invalid credentials. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #0d1535 0%, #060912 100%)' }}
    >
      {/* Pitch lines subtle background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 80px),
                            repeating-linear-gradient(0deg,  #fff 0px, #fff 1px, transparent 1px, transparent 80px)`,
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ background: '#4B6FFF' }} />
      <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] rounded-full opacity-10 blur-[100px] pointer-events-none"
        style={{ background: '#C41E3A' }} />

      {/* ── Left player: Messi ── */}
      <motion.div
        className="absolute bottom-0 left-0 pointer-events-none select-none"
        style={{ width: PLAYERS[0].width }}
        initial={{ x: -120, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        <img src={PLAYERS[0].src} alt={PLAYERS[0].name} className="w-full h-auto object-contain object-bottom"
          style={{ filter: 'drop-shadow(-8px 0 40px rgba(75,111,255,0.4))' }} />
        <div className="absolute bottom-0 left-0 right-0 h-32"
          style={{ background: 'linear-gradient(to top, #060912 0%, transparent 100%)' }} />
      </motion.div>

      {/* ── Right players: Ronaldo + Yamal ── */}
      <motion.div
        className="absolute bottom-0 right-0 pointer-events-none select-none"
        style={{ width: PLAYERS[1].width }}
        initial={{ x: 120, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
      >
        <img src={PLAYERS[1].src} alt={PLAYERS[1].name} className="w-full h-auto object-contain object-bottom"
          style={{ filter: 'drop-shadow(8px 0 40px rgba(196,30,58,0.4))' }} />
        <div className="absolute bottom-0 left-0 right-0 h-32"
          style={{ background: 'linear-gradient(to top, #060912 0%, transparent 100%)' }} />
      </motion.div>

      <motion.div
        className="absolute bottom-0 pointer-events-none select-none"
        style={{ width: PLAYERS[2].width, right: PLAYERS[1].width - 60 }}
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
      >
        <img src={PLAYERS[2].src} alt={PLAYERS[2].name} className="w-full h-auto object-contain object-bottom"
          style={{ filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.3))' }} />
        <div className="absolute bottom-0 left-0 right-0 h-32"
          style={{ background: 'linear-gradient(to top, #060912 0%, transparent 100%)' }} />
      </motion.div>

      {/* ── Login card ── */}
      <motion.div
        className="relative z-10 w-full max-w-sm px-6"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* Logo + title */}
        <div className="text-center mb-8">
          <motion.img
            src={condorLogo}
            alt="Condor IRIS"
            className="h-20 mx-auto mb-4 object-contain logo-knockout"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 3.5 }}
          />
          <h1 className="font-orbitron text-3xl font-black text-white tracking-widest">
            CONDOR IFC
          </h1>
          <p className="font-rajdhani text-yellow-400 tracking-[0.3em] uppercase text-sm mt-1">
            Mega Auction 2026
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 border border-white/10"
          style={{ background: 'rgba(10,14,40,0.75)', backdropFilter: 'blur(24px)' }}
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
