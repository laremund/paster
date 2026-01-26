import type { PasterItem } from '../types';

const STORAGE_KEY = 'paster_items';

export const loadItems = (): PasterItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const saveItems = (items: PasterItem[]): void => {
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
): PasterItem[] => {
  return items.map((item) =>
    item.id === id ? { ...item, label, content } : item
  );
};

export const deleteItems = (
  items: PasterItem[],
  ids: string[]
): PasterItem[] => {
  return items.filter((item) => !ids.includes(item.id));
};
