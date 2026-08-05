import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PlayerCard from './PlayerCard'

/* ── Shared AudioContext — created on first user gesture ── */
let _audioCtx = null
async function getAudioCtx() {
  if (window._sharedAudioCtx) _audioCtx = window._sharedAudioCtx
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (_audioCtx.state === 'suspended') await _audioCtx.resume()
  return _audioCtx
}

/* ── Audio: hammer strikes (7s) then crowd cheer (13s) ── */
async function playSoldAudio() {
  try {
    const ctx = await getAudioCtx()
    // Force resume in case browser suspended between the last click and now
    if (ctx.state === 'suspended') await ctx.resume()

    /* Heavy hammer strike */
    function strike(t) {
      // Deep thud
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.055))
      }
      const src = ctx.createBufferSource()
      src.buffer = buf
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(1.8, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 160
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
      src.start(t)

      // Crack
      const crack = ctx.createOscillator()
      const cg = ctx.createGain()
      crack.type = 'square'
      crack.frequency.setValueAtTime(140, t)
      crack.frequency.exponentialRampToValueAtTime(35, t + 0.18)
      cg.gain.setValueAtTime(0.9, t)
      cg.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
      crack.connect(cg); cg.connect(ctx.destination)
      crack.start(t); crack.stop(t + 0.2)
    }

    // 5 strikes spread over 7 seconds: 0, 1.4, 2.8, 4.5, 6.2
    const now = ctx.currentTime
    ;[0, 1.4, 2.8, 4.5, 6.2].forEach(offset => strike(now + offset))

    /* Crowd cheer synthesised: starts at 7s, lasts 5s (ends at 12s) */
    function startCheer(startT) {
      const duration = 5

      // Crowd noise base — filtered white noise swell
      const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate)
      const nd = noiseBuf.getChannelData(0)
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1
      const noise = ctx.createBufferSource()
      noise.buffer = noiseBuf

      const bandpass = ctx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.value = 1200
      bandpass.Q.value = 0.6

      const cheerGain = ctx.createGain()
      cheerGain.gain.setValueAtTime(0, startT)
      cheerGain.gain.linearRampToValueAtTime(0.55, startT + 1.0)   // swell in
      cheerGain.gain.setValueAtTime(0.55, startT + 3.5)
      cheerGain.gain.linearRampToValueAtTime(0, startT + duration)  // fade out

      noise.connect(bandpass); bandpass.connect(cheerGain); cheerGain.connect(ctx.destination)
      noise.start(startT); noise.stop(startT + duration)

      // Rhythmic chant pulses on top
      for (let p = 0; p < 3; p++) {
        const pt = startT + 0.5 + p * 1.2
        const pulse = ctx.createOscillator()
        const pg = ctx.createGain()
        pulse.type = 'sine'
        pulse.frequency.setValueAtTime(320 + Math.random() * 80, pt)
        pulse.frequency.linearRampToValueAtTime(260, pt + 0.4)
        pg.gain.setValueAtTime(0.18, pt)
        pg.gain.exponentialRampToValueAtTime(0.001, pt + 0.5)
        pulse.connect(pg); pg.connect(ctx.destination)
        pulse.start(pt); pulse.stop(pt + 0.5)
      }

      // High-pitched "yay" shimmer
      for (let s = 0; s < 5; s++) {
        const st = startT + Math.random() * 3.5
        const shimmer = ctx.createOscillator()
        const sg = ctx.createGain()
        shimmer.type = 'sine'
        shimmer.frequency.value = 800 + Math.random() * 600
        sg.gain.setValueAtTime(0.06, st)
        sg.gain.exponentialRampToValueAtTime(0.001, st + 0.6)
        shimmer.connect(sg); sg.connect(ctx.destination)
        shimmer.start(st); shimmer.stop(st + 0.6)
      }
    }

    startCheer(now + 7)
  } catch (_) {}
}

/* ── Confetti particle ── */
function Confetti({ color, x, delay }) {
  const yEnd = 120 + Math.random() * 60
  const xDrift = (Math.random() - 0.5) * 40
  const size = Math.random() * 10 + 6
  const isRect = Math.random() > 0.5
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        width: isRect ? size : size * 0.6,
        height: isRect ? size * 0.4 : size,
        background: color,
        borderRadius: isRect ? 2 : '50%',
        top: '-5%',
        left: `${x}%`,
      }}
      initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
      animate={{ y: `${yEnd}vh`, x: xDrift, rotate: 720, opacity: 0 }}
      transition={{ duration: 2.5 + Math.random() * 2, delay, ease: 'easeIn', repeat: Infinity, repeatDelay: Math.random() * 3 }}
    />
  )
}

/* ── Burst particle ── */
function Particle({ color }) {
  const x = (Math.random() - 0.5) * 700
  const y = (Math.random() - 0.5) * 700
  const size = Math.random() * 10 + 5
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, background: color, top: '50%', left: '50%' }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x, y, opacity: 0, scale: 0.3 }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
    />
  )
}

