import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import { SoldOverlay, UnsoldOverlay, PlayerUpOverlay } from '../components/Overlays'
import TeamBudgetBar from '../components/TeamBudgetBar'
import PlayerCard from '../components/PlayerCard'
import { useAuctionSocket } from '../hooks/useAuctionSocket'
import condorLogo from '../assets/condor-iris-logo.png'

const MAX_BUDGET = 1_000_000

export default function TeamDashboard() {
  const [teams, setTeams] = useState([])
  const [overlay, setOverlay] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)

  const fetchTeams = useCallback(async () => {
    const res = await api.get('/team/all')
    setTeams(res.data)
    if (!selectedTeam && res.data.length > 0) setSelectedTeam(res.data[0])
  }, [selectedTeam])

  useEffect(() => { fetchTeams() }, [fetchTeams])

  useAuctionSocket((msg) => {
    if (msg.event === 'player_up') setOverlay({ type: 'player_up', player: msg.player })
    if (msg.event === 'player_sold') {
      setOverlay({ type: 'sold', player: msg.player, team: msg.team })
      fetchTeams()
    }
    if (msg.event === 'player_unsold') {
      setOverlay({ type: 'unsold', player: msg.player })
      fetchTeams()
    }
    if (msg.event === 'team_update' || msg.event === 'bid_blocked' || msg.event === 'auction_reset') fetchTeams()
  })

  const activeTeam = selectedTeam ? teams.find(t => t.id === selectedTeam.id) || selectedTeam : null

  return (
    <div className="min-h-screen p-4 iris-bg relative overflow-hidden">
      {/* Decorative iris orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="iris-orb absolute -top-24 -right-24 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(155,127,232,0.15) 0%, transparent 70%)' }} />
        <div className="iris-orb absolute bottom-1/4 -left-20 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(107,140,255,0.13) 0%, transparent 70%)', animationDelay: '4s' }} />
        <div className="iris-orb absolute top-2/3 right-1/4 w-60 h-60 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(43,63,191,0.12) 0%, transparent 70%)', animationDelay: '2s' }} />
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
        {/* Logo top-left */}
        <div className="absolute left-0 top-0 flex items-center gap-3">
          <img src={condorLogo} alt="Condor IRIS" className="h-14 object-contain logo-knockout" />
        </div>
        <div className="text-center">
          <h1 className="font-orbitron text-2xl font-black text-white tracking-widest">
            CONDOR IFC <span style={{ color: '#8BA7FF' }}>TEAMS</span>
          </h1>
          <p className="font-rajdhani uppercase tracking-widest text-sm" style={{ color: '#7B8FC8' }}>Live Auction Status</p>
        </div>
      </div>

      {/* Team selector tabs */}
      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        {teams.map(t => (
          <motion.button
            key={t.id}
            onClick={() => setSelectedTeam(t)}
            className="px-5 py-2.5 rounded-xl font-rajdhani font-bold uppercase tracking-wide text-sm transition-all"
            style={{
              background: activeTeam?.id === t.id ? t.color : `${t.color}22`,
              color: activeTeam?.id === t.id ? '#fff' : t.color,
              border: `2px solid ${t.color}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            {t.team_name}
          </motion.button>
        ))}
      </div>

      {activeTeam && (
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Team hero */}
          <motion.div
            key={activeTeam.id}
            className="rounded-2xl p-6 border"
            style={{
              background: `linear-gradient(135deg, ${activeTeam.color}28 0%, rgba(107,140,255,0.10) 50%, rgba(13,16,53,0.95) 100%)`,
              borderColor: `${activeTeam.color}44`,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-6">
              {/* Team info */}
              <div>
                <h2 className="font-orbitron text-4xl font-black" style={{ color: activeTeam.color }}>
                  {activeTeam.team_name}
                </h2>
                <p className="font-rajdhani text-xl text-gray-300 mt-1">
                  Captain: <span className="font-bold text-white">{activeTeam.marquee_player_name}</span>
                </p>
              </div>

              {/* Budget stats */}
              <div className="flex gap-6 flex-wrap">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Total Budget</p>
                  <p className="font-orbitron text-xl font-black text-white">₹10,00,000</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Spent</p>
                  <p className="font-orbitron text-xl font-black text-red-400">
                    ₹{activeTeam.gross_spent.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Available Now</p>
                  <p className="font-orbitron text-xl font-black text-green-400">
                    ₹{activeTeam.available_to_bid.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Players Needed</p>
                  <p className="font-orbitron text-xl font-black text-yellow-400">
                    {activeTeam.players_needed}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget bar */}
            <div className="mt-4">
              <TeamBudgetBar team={activeTeam} />
            </div>
          </motion.div>

          {/* Roster */}
          <div className="rounded-2xl border p-5"
            style={{ background: 'rgba(107,140,255,0.07)', borderColor: 'rgba(107,140,255,0.2)' }}>
            <h3 className="font-rajdhani text-sm uppercase tracking-widest text-gray-400 mb-4">
              Squad ({activeTeam.players.length} / 6 signed)
            </h3>

            {/* Marquee player slot */}
            <div className="mb-4 px-4 py-3 rounded-xl border flex items-center gap-4"
              style={{ borderColor: `${activeTeam.color}55`, background: `${activeTeam.color}11` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-orbitron text-lg font-black"
                style={{ background: activeTeam.color }}>
                ★
              </div>
              <div>
                <p className="font-rajdhani font-black text-white text-lg">{activeTeam.marquee_player_name}</p>
                <p className="text-xs text-gray-500 uppercase tracking-widest">
                  Marquee Player · Captain{activeTeam.apartment ? ` · 🏠 ${activeTeam.apartment}` : ''}
                </p>
              </div>
              {activeTeam.marquee_valuation > 0 && (
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-500">Valuation</p>
                  <p className="font-orbitron text-sm font-bold text-yellow-400">
                    ₹{activeTeam.marquee_valuation.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>

            {/* Signed players grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              {activeTeam.players.map(p => (
                <motion.div
                  key={p.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <PlayerCard
                    player={p}
                    teamColor={activeTeam.color}
                    teamName={activeTeam.team_name}
                    showStatus
                  />
                </motion.div>
              ))}

              {/* Empty slots */}
              {[...Array(Math.max(0, 6 - activeTeam.players.length))].map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="rounded-3xl border-2 border-dashed flex items-center justify-center"
                  style={{ width: 260, height: 420, borderColor: `${activeTeam.color}33` }}
                >
                  <div className="text-center text-gray-700">
                    <p className="text-3xl mb-1">+</p>
                    <p className="text-xs uppercase tracking-widest">Slot Open</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All teams overview */}
          <div className="rounded-2xl border p-5"
            style={{ background: 'rgba(107,140,255,0.07)', borderColor: 'rgba(107,140,255,0.2)' }}>
            <h3 className="font-rajdhani text-sm uppercase tracking-widest text-gray-400 mb-4">
              All Teams Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teams.map(t => <TeamBudgetBar key={t.id} team={t} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
