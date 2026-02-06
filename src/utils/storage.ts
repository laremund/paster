import type { PasterItem } from '../types';

const STORAGE_KEY = 'paster_items';

declare global {
  interface Window {
    electronAPI?: {
      loadItems: () => Promise<unknown[]>;
      saveItems: (items: unknown[]) => Promise<void>;
    };
  }
}

function hasElectronStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined';
}

export const loadItems = (): PasterItem[] => {
  if (hasElectronStorage()) {
    // Electron storage is async; caller should use loadItemsAsync when in Electron
    return [];
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as PasterItem[];
  } catch {
    return [];
  }
};

export const loadItemsAsync = async (): Promise<PasterItem[]> => {
  if (hasElectronStorage()) {
    const items = await window.electronAPI!.loadItems();
    return Array.isArray(items) ? (items as PasterItem[]) : [];
  }
  return Promise.resolve(loadItems());
};

export const saveItems = async (items: PasterItem[]): Promise<void> => {
  if (hasElectronStorage()) {
    await window.electronAPI!.saveItems(items);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const createItem = (label: string, content: string): PasterItem => {
  const now = Date.now();
  return {
    id: String(now),
    label,
    content,
    createdAt: now,
  };
};

export const updateItem = (
  items: PasterItem[],
  id: string,
  label: string,
  content: string
): PasterItem[] =>
  items.map((item) => (item.id === id ? { ...item, label, content } : item));

export const deleteItems = (items: PasterItem[], ids: string[]): PasterItem[] =>
  items.filter((item) => !ids.includes(item.id));
