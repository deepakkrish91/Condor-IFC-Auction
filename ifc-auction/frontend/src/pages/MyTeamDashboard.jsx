import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import { SoldOverlay, UnsoldOverlay, PlayerUpOverlay } from '../components/Overlays'
import TeamBudgetBar from '../components/TeamBudgetBar'
import PlayerCard from '../components/PlayerCard'
import { useAuctionSocket } from '../hooks/useAuctionSocket'
import condorLogo from '../assets/condor-iris-logo.png'

export default function MyTeamDashboard() {
  const [team, setTeam] = useState(null)
  const [overlay, setOverlay] = useState(null)
  const [error, setError] = useState(null)

  const fetchTeam = useCallback(async () => {
    try {
      const res = await api.get('/team/me')
      setTeam(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load team data.')
    }
  }, [])

  useEffect(() => { fetchTeam() }, [fetchTeam])

  useAuctionSocket((msg) => {
    if (msg.event === 'player_up') setOverlay({ type: 'player_up', player: msg.player })
    if (msg.event === 'player_sold') {
      setOverlay({ type: 'sold', player: msg.player, team: msg.team })
      fetchTeam()
    }
    if (msg.event === 'player_unsold') {
      setOverlay({ type: 'unsold', player: msg.player })
      fetchTeam()
    }
    if (['bid_blocked', 'auction_reset'].includes(msg.event)) fetchTeam()
  })

  if (error) return (
    <div className="min-h-screen flex items-center justify-center iris-bg">
      <p className="text-red-400 font-rajdhani text-lg">{error}</p>
    </div>
  )

  if (!team) return (
    <div className="min-h-screen flex items-center justify-center iris-bg">
      <p className="text-gray-400 font-rajdhani text-lg animate-pulse">Loading...</p>
    </div>
  )

  const color = team.color

  return (
    <div className="min-h-screen p-4 iris-bg relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="iris-orb absolute -top-24 -right-24 w-96 h-96 rounded-full"
          style={{ background: `radial-gradient(circle, ${color}22 0%, transparent 70%)` }} />
        <div className="iris-orb absolute bottom-1/4 -left-20 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(107,140,255,0.13) 0%, transparent 70%)', animationDelay: '4s' }} />
      </div>

      <AnimatePresence>
        {overlay?.type === 'player_up' && (
          <PlayerUpOverlay player={overlay.player} onDone={() => setOverlay(null)} />
        )}
        {overlay?.type === 'sold' && (
          <SoldOverlay player={overlay.player} team={overlay.team} onDone={() => setOverlay(null)} />
        )}
        {overlay?.type === 'unsold' && (
          <UnsoldOverlay player={overlay.player} onDone={() => setOverlay(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute left-0 top-0">
          <img src={condorLogo} alt="Condor IRIS" className="h-14 object-contain logo-knockout" />
        </div>
        <div className="text-center">
          <h1 className="font-orbitron text-2xl font-black tracking-widest" style={{ color }}>
            {team.team_name}
          </h1>
          <p className="font-rajdhani uppercase tracking-widest text-sm" style={{ color: '#7B8FC8' }}>
            Live Auction Status
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Team hero */}
        <motion.div
          className="rounded-2xl p-6 border"
          style={{
            background: `linear-gradient(135deg, ${color}28 0%, rgba(107,140,255,0.10) 50%, rgba(13,16,53,0.95) 100%)`,
            borderColor: `${color}44`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="font-orbitron text-4xl font-black" style={{ color }}>
                {team.team_name}
              </h2>
              <p className="font-rajdhani text-xl text-gray-300 mt-1">
                Captain: <span className="font-bold text-white">{team.marquee_player_name}</span>
              </p>
            </div>
            <div className="flex gap-6 flex-wrap">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-widest">Total Budget</p>
                <p className="font-orbitron text-xl font-black text-white">₹10,00,000</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-widest">Spent</p>
                <p className="font-orbitron text-xl font-black text-red-400">
                  ₹{team.gross_spent.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-widest">Players Needed</p>
                <p className="font-orbitron text-xl font-black text-yellow-400">
                  {team.players_needed}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <TeamBudgetBar team={team} />
          </div>
        </motion.div>

        {/* Roster */}
        <div className="rounded-2xl border p-5"
          style={{ background: 'rgba(107,140,255,0.07)', borderColor: 'rgba(107,140,255,0.2)' }}>
          <h3 className="font-rajdhani text-sm uppercase tracking-widest text-gray-400 mb-4">
            Squad ({team.players.length} / 7 signed)
          </h3>

          {/* Marquee player */}
          <div className="mb-4 px-4 py-3 rounded-xl border flex items-center gap-4"
            style={{ borderColor: `${color}55`, background: `${color}11` }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-orbitron text-lg font-black"
              style={{ background: color }}>★</div>
            <div>
              <p className="font-rajdhani font-black text-white text-lg">{team.marquee_player_name}</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Marquee Player · Captain</p>
            </div>
            {team.marquee_valuation > 0 && (
              <div className="ml-auto text-right">
                <p className="text-xs text-gray-500">Valuation</p>
                <p className="font-orbitron text-sm font-bold text-yellow-400">
                  ₹{team.marquee_valuation.toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>

          {/* Signed players */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {team.players.map(p => (
              <motion.div key={p.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <PlayerCard player={p} teamColor={color} teamName={team.team_name} showStatus />
              </motion.div>
            ))}
            {[...Array(Math.max(0, 7 - team.players.length))].map((_, i) => (
              <div key={`empty-${i}`}
                className="rounded-3xl border-2 border-dashed flex items-center justify-center"
                style={{ width: 260, height: 420, borderColor: `${color}33` }}>
                <div className="text-center text-gray-700">
                  <p className="text-3xl mb-1">+</p>
                  <p className="text-xs uppercase tracking-widest">Slot Open</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
