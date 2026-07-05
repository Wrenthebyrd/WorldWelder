import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, ShieldAlert } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { sha256Hex } from '@/lib/hash'
import type { Settings } from '@/db'

interface PasscodeLockProps {
  settings: Settings
  onUnlock: () => void
}

export function PasscodeLock({ settings, onUnlock }: PasscodeLockProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pin) return
    setChecking(true)
    const hash = await sha256Hex(pin)
    setChecking(false)
    if (hash === settings.passcodeHash) {
      sessionStorage.setItem('ww_session_unlocked', '1')
      if (settings.rememberDevice) {
        localStorage.setItem('ww_device_unlocked', settings.passcodeHash ?? '')
      }
      onUnlock()
    } else {
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 1600)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(800px 500px at 50% 30%, var(--glow), transparent 65%)',
          }}
        />
      </div>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative glass rounded-2xl p-8 w-full max-w-xs flex flex-col items-center"
      >
        <Logo size={56} spin />
        <h1 className="font-display text-xl mt-4 mb-1 glow-text">WorldWelder</h1>
        <p className="text-xs text-ink-dim mb-6 flex items-center gap-1">
          <Lock size={11} /> Enter your passcode
        </p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full text-center tracking-[0.5em] text-lg bg-bg-elevated border border-panel-border rounded-xl py-3 outline-none focus:border-accent-a transition-colors"
          placeholder="••••"
        />
        {error && (
          <p className="text-red-400 text-xs mt-3 flex items-center gap-1">
            <ShieldAlert size={12} /> Incorrect passcode
          </p>
        )}
        <button
          type="submit"
          disabled={checking || !pin}
          className="mt-5 w-full py-2.5 rounded-xl bg-accent-a text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {checking ? 'Verifying…' : 'Unlock'}
        </button>
      </motion.form>
    </div>
  )
}
