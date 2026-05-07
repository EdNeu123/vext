import { create } from 'zustand';

const STORAGE_KEY = 'vext-dark';

const readInitialDark = (): boolean => {
  if (typeof window === 'undefined') return false;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  // Default: LIGHT (false) — igual ao protótipo do design
  if (stored === null) return false;
  return stored === 'true';
};

const applyDarkClass = (dark: boolean) => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', dark);
};

// Aplica imediatamente ao carregar pra evitar flash do tema errado
applyDarkClass(readInitialDark());

interface UiStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  dark: boolean;
  toggleDark: () => void;
  setDark: (dark: boolean) => void;
}

export const useUiStore = create<UiStore>((set, get) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  dark: readInitialDark(),
  toggleDark: () => {
    const next = !get().dark;
    applyDarkClass(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    }
    set({ dark: next });
  },
  setDark: (dark) => {
    applyDarkClass(dark);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(dark));
    }
    set({ dark });
  },
}));
