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
    <div className="min-h-screen bg-gray-200 p-8">

      {/* Main Content */}
      <main className="max-w-4xl mx-auto bg-gray-300 p-12 min-h-[600px] relative">
        {/* State A: Default View - Mode 1 */}
        {state === 'default' && (
          <div className="space-y-12">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-700 text-lg mb-4">No items yet. Add your first snippet!</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="space-y-3">
                  <div className="flex justify-between items-start">
                    <label className="text-base font-normal text-gray-900">
                      {item.label}
                    </label>
                    <button
                      onClick={() => startEdit(item)}
                      className="px-6 py-2 bg-gray-300 text-gray-900 border-2 border-gray-900 hover:bg-gray-400 transition text-sm"
                    >
                      Edit
                    </button>
                  </div>
                  <div
                    onClick={() => handleCopy(item.content)}
                    className="border-2 border-gray-900 bg-white p-4 cursor-pointer hover:bg-gray-50 transition"
                  >
                    <pre className="whitespace-pre-wrap text-base text-gray-900">
                      {item.content}
                    </pre>
                  </div>
                </div>
              ))
            )}
            
            {/* Bottom buttons */}
            <div className="absolute bottom-12 right-12 flex gap-4">
              <button
                onClick={toggleEditList}
                className="px-6 py-2 bg-gray-300 text-gray-900 border-2 border-gray-900 hover:bg-gray-400 transition"
              >
                Edit List
              </button>
              <button
                onClick={() => startEdit(null)}
                className="px-6 py-2 bg-gray-300 text-gray-900 border-2 border-gray-900 hover:bg-gray-400 transition"
              >
                Add New
              </button>
            </div>
          </div>
        )}

        {/* State B: Edit List Mode - Mode 2 */}
        {state === 'editList' && (
          <div className="space-y-12">
            {items.map((item) => (
              <div key={item.id} className="space-y-3">
                <div className="flex items-center border-b-2 border-gray-900 pb-2">
                  <label className="text-base font-normal text-gray-900">
                    {item.label}
                  </label>
                </div>
                <div className="border-2 border-gray-900 bg-white p-4">
                  <pre className="whitespace-pre-wrap text-base text-gray-900">
                    {item.content}
                  </pre>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-700">No items to display.</p>
              </div>
            )}
            
            {/* Bottom buttons */}
            <div className="absolute bottom-12 right-12 flex gap-4">
              <button
                onClick={toggleEditList}
                className="px-6 py-2 bg-gray-300 text-gray-900 border-2 border-gray-900 hover:bg-gray-400 transition"
              >
                OK
              </button>
              <button
                onClick={toggleEditList}
                className="px-6 py-2 bg-gray-300 text-gray-900 border-2 border-gray-900 hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* State C: Single Item Edit Mode - Mode 3 */}
        {state === 'editItem' && (
          <div className="space-y-12">
            {/* Currently editing item or new item */}
            <div className="space-y-3">
              {/* Label input box */}
              <div className="border-2 border-gray-900 bg-white p-4">
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Enter label..."
                  className="w-full px-0 py-0 border-0 focus:outline-none text-base bg-transparent"
                />
              </div>
              
              {/* Content box */}
              <div className="border-2 border-gray-900 bg-white p-4">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Enter content..."
                  rows={4}
                  className="w-full px-0 py-0 border-0 focus:outline-none text-base bg-transparent resize-none"
                />
              </div>
              
              {/* Buttons below content */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleSave}
                  disabled={!editLabel.trim() || !editContent.trim()}
                  className="px-6 py-2 bg-gray-300 text-gray-900 border-2 border-gray-900 hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  OK
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-6 py-2 bg-gray-300 text-gray-900 border-2 border-gray-900 hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Non-editing items */}
            {items
              .filter((item) => !editingItem || item.id !== editingItem.id)
              .map((item) => (
                <div key={item.id} className="space-y-3">
                  <div className="border-b-2 border-gray-900 pb-2">
                    <label className="text-base font-normal text-gray-900">
                      {item.label}
                    </label>
                  </div>
                  <div className="border-2 border-gray-900 bg-white p-4">
                    <pre className="whitespace-pre-wrap text-base text-gray-900">
                      {item.content}
                    </pre>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => startEdit(item)}
                      className="px-6 py-2 bg-gray-300 text-gray-900 border-2 border-gray-900 hover:bg-gray-400 transition text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            
            {/* Bottom buttons */}
            <div className="absolute bottom-12 right-12 flex gap-4">
              <button
                onClick={toggleEditList}
                className="px-6 py-2 bg-gray-300 text-gray-900 border-2 border-gray-900 hover:bg-gray-400 transition"
              >
                Edit List
              </button>
              <button
                onClick={() => startEdit(null)}
                className="px-6 py-2 bg-gray-300 text-gray-900 border-2 border-gray-900 hover:bg-gray-400 transition"
              >
                Add New
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;