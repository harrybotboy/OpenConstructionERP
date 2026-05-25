import { create } from 'zustand';

const STORAGE_KEY = 'oe_hidden_nav_groups';

function readHidden(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set<string>(parsed);
    }
  } catch {
    /* ignore */
  }
  return new Set();
}

function writeHidden(hidden: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...hidden]));
  } catch {
    /* ignore */
  }
}

interface NavVisibilityState {
  hiddenGroups: Set<string>;
  isGroupHidden: (groupId: string) => boolean;
  toggleGroup: (groupId: string) => void;
  showAll: () => void;
}

export const useNavVisibilityStore = create<NavVisibilityState>((set, get) => ({
  hiddenGroups: readHidden(),

  isGroupHidden: (groupId: string) => get().hiddenGroups.has(groupId),

  toggleGroup: (groupId: string) => {
    const next = new Set(get().hiddenGroups);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    writeHidden(next);
    set({ hiddenGroups: next });
  },

  showAll: () => {
    writeHidden(new Set());
    set({ hiddenGroups: new Set() });
  },
}));
