import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import TeamBudgetBar from '../components/TeamBudgetBar'
import condorLogo from '../assets/condor-iris-logo.png'

export default function TeamDashboard() {
  const [teams, setTeams] = useState([])
  const navigate = useNavigate()

  const fetchTeams = useCallback(async () => {
    const res = await api.get('/admin/teams')
    setTeams(res.data)
  }, [])

  useEffect(() => { fetchTeams() }, [fetchTeams])

  return (
    <div className="min-h-screen p-4 iris-bg relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="iris-orb absolute -top-32 -left-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(107,140,255,0.15) 0%, transparent 70%)' }} />
        <div className="iris-orb absolute bottom-0 right-0 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(155,127,232,0.12) 0%, transparent 70%)', animationDelay: '3s' }} />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute left-0 top-0">
          <img src={condorLogo} alt="Condor IRIS" className="h-14 object-contain logo-knockout" />
        </div>
        <div className="text-center">
          <h1 className="font-orbitron text-2xl font-black text-white tracking-widest">
            CONDOR IFC <span style={{ color: '#8BA7FF' }}>TEAMS</span>
          </h1>
          <p className="font-rajdhani uppercase tracking-widest text-sm" style={{ color: '#7B8FC8' }}>
            Budget Overview · Admin View
          </p>
        </div>
        <motion.button
          onClick={() => navigate('/admin')}
          className="absolute right-0 top-0 flex items-center gap-2 px-4 py-2 rounded-xl
            font-orbitron text-xs font-bold tracking-widest uppercase text-white border border-white/10"
          style={{ background: 'rgba(107,140,255,0.12)' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          ← Admin
        </motion.button>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {teams.map(t => (
          <motion.div
            key={t.id}
            className="rounded-2xl border p-5"
            style={{
              background: `linear-gradient(135deg, ${t.color}18 0%, rgba(13,16,53,0.95) 100%)`,
              borderColor: `${t.color}44`,
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Team header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-orbitron text-2xl font-black" style={{ color: t.color }}>
                  {t.team_name}
                </h2>
                <p className="font-rajdhani text-gray-300 mt-0.5">
                  Captain: <span className="font-bold text-white">{t.marquee_player_name}</span>
                </p>
              </div>
              <div className="flex gap-5 flex-wrap">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Spent</p>
                  <p className="font-orbitron text-lg font-black text-red-400">
                    ₹{t.gross_spent.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Available</p>
                  <p className="font-orbitron text-lg font-black text-green-400">
                    ₹{t.available_to_bid.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Needed</p>
                  <p className="font-orbitron text-lg font-black text-yellow-400">
                    {t.players_needed}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Signed</p>
                  <p className="font-orbitron text-lg font-black text-white">
                    {t.players.length}
                  </p>
                </div>
              </div>
            </div>

            <TeamBudgetBar team={t} />

            {/* Signed players list */}
            {t.players.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {t.players.map(p => (
                  <span key={p.id}
                    className="px-3 py-1 rounded-full text-xs font-bold font-rajdhani"
                    style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}44` }}>
                    #{p.jersey_number} {p.name} · ₹{(p.final_bid / 1000).toFixed(0)}K
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
