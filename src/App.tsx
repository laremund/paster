import { useState } from 'react';
import './App.css';
import type { PasterItem } from './types';
import { loadItems, saveItems, createItem, updateItem, deleteItems } from './utils/storage';
import { copyToClipboard } from './utils/clipboard';

type AppState = 'default' | 'editItem';

function App() {
  const [items, setItems] = useState<PasterItem[]>(() => loadItems());
  const [state, setState] = useState<AppState>('default');
  const [editingItem, setEditingItem] = useState<PasterItem | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editContent, setEditContent] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [pressedItemId, setPressedItemId] = useState<string | null>(null);

  // Show toast notification
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  // Copy to clipboard with mousedown feedback
  const handleCopy = async (content: string) => {
    if (state !== 'default') return;
    const success = await copyToClipboard(content);
    if (success) {
      showToast('Copied!');
    }
  };

  // Handle content mousedown
  const handleContentMouseDown = (itemId: string) => {
    setPressedItemId(itemId);
  };

  // Handle content mouseup
  const handleContentMouseUp = () => {
    setPressedItemId(null);
  };

  // Handle content click
  const handleContentClick = async (content: string) => {
    await handleCopy(content);
    setPressedItemId(null);
  };

  // Start editing an item
  const startEdit = (item: PasterItem | null) => {
    if (item) {
      setEditingItem(item);
      setEditLabel(item.label);
      setEditContent(item.content);
    } else {
      // New item
      setEditingItem(null);
      setEditLabel('');
      setEditContent('');
    }
    setState('editItem');
  };

  // Cancel editing
  const cancelEdit = () => {
    setState('default');
    setEditingItem(null);
    setEditLabel('');
    setEditContent('');
  };

  // Save item (create or update)
  const handleSave = () => {
    if (!editLabel.trim() || !editContent.trim()) return;

    let updated: PasterItem[];
    if (editingItem) {
      // Update existing
      updated = updateItem(items, editingItem.id, editLabel.trim(), editContent.trim());
    } else {
      // Create new
      const newItem = createItem(editLabel.trim(), editContent.trim());
      updated = [...items, newItem];
    }

    setItems(updated);
    saveItems(updated);
    setState('default');
    setEditingItem(null);
    setEditLabel('');
    setEditContent('');
  };

  // Delete item
  const handleDelete = (id: string) => {
    const updated = deleteItems(items, [id]);
    setItems(updated);
    saveItems(updated);
  };

  return (
    <div className="min-h-screen bg-[#e8e4d9]">
      {/* Header */}
      <header className="bg-[#6b9fff] text-white px-6 py-4 flex items-center gap-3">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
        </svg>
        <h1 className="text-xl font-medium">Paster</h1>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-8 min-h-[600px] relative">
        {/* Items List */}
        <div className="space-y-8 pb-24">
          {/* Edit Form - shown when adding/editing */}
          {state === 'editItem' && (
            <div className="space-y-3">
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="New Item"
                className="w-full border-2 border-gray-900 bg-white p-3 text-base focus:outline-none"
              />
              
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="New Item text"
                rows={4}
                className="w-full border-2 border-gray-900 bg-white p-3 text-base focus:outline-none resize-none"
              />
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSave}
                  disabled={!editLabel.trim() || !editContent.trim()}
                  className="px-6 py-2 bg-[#d4d0c5] text-gray-900 border-2 border-gray-900 hover:bg-[#c9c5ba] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  OK
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-6 py-2 bg-[#d4d0c5] text-gray-900 border-2 border-gray-900 hover:bg-[#c9c5ba] transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {items.length === 0 && state === 'default' ? (
            <div className="text-center py-12">
              <p className="text-gray-700 text-lg mb-4">No items yet. Add your first snippet!</p>
            </div>
          ) : (
            items
              .filter((item) => state === 'default' || !editingItem || item.id !== editingItem.id)
              .map((item) => (
                <div key={item.id} className="space-y-3">
                  <div className="flex justify-between items-center border-b-2 border-gray-900 pb-2">
                    <label className="text-base font-normal text-gray-900">
                      {item.label}
                    </label>
                    {state === 'default' && (
                      <div className="flex gap-3">
                        {/* Edit Icon */}
                        <button
                          onClick={() => startEdit(item)}
                          className="hover:opacity-70 transition"
                          aria-label="Edit"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {/* Delete Icon */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="hover:opacity-70 transition"
                          aria-label="Delete"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div
                    onMouseDown={() => state === 'default' && handleContentMouseDown(item.id)}
                    onMouseUp={handleContentMouseUp}
                    onMouseLeave={handleContentMouseUp}
                    onClick={() => state === 'default' && handleContentClick(item.content)}
                    className={`p-4 transition-all ${
                      state === 'default' 
                        ? `cursor-pointer ${
                            pressedItemId === item.id
                              ? 'bg-[#6b9fff] text-white border-2 border-[#6b9fff]'
                              : 'border-2 border-gray-900 bg-[#d4d0c5] hover:bg-[#c9c5ba]'
                          }`
                        : 'border-2 border-gray-900 bg-[#d4d0c5]'
                    }`}
                  >
                    <pre className="whitespace-pre-wrap text-base font-mono">
                      {item.content}
                    </pre>
                  </div>
                </div>
              ))
          )}
        </div>
        
        {/* Bottom button */}
        <div className="fixed bottom-8 right-8">
          <button
            onClick={() => startEdit(null)}
            className="px-6 py-2 bg-[#d4d0c5] text-gray-900 border-2 border-gray-900 hover:bg-[#c9c5ba] transition"
          >
            Add new
          </button>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 right-8 bg-gray-800 text-white px-6 py-3 shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;