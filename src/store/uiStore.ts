import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Section = 'dashboard' | 'world' | 'characters' | 'chapters' | 'publish' | 'settings'

interface UIState {
  activeProjectId: number | null
  section: Section
  sidebarExpanded: boolean
  railExpanded: boolean
  unlocked: boolean
  setActiveProject: (id: number | null) => void
  setSection: (s: Section) => void
  toggleSidebar: () => void
  toggleRail: () => void
  setUnlocked: (v: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeProjectId: null,
      section: 'dashboard',
      sidebarExpanded: true,
      railExpanded: false,
      unlocked: false,
      setActiveProject: (id) => set({ activeProjectId: id, section: 'dashboard' }),
      setSection: (s) => set({ section: s }),
      toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
      toggleRail: () => set((state) => ({ railExpanded: !state.railExpanded })),
      setUnlocked: (v) => set({ unlocked: v }),
    }),
    {
      name: 'ww-ui-state',
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        section: state.section,
        sidebarExpanded: state.sidebarExpanded,
        railExpanded: state.railExpanded,
      }),
    },
  ),
)
