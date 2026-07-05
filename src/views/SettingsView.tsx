import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Lock,
  ShieldCheck,
  Download,
  Upload,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { db } from '@/db'
import { sha256Hex } from '@/lib/hash'
import { exportBackup, importBackup } from '@/lib/backup'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

export function SettingsView() {
  const settings = useLiveQuery(() => db.settings.get(1), [])
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSaved, setPinSaved] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState<File | null>(null)
  const [backupDone, setBackupDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!settings) return null

  async function setTheme(theme: 'light' | 'dark') {
    await db.settings.put({ ...settings!, theme, id: 1 })
  }

  async function savePasscode() {
    setPinError('')
    if (pin1.length < 4) {
      setPinError('Use at least 4 digits')
      return
    }
    if (pin1 !== pin2) {
      setPinError('Passcodes do not match')
      return
    }
    const hash = await sha256Hex(pin1)
    await db.settings.put({ ...settings!, passcodeHash: hash, lockEnabled: true, id: 1 })
    setPin1('')
    setPin2('')
    setPinSaved(true)
    setTimeout(() => setPinSaved(false), 2000)
  }

  async function removePasscode() {
    await db.settings.put({ ...settings!, passcodeHash: null, lockEnabled: false, rememberDevice: false, id: 1 })
    localStorage.removeItem('ww_device_unlocked')
    setConfirmRemove(false)
  }

  async function toggleRememberDevice() {
    const next = !settings!.rememberDevice
    await db.settings.put({ ...settings!, rememberDevice: next, id: 1 })
    if (!next) localStorage.removeItem('ww_device_unlocked')
  }

  async function handleExport() {
    await exportBackup()
    setBackupDone(true)
    setTimeout(() => setBackupDone(false), 2000)
  }

  async function handleRestore() {
    if (!confirmRestore) return
    await importBackup(confirmRestore)
    setConfirmRestore(null)
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <div className="flex items-center gap-3 mb-8">
        <span className="w-11 h-11 rounded-2xl flex items-center justify-center bg-accent-a/15 text-accent-a">
          <SettingsIcon size={20} />
        </span>
        <h1 className="font-display text-2xl text-ink">Settings</h1>
      </div>

      <section className="glass rounded-2xl p-5 mb-5">
        <h2 className="text-sm font-medium text-ink mb-3">Appearance</h2>
        <div className="flex rounded-xl bg-bg-elevated p-1 text-xs w-fit">
          <button
            onClick={() => setTheme('light')}
            className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              settings.theme === 'light' ? 'bg-accent-a text-white' : 'text-ink-dim hover:text-ink'
            }`}
          >
            <Sun size={13} /> Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              settings.theme === 'dark' ? 'bg-accent-a text-white' : 'text-ink-dim hover:text-ink'
            }`}
          >
            <Moon size={13} /> Dark
          </button>
        </div>
      </section>

      <section className="glass rounded-2xl p-5 mb-5">
        <h2 className="text-sm font-medium text-ink mb-1 flex items-center gap-1.5">
          <Lock size={14} /> Passcode lock
        </h2>
        <p className="text-xs text-ink-dim mb-4 flex items-start gap-1.5">
          <Info size={12} className="mt-0.5 shrink-0" />A local convenience lock for this device/browser — not
          strong security. Your data never leaves your browser regardless.
        </p>

        {settings.passcodeHash ? (
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-ink flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-accent-b" /> Passcode is set
            </span>
            <button
              onClick={() => setConfirmRemove(true)}
              className="text-xs text-red-400 hover:opacity-80"
            >
              Remove passcode
            </button>
          </div>
        ) : (
          <p className="text-xs text-ink-dim mb-4">No passcode set — the app is unlocked for anyone with this URL.</p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-2">
          <input
            type="password"
            inputMode="numeric"
            value={pin1}
            onChange={(e) => setPin1(e.target.value)}
            placeholder="New passcode"
            className="bg-bg-elevated border border-panel-border rounded-xl px-3 py-2 text-sm outline-none focus:border-accent-a transition-colors"
          />
          <input
            type="password"
            inputMode="numeric"
            value={pin2}
            onChange={(e) => setPin2(e.target.value)}
            placeholder="Confirm passcode"
            className="bg-bg-elevated border border-panel-border rounded-xl px-3 py-2 text-sm outline-none focus:border-accent-a transition-colors"
          />
        </div>
        {pinError && <p className="text-xs text-red-400 mb-2">{pinError}</p>}
        <button
          onClick={savePasscode}
          className="px-4 py-2 rounded-xl bg-accent-a text-white text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          {pinSaved ? (
            <>
              <CheckCircle2 size={13} /> Saved
            </>
          ) : (
            'Save passcode'
          )}
        </button>

        <label className="flex items-center gap-2 mt-4 text-xs text-ink-dim cursor-pointer">
          <input
            type="checkbox"
            checked={settings.rememberDevice}
            onChange={toggleRememberDevice}
            disabled={!settings.passcodeHash}
            className="accent-[var(--accent-a)]"
          />
          Remember this device (skip the lock screen on future visits)
        </label>
      </section>

      <section className="glass rounded-2xl p-5 mb-5">
        <h2 className="text-sm font-medium text-ink mb-1">Backup & Restore</h2>
        <p className="text-xs text-ink-dim mb-4">
          Your projects live in this browser only. Export a backup file regularly and keep it somewhere safe
          (cloud drive, USB) — restoring replaces everything currently in the app.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-accent-a/15 text-accent-a text-xs font-medium hover:bg-accent-a/25 transition-colors flex items-center gap-1.5"
          >
            {backupDone ? <CheckCircle2 size={13} /> : <Download size={13} />}
            {backupDone ? 'Backup saved' : 'Export backup'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-panel-border/30 text-ink text-xs font-medium hover:bg-panel-border/50 transition-colors flex items-center gap-1.5"
          >
            <Upload size={13} /> Import backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setConfirmRestore(file)
              e.target.value = ''
            }}
          />
        </div>
        {settings.lastBackupAt && (
          <p className="text-xs text-ink-dim mt-3">Last backup: {new Date(settings.lastBackupAt).toLocaleString()}</p>
        )}
      </section>

      <ConfirmDialog
        open={!!confirmRemove}
        title="Remove passcode?"
        description="Anyone with access to this app in this browser will be able to open it without a lock screen."
        confirmLabel="Remove"
        onConfirm={removePasscode}
        onCancel={() => setConfirmRemove(false)}
      />
      <ConfirmDialog
        open={!!confirmRestore}
        title="Restore this backup?"
        description="This will replace all projects, chapters, characters, and world entries currently in the app with the contents of this backup file. This cannot be undone."
        confirmLabel="Restore"
        onConfirm={handleRestore}
        onCancel={() => setConfirmRestore(null)}
      />
    </div>
  )
}
