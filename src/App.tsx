import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { FolderOpen } from 'lucide-react'
import { db } from '@/db'
import { useUIStore } from '@/store/uiStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import { PasscodeLock } from '@/components/shell/PasscodeLock'
import { ProjectRail } from '@/components/shell/ProjectRail'
import { NavSidebar } from '@/components/shell/NavSidebar'
import { MobileTopBar } from '@/components/shell/MobileTopBar'
import { MobileDrawer } from '@/components/shell/MobileDrawer'
import { Dashboard } from '@/views/Dashboard'
import { WorldView } from '@/views/WorldView'
import { CharactersView } from '@/views/CharactersView'
import { ChaptersView } from '@/views/ChaptersView'
import { PublishView } from '@/views/PublishView'
import { SettingsView } from '@/views/SettingsView'
import { Logo } from '@/components/common/Logo'
import { EmptyState } from '@/components/common/EmptyState'

function NoProjectPrompt() {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No project selected"
      description="Choose a project from the menu, or forge a new one, to start working here."
    />
  )
}

function SplashScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-bg">
      <Logo size={48} spin />
    </div>
  )
}

function App() {
  const settings = useLiveQuery(() => db.settings.get(1), [])
  const { unlocked, setUnlocked, activeProjectId, section } = useUIStore()
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const project =
    useLiveQuery(() => (activeProjectId ? db.projects.get(activeProjectId) : undefined), [activeProjectId]) ?? null

  useEffect(() => {
    if (!settings) return
    document.documentElement.classList.toggle('dark', settings.theme === 'dark')
  }, [settings?.theme])

  useEffect(() => {
    if (!settings) return
    if (!settings.lockEnabled || !settings.passcodeHash) {
      setUnlocked(true)
      return
    }
    const sessionOk = sessionStorage.getItem('ww_session_unlocked') === '1'
    const deviceOk = settings.rememberDevice && localStorage.getItem('ww_device_unlocked') === settings.passcodeHash
    if (sessionOk || deviceOk) setUnlocked(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.lockEnabled, settings?.passcodeHash, settings?.rememberDevice])

  if (!settings) return <SplashScreen />

  if (settings.lockEnabled && settings.passcodeHash && !unlocked) {
    return <PasscodeLock settings={settings} onUnlock={() => setUnlocked(true)} />
  }

  const content = (
    <>
      {section === 'dashboard' && <Dashboard project={project} />}
      {section === 'world' && (project ? <WorldView projectId={project.id!} /> : <NoProjectPrompt />)}
      {section === 'characters' && (project ? <CharactersView projectId={project.id!} /> : <NoProjectPrompt />)}
      {section === 'chapters' && (project ? <ChaptersView projectId={project.id!} /> : <NoProjectPrompt />)}
      {section === 'publish' && <PublishView project={project} />}
      {section === 'settings' && <SettingsView />}
    </>
  )

  if (isMobile) {
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden relative z-10">
        <MobileTopBar onOpenDrawer={() => setDrawerOpen(true)} />
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <main className="flex-1 min-h-0 overflow-y-auto rune-scrollbar">{content}</main>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden relative z-10">
      <ProjectRail />
      <NavSidebar />
      <main className="flex-1 overflow-y-auto rune-scrollbar">{content}</main>
    </div>
  )
}

export default App
