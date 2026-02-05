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
      updated = [newItem, ...items];
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
        <h1 className="text-xl font-medium">Paster</h1>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-8 min-h-[600px] relative">
        {/* Items List */}
        <div className="space-y-8 pb-24">
          {/* Edit Form - shown at top only when adding new item */}
          {state === 'editItem' && !editingItem && (
            <div className="space-y-3 border-2 border-t-white border-l-white border-r-gray-900 border-b-gray-900  p-4">
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="New Item"
                className="w-full border-2 border-t-gray-900 border-l-gray-900 border-r-[#e8e4d9] border-b-[#e8e4d9] bg-white p-3 text-base focus:outline-none"
              />
              
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="New Item text"
                rows={4}
                className="w-full border-2 border-t-gray-900 border-l-gray-900 border-r-[#e8e4d9] border-b-[#e8e4d9] bg-white p-3 text-base focus:outline-none resize-none"
              />
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSave}
                  disabled={!editLabel.trim() || !editContent.trim()}
                  className="px-6 py-2  text-gray-900 border-2 border-t-white border-l-white border-r-gray-900 border-b-gray-900 hover:bg-[#d4d0c5] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:border-t-gray-900 active:border-l-gray-900 active:border-r-white active:border-b-white"
                >
                  OK
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-6 py-2  text-gray-900 border-2 border-t-white border-l-white border-r-gray-900 border-b-gray-900 hover:bg-[#d4d0c5] transition cursor-pointer active:border-t-gray-900 active:border-l-gray-900 active:border-r-white active:border-b-white"
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
            items.map((item) => {
              const isEditingThis = state === 'editItem' && editingItem?.id === item.id;
              return (
                <div key={item.id} className="space-y-3">
                  {isEditingThis ? (
                    <div className="border-2 border-t-white border-l-white border-r-gray-900 border-b-gray-900 p-4 space-y-3">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="New Item"
                        className="w-full border-2 border-t-gray-900 border-l-gray-900 border-r-[#e8e4d9] border-b-[#e8e4d9] bg-white p-3 text-base focus:outline-none"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="New Item text"
                        rows={4}
                        className="w-full border-2 border-t-gray-900 border-l-gray-900 border-r-[#e8e4d9] border-b-[#e8e4d9] bg-white p-3 text-base focus:outline-none resize-none"
                      />
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={handleSave}
                          disabled={!editLabel.trim() || !editContent.trim()}
                          className="px-6 py-2  text-gray-900 border-2 border-t-white border-l-white border-r-gray-900 border-b-gray-900 hover:bg-[#d4d0c5] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:border-t-gray-900 active:border-l-gray-900 active:border-r-white active:border-b-white"
                        >
                          OK
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-6 py-2  text-gray-900 border-2 border-t-white border-l-white border-r-gray-900 border-b-gray-900 hover:bg-[#d4d0c5] transition cursor-pointer active:border-t-gray-900 active:border-l-gray-900 active:border-r-white active:border-b-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex justify-between items-center pb-2">
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
                                <img src="/pencil_icon.png" alt="" className="w-6 h-6 cursor-pointer" />
                              </button>
                              {/* Delete Icon */}
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="hover:opacity-70 transition"
                                aria-label="Delete"
                              >
                                <svg className="w-6 h-6 cursor-pointer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className='h-[5px] 
                                        border-t-1 border-t-[#c9c5ba]
                                        border-r-1 border-r-white 
                                        border-b-1 border-b-white
                                        border-l-1 border-l-[#c9c5ba]
                                        '
                        ></div>
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
                                  ? 'bg-[#6b9fff] text-white border-2 border-t-gray-900 border-l-gray-900 border-r-white border-b-white'
                                  : 'border-2 border-t-white border-l-white border-r-gray-900 border-b-gray-900  hover:bg-[#d4d0c5]'
                              }`
                            : 'border-2 border-t-white border-l-white border-r-gray-900 border-b-gray-900 '
                        }`}
                      >
                        <pre className="whitespace-pre-wrap text-base">
                          {item.content}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {/* Bottom button */}
        <div className="fixed bottom-8 right-8">
          <button
            onClick={() => startEdit(null)}
            className="px-6 py-2 bg-[#e8e4d9] text-gray-900 border-2 border-t-white border-l-white border-r-gray-900 border-b-gray-900 hover:bg-[#d4d0c5] transition cursor-pointer active:border-t-gray-900 active:border-l-gray-900 active:border-r-white active:border-b-white"
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