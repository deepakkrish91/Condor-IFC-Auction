import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import toast from 'react-hot-toast'
import PlayerCard from '../components/PlayerCard'
import TeamBudgetBar from '../components/TeamBudgetBar'
import { SoldOverlay, UnsoldOverlay, PlayerUpOverlay } from '../components/Overlays'
import { useAuctionSocket } from '../hooks/useAuctionSocket'
import condorLogo from '../assets/condor-iris-logo.png'

const TIER_BASE = { 1: 50000, 2: 30000, 3: 25000 }
const TIER_COLOR = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }

function formatINR(v) {
  return v?.toLocaleString('en-IN') ?? '—'
}

export default function AdminDashboard() {
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [state, setState] = useState({ phase: 'idle', current_tier: 1, current_player: null })
  const [overlay, setOverlay] = useState(null) // { type, player, team }
  const [selectedTeam, setSelectedTeam] = useState('')
  const [bidAmount, setBidAmount] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    const [pRes, tRes, sRes] = await Promise.all([
      api.get('/admin/players'),
      api.get('/admin/teams'),
      api.get('/admin/state'),
    ])
    setPlayers(pRes.data)
    setTeams(tRes.data)
    setState(sRes.data)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useAuctionSocket((msg) => {
    if (['player_sold', 'player_unsold', 'bid_blocked', 'auction_reset'].includes(msg.event)) {
      fetchAll()
    }
  })

  const [showResetConfirm, setShowResetConfirm] = useState(false)

  async function resetAuction() {
    setLoading(true)
    try {
      await api.post('/admin/reset')
      setShowResetConfirm(false)
      setSelectedTeam('')
      setBidAmount('')
      setOverlay(null)
      await fetchAll()
      toast.success('Auction reset! All data cleared and reseeded.')
    } catch {
      toast.error('Reset failed.')
    } finally {
      setLoading(false)
    }
  }

  async function startAuction() {
    setLoading(true)
    try {
      const res = await api.post('/admin/auction/start')
      await fetchAll()
      if (res.data.player) {
        setOverlay({ type: 'player_up', player: res.data.player })
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error starting auction')
    } finally {
      setLoading(false)
    }
  }

  async function sellPlayer() {
    if (!state.current_player || !selectedTeam || !bidAmount) {
      toast.error('Select a team and enter bid amount.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/admin/auction/sell', {
        player_id: state.current_player.id,
        team_id: parseInt(selectedTeam),
        final_bid: parseInt(bidAmount),
      })
      const team = res.data.team
      const player = { ...res.data.player }
      setOverlay({ type: 'sold', player, team })
      setSelectedTeam('')
      setBidAmount('')
      await fetchAll()
    } catch (e) {
      const detail = e.response?.data?.detail || 'Bid rejected.'
      toast.error(detail, { duration: 5000 })
      if (e.response?.status === 422) {
        await fetchAll()
      }
    } finally {
      setLoading(false)
    }
  }

  async function unsoldPlayer() {
    if (!state.current_player) return
    setLoading(true)
    try {
      await api.post('/admin/auction/unsold', { player_id: state.current_player.id })
      setOverlay({ type: 'unsold', player: state.current_player })
      await fetchAll()
    } catch (e) {
      toast.error('Error marking unsold')
    } finally {
      setLoading(false)
    }
  }

  const filteredPlayers = players.filter(p => {
    if (tierFilter !== 'all' && p.tier !== parseInt(tierFilter)) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  const currentPlayer = state.current_player
  const currentTeam = teams.find(t => t.id === parseInt(selectedTeam))

  const phaseLabel = {
    idle: { text: 'Idle — Ready to Start', color: '#6B7280' },
    live: { text: 'LIVE — Player on Block', color: '#EF4444' },
    sold: { text: 'Sold', color: '#22C55E' },
    unsold: { text: 'Unsold', color: '#9CA3AF' },
    reauction: { text: 'Re-auction Triggered', color: '#F59E0B' },
  }[state.phase] || { text: state.phase, color: '#fff' }

  return (
    <div className="min-h-screen p-4 iris-bg relative overflow-hidden">
      {/* Decorative iris orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="iris-orb absolute -top-32 -left-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(107,140,255,0.15) 0%, transparent 70%)' }} />
        <div className="iris-orb absolute top-1/3 -right-24 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(155,127,232,0.12) 0%, transparent 70%)', animationDelay: '3s' }} />
        <div className="iris-orb absolute bottom-0 left-1/4 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(43,63,191,0.14) 0%, transparent 70%)', animationDelay: '5s' }} />
      </div>

      {/* Overlays */}
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

      {/* Reset confirmation modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-2xl border border-red-500/40 p-8 max-w-sm w-full mx-4 text-center"
              style={{ background: 'linear-gradient(135deg, #0D1035, #0A0C28)' }}
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            >
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="font-orbitron text-xl font-black text-white mb-2">Reset Auction?</h2>
              <p className="text-gray-400 font-rajdhani mb-6">
                This will <span className="text-red-400 font-bold">wipe all auction data</span> — bids,
                sold players, team budgets — and reseed from scratch. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl font-orbitron text-xs font-bold uppercase tracking-wide text-white"
                  style={{ background: '#374151' }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={resetAuction}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl font-orbitron text-xs font-bold uppercase tracking-wide text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(90deg, #dc2626, #991b1b)' }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                >
                  Yes, Reset
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative">
        {/* Left: title */}
        <div>
          <h1 className="font-orbitron text-2xl font-black text-white tracking-widest">
            CONDOR IFC <span style={{ color: '#8BA7FF' }}>AUCTION</span>
          </h1>
          <p className="font-rajdhani text-sm uppercase tracking-widest" style={{ color: '#7B8FC8' }}>Admin Control Panel</p>
        </div>

        {/* Center: Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <img src={condorLogo} alt="Condor IRIS" className="h-16 object-contain logo-knockout" />
        </div>

        {/* Right: phase + reset */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10"
            style={{ background: `${phaseLabel.color}22` }}>
            <div className="w-2 h-2 rounded-full" style={{ background: phaseLabel.color }} />
            <span className="font-rajdhani text-sm font-bold" style={{ color: phaseLabel.color }}>
              {phaseLabel.text}
            </span>
          </div>
          <motion.button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 rounded-full font-orbitron text-xs font-bold uppercase tracking-wide text-red-400 border border-red-500/30"
            style={{ background: 'rgba(239,68,68,0.08)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            ↺ Reset
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Auction Control */}
        <div className="col-span-12 lg:col-span-4 space-y-4">

          {/* Current Player */}
          <div className="rounded-2xl border p-4"
            style={{ background: 'rgba(107,140,255,0.07)', borderColor: 'rgba(107,140,255,0.2)' }}>
            <h2 className="font-rajdhani text-sm uppercase tracking-widest text-gray-400 mb-3">
              Current Player
            </h2>

            {currentPlayer ? (
              <div className="flex justify-center">
                <PlayerCard
                  player={currentPlayer}
                  teamColor={currentTeam?.color || TIER_COLOR[currentPlayer.tier]}
                  teamName={currentTeam?.team_name}
                  largeImage
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-600">
                <span className="text-4xl mb-2">⚽</span>
                <p className="font-rajdhani text-sm">No player on block</p>
              </div>
            )}

            <motion.button
              onClick={startAuction}
              disabled={loading || state.phase === 'live'}
              className="w-full mt-4 py-3 rounded-xl font-orbitron text-sm font-bold tracking-widest
                uppercase text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(90deg, #C41E3A, #8B0000)' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {state.phase === 'live' ? '⚡ Live' : '🎲 Pick a Player for Auction'}
            </motion.button>
          </div>

          {/* Bid Panel */}
          {currentPlayer && state.phase === 'live' && (
            <motion.div
              className="rounded-2xl border border-yellow-400/30 p-4"
              style={{ background: 'rgba(255,215,0,0.04)' }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h2 className="font-rajdhani text-sm uppercase tracking-widest text-yellow-400 mb-3">
                Assign Bid
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">
                    Winning Team
                  </label>
                  <select
                    value={selectedTeam}
                    onChange={e => setSelectedTeam(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10
                      text-white focus:outline-none focus:border-yellow-400 font-rajdhani"
                  >
                    <option value="">Select team...</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.team_name} — {t.marquee_player_name}
                        (avail: ₹{(t.available_to_bid/1000).toFixed(0)}K, need {t.players_needed})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">
                    Final Bid (₹) — Base: ₹{formatINR(TIER_BASE[currentPlayer.tier])}
                  </label>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    min={TIER_BASE[currentPlayer.tier]}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10
                      text-white focus:outline-none focus:border-yellow-400 font-orbitron"
                    placeholder={`Min ₹${formatINR(TIER_BASE[currentPlayer.tier])}`}
                  />
                </div>

                {selectedTeam && bidAmount && (
                  <div className="text-xs text-gray-500 bg-white/5 rounded-lg p-2">
                    {currentTeam && (
                      <>
                        <p>Available to bid: <span className="text-green-400 font-bold">₹{formatINR(currentTeam.available_to_bid)}</span></p>
                        {parseInt(bidAmount) > currentTeam.available_to_bid && (
                          <p className="text-red-400 font-bold mt-1">⚠ Exceeds available budget!</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <motion.button
                    onClick={sellPlayer}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl font-orbitron text-xs font-bold
                      tracking-widest uppercase text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(90deg, #16a34a, #15803d)' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    ✓ SOLD
                  </motion.button>
                  <motion.button
                    onClick={unsoldPlayer}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl font-orbitron text-xs font-bold
                      tracking-widest uppercase text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(90deg, #374151, #1f2937)' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    ✗ UNSOLD
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Team Budgets */}
          <div className="rounded-2xl border p-4"
            style={{ background: 'rgba(107,140,255,0.07)', borderColor: 'rgba(107,140,255,0.2)' }}>
            <h2 className="font-rajdhani text-sm uppercase tracking-widest text-gray-400 mb-3">
              Team Budgets
            </h2>
            <div className="space-y-2">
              {teams.map(t => <TeamBudgetBar key={t.id} team={t} />)}
            </div>
          </div>
        </div>

        {/* Right: Player List */}
        <div className="col-span-12 lg:col-span-8">
          <div className="rounded-2xl border p-4"
            style={{ background: 'rgba(107,140,255,0.07)', borderColor: 'rgba(107,140,255,0.2)' }}>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
              <h2 className="font-rajdhani text-sm uppercase tracking-widest text-gray-400">
                Player List ({filteredPlayers.length})
              </h2>
              <div className="flex gap-2 flex-wrap">
                {['all','1','2','3'].map(t => (
                  <button key={t}
                    onClick={() => setTierFilter(t)}
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-all
                      ${tierFilter === t ? 'text-black' : 'text-gray-400 bg-white/5'}`}
                    style={tierFilter === t ? { background: TIER_COLOR[parseInt(t)] || '#FFD700' } : {}}
                  >
                    {t === 'all' ? 'All' : `T${t}`}
                  </button>
                ))}
                {['all','available','sold','unsold','in_auction'].map(s => (
                  <button key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-all
                      ${statusFilter === s ? 'bg-yellow-400 text-black' : 'text-gray-400 bg-white/5'}`}
                  >
                    {s === 'all' ? 'All Status' : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs uppercase tracking-widest border-b border-white/10">
                    <th className="pb-2 pr-3">#</th>
                    <th className="pb-2 pr-3">Name</th>
                    <th className="pb-2 pr-3">Position</th>
                    <th className="pb-2 pr-3">Tier</th>
                    <th className="pb-2 pr-3">Base Bid</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2 pr-3">Final Bid</th>
                    <th className="pb-2">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map(p => (
                    <tr
                      key={p.id}
                      className={`border-b border-white/5 transition-colors
                        ${p.status === 'in_auction' ? 'bg-yellow-400/10' : 'hover:bg-white/3'}`}
                    >
                      <td className="py-2 pr-3 font-orbitron text-xs text-gray-500">{p.jersey_number}</td>
                      <td className="py-2 pr-3 font-rajdhani font-semibold text-white">{p.name}</td>
                      <td className="py-2 pr-3 text-gray-400 text-xs">{p.position}</td>
                      <td className="py-2 pr-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: `${TIER_COLOR[p.tier]}22`,
                            color: TIER_COLOR[p.tier],
                          }}>
                          T{p.tier}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-orbitron text-xs text-yellow-400">
                        ₹{(p.base_bid/1000).toFixed(0)}K
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'sold' ? 'bg-green-500/20 text-green-400' :
                          p.status === 'unsold' ? 'bg-gray-500/20 text-gray-400' :
                          p.status === 'in_auction' ? 'bg-yellow-400/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-orbitron text-xs text-green-400">
                        {p.final_bid ? `₹${(p.final_bid/1000).toFixed(0)}K` : '—'}
                      </td>
                      <td className="py-2 text-xs text-gray-400">{p.team_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
