import { useState, useEffect } from 'react';
import './App.css';
import type { PasterItem } from './types';
import { loadItems, saveItems, createItem, updateItem, deleteItems } from './utils/storage';
import { copyToClipboard } from './utils/clipboard';

type AppState = 'default' | 'editList' | 'editItem';

function App() {
  const [items, setItems] = useState<PasterItem[]>([]);
  const [state, setState] = useState<AppState>('default');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<PasterItem | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editContent, setEditContent] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Load items on mount
  useEffect(() => {
    const loaded = loadItems();
    setItems(loaded);
  }, []);

  // Show toast notification
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  // Copy to clipboard
  const handleCopy = async (content: string) => {
    if (state !== 'default') return;
    const success = await copyToClipboard(content);
    if (success) {
      showToast('Copied!');
    }
  };

  // Toggle edit list mode
  const toggleEditList = () => {
    if (state === 'editList') {
      setState('default');
      setSelectedIds(new Set());
    } else {
      setState('editList');
    }
  };

  // Toggle item selection for deletion
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Delete selected items
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const updated = deleteItems(items, Array.from(selectedIds));
    setItems(updated);
    saveItems(updated);
    setSelectedIds(new Set());
    setState('default');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">PASTER</h1>
          {state === 'editList' ? (
            <div className="flex gap-2">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  Delete Selected ({selectedIds.size})
                </button>
              )}
              <button
                onClick={toggleEditList}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                Done
              </button>
            </div>
          ) : state === 'default' ? (
            <button
              onClick={toggleEditList}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Edit List
            </button>
          ) : null}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* State A: Default View */}
        {state === 'default' && (
          <div className="space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No items yet. Add your first snippet!</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      LABEL: {item.label}
                    </label>
                    <button
                      onClick={() => startEdit(item)}
                      className="text-gray-500 hover:text-gray-700 transition"
                      title="Edit"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </div>
                  <div
                    onClick={() => handleCopy(item.content)}
                    className="border-2 border-gray-300 rounded p-4 bg-gray-50 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition group relative"
                  >
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                      {item.content}
                    </pre>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div className="text-center pt-4">
              <button
                onClick={() => startEdit(null)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                + Add New Item
              </button>
            </div>
          </div>
        )}

        {/* State B: Edit List Mode */}
        {state === 'editList' && (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelection(item.id)}
                    className="w-5 h-5 text-red-600 rounded"
                  />
                  <button
                    onClick={() => toggleSelection(item.id)}
                    className="text-red-600 font-medium hover:text-red-700"
                  >
                    DELETE
                  </button>
                  <label className="text-sm font-medium text-gray-700">
                    LABEL: {item.label}
                  </label>
                </div>
                <div className="border-2 border-gray-200 rounded p-4 bg-gray-100 opacity-60">
                  <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono">
                    {item.content}
                  </pre>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No items to delete.</p>
              </div>
            )}
          </div>
        )}

        {/* State C: Single Item Edit Mode */}
        {state === 'editItem' && (
          <div className="space-y-6">
            {/* Show other items in background */}
            {items
              .filter((item) => !editingItem || item.id !== editingItem.id)
              .map((item) => (
                <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 opacity-50">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      LABEL: {item.label}
                    </label>
                    <button
                      onClick={() => startEdit(item)}
                      className="text-gray-500 hover:text-gray-700 transition"
                      title="Edit"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="border-2 border-gray-200 rounded p-4 bg-gray-50">
                    <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono">
                      {item.content}
                    </pre>
                  </div>
                </div>
              ))}

            {/* Divider */}
            <div className="border-t border-gray-300 my-6"></div>

            {/* Edit Form */}
            <div className="bg-white rounded-lg border-2 border-blue-500 p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Label Input:
                </label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Enter label..."
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Input:
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Enter content..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={cancelEdit}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!editLabel.trim() || !editContent.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300 my-6"></div>

            {/* Add New Item Button */}
            <div className="text-center">
              <button
                onClick={() => startEdit(null)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                + Add New Item
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
