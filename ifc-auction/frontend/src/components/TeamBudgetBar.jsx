import { motion } from 'framer-motion'

const MAX_BUDGET = 1_000_000

export default function TeamBudgetBar({ team }) {
  const pct = Math.max(0, Math.min(100, ((MAX_BUDGET - team.gross_spent) / MAX_BUDGET) * 100))
  const availPct = Math.max(0, Math.min(100, (team.available_to_bid / MAX_BUDGET) * 100))

  return (
    <div
      className="rounded-xl p-3 border border-white/10"
      style={{ background: `${team.color}22` }}
    >
      <div className="flex justify-between items-center mb-1">
        <div>
          <p className="font-rajdhani font-black text-sm uppercase tracking-wide" style={{ color: team.color }}>
            {team.team_name}
          </p>
          <p className="text-xs text-gray-400">{team.marquee_player_name}</p>
        </div>
        <div className="text-right">
          <p className="font-orbitron text-xs font-bold text-yellow-400">
            ₹{(team.available_to_bid / 1000).toFixed(0)}K avail
          </p>
          <p className="text-[10px] text-gray-500">
            {6 - team.players_needed}/6 signed
          </p>
        </div>
      </div>

      {/* Budget bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${team.color}, #FFD700)` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        {/* Available to bid marker */}
        <div
          className="absolute top-0 h-full border-r-2 border-white/40"
          style={{ left: `${availPct}%` }}
        />
      </div>

      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] text-gray-600">₹0</span>
        <span className="text-[9px] text-gray-600">₹10L</span>
      </div>
    </div>
  )
}