/* ── Auction hammer SVG ── */
function HammerIcon({ style, className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none">
      <rect x="10" y="30" width="48" height="22" rx="5" fill="#C8A040" stroke="#FFD700" strokeWidth="2" />
      <rect x="48" y="36" width="42" height="10" rx="4" fill="#8B6914" stroke="#C8A040" strokeWidth="1.5" />
      <rect x="10" y="34" width="48" height="7" rx="3" fill="#FFD700" opacity="0.3" />
    </svg>
  )
}

/* ── Firework burst ── */
function Firework({ x, y, color, delay }) {
  return (
    <div className="absolute pointer-events-none" style={{ left: `${x}%`, top: `${y}%` }}>
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * 360
        const dist = 40 + Math.random() * 30
        const rad = (angle * Math.PI) / 180
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ width: 5, height: 5, background: color, left: 0, top: 0 }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, opacity: 0, scale: 0 }}
            transition={{ duration: 0.9, delay, ease: 'easeOut', repeat: Infinity, repeatDelay: 2.5 + Math.random() * 2 }}
          />
        )
      })}
    </div>
  )
}

/* ════════════════════════════════════════
   SOLD OVERLAY
════════════════════════════════════════ */
export function SoldOverlay({ player, team, onDone }) {
  const teamColor = team?.color || '#FFD700'
  const confettiColors = [teamColor, '#FFD700', '#FF6B35', '#00D4FF', '#FF3366', '#A855F7', '#22C55E']

  useEffect(() => {
    playSoldAudio()
    const timer = setTimeout(onDone, 12000)
    return () => clearTimeout(timer)
  }, [])

  const fireworks = [
    { x: 15, y: 15, color: '#FFD700', delay: 0.1 },
    { x: 85, y: 10, color: teamColor, delay: 0.4 },
    { x: 10, y: 70, color: '#FF6B35', delay: 0.7 },
    { x: 80, y: 75, color: '#00D4FF', delay: 1.0 },
    { x: 50, y: 8,  color: '#FF3366', delay: 1.3 },
    { x: 25, y: 40, color: '#A855F7', delay: 1.6 },
    { x: 72, y: 45, color: '#FFD700', delay: 1.9 },
  ]

  const hammers = [
    { left: '5%',  top: '10%', size: 100, rotate: -30, delay: 0.2 },
    { left: '80%', top: '5%',  size: 80,  rotate: 40,  delay: 0.6 },
    { left: '3%',  top: '65%', size: 90,  rotate: -20, delay: 1.0 },
    { left: '82%', top: '60%', size: 85,  rotate: 50,  delay: 1.4 },
    { left: '45%', top: '3%',  size: 70,  rotate: 10,  delay: 0.9 },
  ]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          background: `radial-gradient(ellipse at center, ${teamColor}22 0%, rgba(0,0,0,0.92) 70%)`,
          backdropFilter: 'blur(6px)',
        }}
        onClick={onDone}
      >
        {/* Confetti rain */}
        {[...Array(60)].map((_, i) => (
          <Confetti
            key={i}
            color={confettiColors[i % confettiColors.length]}
            x={Math.random() * 100}
            delay={Math.random() * 1.5}
          />
        ))}

        {/* Fireworks */}
        {fireworks.map((fw, i) => (
          <Firework key={i} {...fw} />
        ))}

        {/* Burst particles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[...Array(60)].map((_, i) => (
            <Particle key={i} color={i % 3 === 0 ? teamColor : i % 3 === 1 ? '#FFD700' : '#fff'} />
          ))}
        </div>

        {/* Hammer icons around screen */}
        {hammers.map((h, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{ left: h.left, top: h.top, width: h.size, rotate: h.rotate }}
            initial={{ opacity: 0, scale: 0, rotate: h.rotate - 60 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.3, 1, 0.8], rotate: [h.rotate - 60, h.rotate + 20, h.rotate] }}
            transition={{ duration: 1.2, delay: h.delay, times: [0, 0.3, 0.6, 1] }}
          >
            <HammerIcon className="w-full h-full" />
          </motion.div>
        ))}

        {/* Pulsing ring behind card */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 420, height: 420, border: `3px solid ${teamColor}`, opacity: 0.3 }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />

        {/* Main content */}
        <motion.div
          className="flex flex-col items-center gap-5 z-10"
          initial={{ scale: 0.2, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          {/* SOLD banner */}
          <motion.div
            className="font-orbitron text-7xl font-black tracking-widest relative"
            style={{ color: teamColor, textShadow: `0 0 60px ${teamColor}, 0 0 120px ${teamColor}88` }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            SOLD!
            <motion.span
              className="absolute -right-12 -top-4 text-4xl"
              animate={{ rotate: [-20, 20, -20] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
            >
              🔨
            </motion.span>
          </motion.div>

          {/* Larger player card — scale wrapper */}
          <motion.div
            style={{ transform: 'scale(1.35)', transformOrigin: 'center top', marginBottom: '5rem' }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <PlayerCard player={player} teamColor={teamColor} teamName={team?.team_name} showStatus />
          </motion.div>

          <motion.div
            className="text-center"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="font-rajdhani text-3xl font-bold text-white">
              Going to <span style={{ color: teamColor }}>{team?.team_name}</span>
            </p>
            <p className="font-orbitron text-4xl font-black text-yellow-400 mt-1"
              style={{ textShadow: '0 0 30px #FFD70088' }}>
              ₹{player?.final_bid?.toLocaleString('en-IN')}
            </p>
            <p className="text-gray-400 text-sm mt-2">Led by {team?.marquee_player_name}</p>
          </motion.div>

          <motion.p
            className="text-gray-500 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            Click anywhere to continue · auto-closes in 12s
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ════════════════════════════════════════
   UNSOLD OVERLAY
════════════════════════════════════════ */
export function UnsoldOverlay({ player, onDone }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}
        onClick={onDone}
      >
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
        >
          <motion.div
            className="font-orbitron text-5xl font-black tracking-widest text-gray-500"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            UNSOLD
          </motion.div>

          <motion.div
            style={{ transform: 'scale(1.35)', transformOrigin: 'center top', marginBottom: '5rem' }}
            initial={{ filter: 'grayscale(0)' }}
            animate={{ filter: 'grayscale(1)', opacity: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <PlayerCard player={player} teamColor="#555" />
          </motion.div>

          <motion.p
            className="font-rajdhani text-xl text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {player?.name} goes unsold
          </motion.p>

          <motion.p
            className="text-gray-600 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            Click anywhere to continue
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ════════════════════════════════════════
   PLAYER UP OVERLAY
════════════════════════════════════════ */

const BIDDER_NAMES = [
  'Team Alpha', 'Red Lions', 'Blue Hawks', 'Gold Eagles',
  'Storm FC', 'Iron Wolves', 'Night Owls', 'Fire Squad',
]

function BidderBubble({ name, amount, x, y, delay }) {
  return (
    <motion.div
      className="absolute pointer-events-none flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{
        left: `${x}%`, top: `${y}%`,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
      }}
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: [0, 1, 1, 0], y: [20, 0, -5, -20], scale: [0.8, 1, 1, 0.9] }}
      transition={{ duration: 2.5, delay, repeat: Infinity, repeatDelay: Math.random() * 2 + 1 }}
    >
      <span className="text-lg">💰</span>
      <div>
        <p className="font-rajdhani text-xs font-bold text-white leading-none">{name}</p>
        <p className="font-orbitron text-xs text-yellow-400 font-black">₹{amount}K</p>
      </div>
    </motion.div>
  )
}

function BidWar() {
  const bidders = [
    { x: 2,  y: 15, delay: 0.3,  amount: 55 },
    { x: 75, y: 10, delay: 0.9,  amount: 65 },
    { x: 2,  y: 50, delay: 1.6,  amount: 70 },
    { x: 74, y: 48, delay: 2.2,  amount: 80 },
    { x: 5,  y: 78, delay: 0.6,  amount: 90 },
    { x: 72, y: 78, delay: 1.3,  amount: 100 },
  ]
  return (
    <>
      {bidders.map((b, i) => (
        <BidderBubble
          key={i}
          name={BIDDER_NAMES[i % BIDDER_NAMES.length]}
          amount={b.amount}
          x={b.x} y={b.y}
          delay={b.delay}
        />
      ))}
      {/* Escalating bid text center-bottom */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 font-orbitron text-xs tracking-widest uppercase"
        style={{ color: '#FFD700' }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
      >
        ⚡ Bidding War In Progress ⚡
      </motion.div>
    </>
  )
}

export function PlayerUpOverlay({ player, onDone }) {
  const tierColors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }
  const color = tierColors[player?.tier] || '#FFD700'

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'radial-gradient(ellipse at center, #0D1B3E 0%, #000 100%)' }}
        onClick={onDone}
      >
        {/* Spotlight beams */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bottom-0 left-1/2 origin-bottom"
              style={{
                width: '3px',
                height: '90vh',
                background: `linear-gradient(to top, ${color}55, transparent)`,
                transform: `translateX(-50%) rotate(${(i - 3.5) * 14}deg)`,
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: [0, 0.8, 0.4] }}
              transition={{ delay: i * 0.07, duration: 0.8 }}
            />
          ))}
        </div>

        {/* Bid war bubbles + label */}
        <BidWar />

        {/* Crowd energy pulses */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 200 + i * 120,
              height: 200 + i * 120,
              border: `1px solid ${color}44`,
            }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.5 }}
          />
        ))}

        {/* Main content */}
        <motion.div
          className="flex flex-col items-center gap-4 z-10"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        >
          <motion.p
            className="font-orbitron text-sm tracking-[0.4em] uppercase"
            style={{ color }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            Now Up For Auction
          </motion.p>

          {/* Larger player card */}
          <motion.div style={{ transform: 'scale(1.4)', transformOrigin: 'center top', marginBottom: '6rem' }}>
            <PlayerCard player={player} teamColor={color} />
          </motion.div>

          <motion.p
            className="text-gray-500 text-sm mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Click anywhere to dismiss
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
