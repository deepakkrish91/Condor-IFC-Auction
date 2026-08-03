const TIER_STARS = { 1: 5, 2: 3, 3: 1 }
const TIER_LABEL = { 1: 'TIER 1', 2: 'TIER 2', 3: 'TIER 3' }

const STAT_COLORS = {
  pace: '#FF6B35',
  technique: '#00D4FF',
  physicality: '#FF3366',
  vision: '#A855F7',
  stamina: '#22C55E',
  aggression: '#EF4444',
}

function StatBar({ label, value, color }) {
  return (
    <div className="mb-1">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">{label}</span>
        <span className="text-[11px] font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full stat-bar-fill"
          style={{ '--target-width': `${value}%`, backgroundColor: color, width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default function PlayerCard({ player, teamColor, teamName, showStatus = false }) {
  if (!player) return null

  const stars = TIER_STARS[player.tier] || 1
  const baseBid = player.base_bid || (player.tier === 1 ? 50000 : player.tier === 2 ? 30000 : 25000)

  return (
    <div
      className="relative w-64 rounded-2xl overflow-hidden select-none"
      style={{
        background: 'linear-gradient(160deg, #0D1B3E 0%, #1a0a2e 60%, #0D1B3E 100%)',
        border: `2px solid ${teamColor || '#FFD700'}`,
        boxShadow: `0 0 30px ${teamColor || '#FFD700'}55`,
      }}
    >
      {/* Header bar */}
      <div
        className="flex justify-between items-center px-3 py-2"
        style={{ background: teamColor || '#C41E3A' }}
      >
        <span className="font-orbitron text-xs font-black tracking-widest text-white uppercase">
          Condor IFC
        </span>
        <span className="font-orbitron text-lg font-black text-white">
          #{player.jersey_number}
        </span>
      </div>

      {/* Sunburst background */}
      <div className="relative h-44 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-10 spin-slow">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 bg-white origin-bottom"
              style={{
                height: '120px',
                transform: `rotate(${i * 22.5}deg)`,
                bottom: '50%',
              }}
            />
          ))}
        </div>

        {/* Left stats */}
        <div className="absolute left-2 top-2 space-y-1 z-10">
          {[
            { label: 'PAC', val: player.pace },
            { label: 'TEC', val: player.technique },
            { label: 'PHY', val: player.physicality },
            { label: 'VIS', val: player.vision },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1">
              <span
                className="text-[10px] font-black px-1 py-0.5 rounded text-white"
                style={{ background: teamColor || '#C41E3A' }}
              >
                {s.label}
              </span>
              <span className="font-orbitron text-sm font-black text-white">{s.val}</span>
            </div>
          ))}
        </div>

        {/* Player silhouette / avatar placeholder */}
        <div className="z-10 w-24 h-32 flex items-end justify-center">
          <div
            className="w-20 h-28 rounded-t-full flex items-center justify-center float-anim"
            style={{ background: `linear-gradient(180deg, ${teamColor || '#C41E3A'}88 0%, ${teamColor || '#C41E3A'}22 100%)` }}
          >
            <svg viewBox="0 0 80 100" className="w-16 h-20 opacity-80" fill={teamColor || '#C41E3A'}>
              <circle cx="40" cy="22" r="18" />
              <path d="M10 100 Q10 55 40 55 Q70 55 70 100 Z" />
            </svg>
          </div>
        </div>

        {/* Right: badge + role */}
        <div className="absolute right-2 top-2 z-10 flex flex-col items-center gap-2">
          <div
            className="w-10 h-12 flex items-center justify-center rounded-b-full rounded-t-sm text-[8px] font-black text-center text-white leading-tight"
            style={{ background: `linear-gradient(180deg, #1A3C6E, ${teamColor || '#C41E3A'})` }}
          >
            {teamName ? teamName.substring(0, 3).toUpperCase() : 'IFC'}
          </div>
          <div
            className="w-8 h-5 rounded-sm text-[8px] font-black text-white flex items-center justify-center"
            style={{ background: teamColor || '#C41E3A' }}
          >
            🇮🇳
          </div>
        </div>
      </div>

      {/* Name bar */}
      <div
        className="px-3 py-1.5"
        style={{ background: `linear-gradient(90deg, ${teamColor || '#C41E3A'}, #1a0a2e)` }}
      >
        <p className="font-rajdhani text-lg font-black text-white uppercase tracking-wide truncate">
          {player.name}
        </p>
        <div className="flex items-center justify-between">
          <p className="font-rajdhani text-xs font-semibold tracking-widest uppercase"
            style={{ color: '#FFD700' }}>
            {player.position}
          </p>
          {player.apartment && (
            <p className="text-[10px] text-gray-400 tracking-wide">🏠 {player.apartment}</p>
          )}
        </div>
      </div>

      {/* Stars + Tier */}
      <div className="px-3 pt-2 pb-1 flex items-center justify-between">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={`text-sm ${i < stars ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
          ))}
        </div>
        <span
          className="text-[10px] font-black px-2 py-0.5 rounded-full tracking-widest"
          style={{ background: teamColor || '#C41E3A', color: '#fff' }}
        >
          {TIER_LABEL[player.tier]}
        </span>
      </div>

      {/* Stat bars */}
      <div className="px-3 pb-2">
        <StatBar label="Pace" value={player.pace} color={STAT_COLORS.pace} />
        <StatBar label="Stamina" value={player.stamina} color={STAT_COLORS.stamina} />
        <StatBar label="Aggression" value={player.aggression} color={STAT_COLORS.aggression} />
      </div>

      {/* Bottom info */}
      <div className="px-3 pb-3 flex justify-between items-center border-t border-white/10 pt-2">
        <div className="text-center">
          <p className="text-[9px] text-gray-500 uppercase tracking-widest">Base Bid</p>
          <p className="font-orbitron text-xs font-black text-yellow-400">
            ₹{(baseBid / 1000).toFixed(0)}K
          </p>
        </div>
        {showStatus && player.final_bid && (
          <div className="text-center">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">Final Bid</p>
            <p className="font-orbitron text-xs font-black text-green-400">
              ₹{(player.final_bid / 1000).toFixed(0)}K
            </p>
          </div>
        )}
        <div className="text-center">
          <div className="w-8 h-8 opacity-60">
            <svg viewBox="0 0 32 32" fill="white">
              <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="2" fill="none"/>
              <path d="M16 4 L20 12 L16 10 L12 12 Z" fill="white"/>
              <path d="M28 20 L20 18 L22 14 L26 18 Z" fill="white"/>
              <path d="M22 28 L16 22 L20 20 L22 26 Z" fill="white"/>
              <path d="M10 28 L12 22 L16 24 L10 28 Z" fill="white"/>
              <path d="M4 20 L8 16 L10 20 L4 22 Z" fill="white"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
