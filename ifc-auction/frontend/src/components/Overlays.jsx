import { motion, AnimatePresence } from 'framer-motion'
import PlayerCard from './PlayerCard'

function Particle({ color }) {
  const x = (Math.random() - 0.5) * 600
  const y = (Math.random() - 0.5) * 600
  const size = Math.random() * 8 + 4
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, background: color, top: '50%', left: '50%' }}
      initial={{ x: 0, y: 0, opacity: 1 }}
      animate={{ x, y, opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    />
  )
}

export function SoldOverlay({ player, team, onDone }) {
  const teamColor = team?.color || '#FFD700'

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={onDone}
      >
        {/* Particle burst */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {[...Array(40)].map((_, i) => (
            <Particle key={i} color={i % 2 === 0 ? teamColor : '#FFD700'} />
          ))}
        </div>

        {/* Card zoom-in */}
        <motion.div
          className="flex flex-col items-center gap-6 z-10"
          initial={{ scale: 0.2, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          <motion.div
            className="font-orbitron text-5xl font-black tracking-widest"
            style={{ color: teamColor, textShadow: `0 0 40px ${teamColor}` }}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            SOLD!
          </motion.div>

          <PlayerCard player={player} teamColor={teamColor} teamName={team?.team_name} showStatus />

          <motion.div
            className="text-center"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="font-rajdhani text-2xl font-bold text-white">
              Going to <span style={{ color: teamColor }}>{team?.team_name}</span>
            </p>
            <p className="font-orbitron text-3xl font-black text-yellow-400 mt-1">
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
            Click anywhere to continue
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

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

          {/* Greyed-out card */}
          <motion.div
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

export function PlayerUpOverlay({ player, onDone }) {
  const tierColors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }
  const color = tierColors[player?.tier] || '#FFD700'

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'radial-gradient(ellipse at center, #0D1B3E 0%, #000 100%)' }}
        onClick={onDone}
      >
        {/* Spotlight beams */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bottom-0 left-1/2 origin-bottom"
              style={{
                width: '4px',
                height: '80vh',
                background: `linear-gradient(to top, ${color}44, transparent)`,
                transform: `translateX(-50%) rotate(${(i - 2.5) * 15}deg)`,
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
            />
          ))}
        </div>

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

          <PlayerCard player={player} teamColor={color} />

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
