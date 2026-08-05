const TIER_STARS = { 1: 5, 2: 4.2, 3: 3.8 }
const TIER_LABEL = { 1: 'TIER 1', 2: 'TIER 2', 3: 'TIER 3' }
const TIER_GLOW  = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }

const STAT_COLORS = {
  pace:        '#FF6B35',
  stamina:     '#22C55E',
  aggression:  '#EF4444',
  technique:   '#00D4FF',
  physicality: '#FF3366',
  vision:      '#A855F7',
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span
        className="text-[10px] font-black tracking-widest uppercase w-20 shrink-0"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full stat-bar-fill"
          style={{ '--target-width': `${value}%`, backgroundColor: color, width: `${value}%` }}
        />
      </div>
      <span className="font-orbitron text-xs font-black w-8 text-right" style={{ color }}>{value}</span>
    </div>
  )
}

export default function PlayerCard({ player, teamColor, teamName, showStatus = false, largeImage = false }) {
  if (!player) return null

  const color      = teamColor || '#FFD700'
  const tierGlow   = TIER_GLOW[player.tier] || '#FFD700'
  const stars      = TIER_STARS[player.tier] || 1
  const baseBid    = player.base_bid || (player.tier === 1 ? 50000 : player.tier === 2 ? 30000 : 25000)
  const imageUrl   = player.image ? `/${player.image}` : null
  const shortName  = teamName ? teamName.substring(0, 3).toUpperCase() : 'IFC'

  return (
    <div className="relative select-none" style={{ width: 260, paddingTop: largeImage ? 110 : 80 }}>

      {/* ── Cutout player image — overflows above card ── */}
      {imageUrl && (
        <div
          className="absolute left-1/2 z-20 pointer-events-none"
          style={{
            top: 0,
            transform: 'translateX(-50%)',
            width: largeImage ? 260 : 220,
            height: largeImage ? 290 : 240,
            overflow: 'hidden',
          }}
        >
          <img
            src={imageUrl}
            alt={player.name}
            className="w-full h-full object-cover object-top"
            style={{ filter: `drop-shadow(0 -8px 24px ${color}88)` }}
          />
          {/* Bottom fade so image blends into card seamlessly */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16"
            style={{
              background: 'linear-gradient(to top, #0D1B3E 0%, transparent 100%)',
            }}
          />
        </div>
      )}

      {/* ── Card body ── */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0D1B3E 0%, #0a1228 50%, #111830 100%)',
          border: `2px solid ${color}`,
          boxShadow: `0 0 0 1px ${color}33, 0 0 40px ${color}44, inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      >
        {/* Shimmer grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            backgroundSize: '150px',
          }}
        />

        {/* Sunburst behind image area */}
        <div className="relative overflow-hidden" style={{ height: 180 }}>
          {/* Radial glow */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 100%, ${color}22 0%, transparent 70%)`,
            }}
          />
          {/* Spinning rays */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] spin-slow">
            {[...Array(18)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-white origin-bottom"
                style={{ width: 2, height: 140, transform: `rotate(${i * 20}deg)`, bottom: '50%' }}
              />
            ))}
          </div>

          {/* Tier badge — top left */}
          <div
            className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}99)`,
              boxShadow: `0 0 12px ${color}88`,
            }}
          >
            <span className="font-orbitron text-[10px] font-black text-black tracking-wider">
              {TIER_LABEL[player.tier]}
            </span>
          </div>

          {/* Jersey number — top right */}
          <div
            className="absolute top-3 right-3 z-20 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}bb)`,
              boxShadow: `0 0 16px ${color}66`,
            }}
          >
            <span className="font-orbitron text-base font-black text-black">
              #{player.jersey_number}
            </span>
          </div>

          {/* Stat pills — left side, anchored to top so image doesn't occlude values */}
          <div className="absolute left-3 top-12 z-20 flex flex-col gap-1.5">
            {[
              { label: 'TEC', val: player.technique,   color: STAT_COLORS.technique },
              { label: 'PHY', val: player.physicality, color: STAT_COLORS.physicality },
              { label: 'VIS', val: player.vision,      color: STAT_COLORS.vision },
            ].map(s => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', border: `1px solid ${s.color}44` }}
              >
                <span className="font-orbitron text-[9px] font-black" style={{ color: s.color }}>{s.label}</span>
                <span className="font-orbitron text-sm font-black text-white">{s.val}</span>
              </div>
            ))}
          </div>

          {/* Team badge + flag — right side */}
          <div className="absolute right-3 bottom-4 z-20 flex flex-col items-center gap-2">
            <div
              className="w-11 h-13 flex items-center justify-center rounded-b-2xl rounded-t-sm px-1 py-1.5 text-[9px] font-black text-center text-white leading-tight"
              style={{
                background: `linear-gradient(180deg, #1A3C6E 0%, ${color}cc 100%)`,
                border: `1px solid ${color}66`,
                minHeight: 48,
              }}
            >
              {shortName}
            </div>
            <div
              className="w-9 h-6 rounded flex items-center justify-center text-sm"
              style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${color}44` }}
            >
              🇮🇳
            </div>
          </div>
        </div>

        {/* Divider glow line */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${color}88, transparent)` }} />

        {/* ── Name + position ── */}
        <div
          className="px-4 py-3"
          style={{ background: `linear-gradient(90deg, ${color}18 0%, transparent 100%)` }}
        >
          <p className="font-orbitron text-xl font-black tracking-wide leading-tight truncate"
            style={{ color: tierGlow, textShadow: `0 0 20px ${tierGlow}66` }}>
            {player.name}
          </p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="font-rajdhani text-sm font-bold tracking-widest uppercase text-white/80">
              {player.position}
            </p>
            {player.apartment && (
              <p className="text-[10px] text-white/40 tracking-wide">🏠 {player.apartment}</p>
            )}
          </div>
        </div>

        {/* Stars row */}
        <div className="px-4 pb-2 flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => {
            const fill = Math.min(1, Math.max(0, stars - i))
            if (fill >= 1) {
              // Full star
              return (
                <span key={i} className="text-base" style={{ color: tierGlow, textShadow: `0 0 8px ${tierGlow}` }}>★</span>
              )
            } else if (fill > 0) {
              // Partial star via clip
              return (
                <span key={i} className="relative text-base inline-block" style={{ color: 'rgba(255,255,255,0.1)' }}>
                  ★
                  <span
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${fill * 100}%`, color: tierGlow, textShadow: `0 0 8px ${tierGlow}` }}
                  >★</span>
                </span>
              )
            } else {
              return (
                <span key={i} className="text-base" style={{ color: 'rgba(255,255,255,0.1)' }}>★</span>
              )
            }
          })}
        </div>

        {/* Divider */}
        <div className="mx-4" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* ── Stat bars ── */}
        <div className="px-4 pt-3 pb-1">
          <StatRow label="Pace"       value={player.pace}       color={STAT_COLORS.pace} />
          <StatRow label="Stamina"    value={player.stamina}    color={STAT_COLORS.stamina} />
          <StatRow label="Aggression" value={player.aggression} color={STAT_COLORS.aggression} />
        </div>

        {/* Divider */}
        <div className="mx-4 mt-1" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* ── Base bid / Final bid ── */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-widest">Base Bid</p>
            <p className="font-orbitron text-sm font-black" style={{ color: tierGlow, textShadow: `0 0 12px ${tierGlow}88` }}>
              ₹{(baseBid / 1000).toFixed(0)}K
            </p>
          </div>

          {showStatus && player.final_bid && (
            <div className="text-center">
              <p className="text-[9px] text-white/30 uppercase tracking-widest">Final Bid</p>
              <p className="font-orbitron text-sm font-black text-green-400" style={{ textShadow: '0 0 12px #22C55E88' }}>
                ₹{(player.final_bid / 1000).toFixed(0)}K
              </p>
            </div>
          )}

          {/* IFC crest watermark */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center opacity-40"
            style={{ border: `1px solid ${color}55` }}
          >
            <svg viewBox="0 0 32 32" className="w-5 h-5" fill="white">
              <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="1.5" fill="none"/>
              <path d="M16 4 L20 12 L16 10 L12 12 Z" fill="white"/>
              <path d="M28 20 L20 18 L22 14 L26 18 Z" fill="white"/>
              <path d="M22 28 L16 22 L20 20 L22 26 Z" fill="white"/>
              <path d="M10 28 L12 22 L16 24 L10 28 Z" fill="white"/>
              <path d="M4 20 L8 16 L10 20 L4 22 Z" fill="white"/>
            </svg>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            height: 3,
            background: `linear-gradient(90deg, transparent, ${color}, ${color}, transparent)`,
            opacity: 0.8,
          }}
        />
      </div>
    </div>
  )
}
