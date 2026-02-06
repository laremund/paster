import { useState } from 'react';
import type { PasterItem } from './types';
import { loadItems, saveItems, createItem, updateItem, deleteItems } from './utils/storage';
import { copyToClipboard } from './utils/clipboard';

const inputClass =
  'w-full border-2 border-t-gray-900 border-l-gray-900 border-r-[#e8e4d9] border-b-[#e8e4d9] bg-white p-3 text-base focus:outline-none';
const btnClass =
  'px-6 py-2 text-gray-900 border-2 border-t-white border-l-white border-r-gray-900 border-b-gray-900 hover:bg-[#d4d0c5] transition cursor-pointer active:border-t-gray-900 active:border-l-gray-900 active:border-r-white active:border-b-white';
const btnDisabledClass = btnClass + ' disabled:opacity-50 disabled:cursor-not-allowed';
const iconBtnClass =
  'p-1 bg-[#e8e4d9] text-gray-900 border-2 border-t-white border-l-white border-r-gray-900 border-b-gray-900 hover:bg-[#d4d0c5] transition cursor-pointer active:border-t-gray-900 active:border-l-gray-900 active:border-r-white active:border-b-white';
const boxClass = 'border-2 border-t-white border-l-white border-r-gray-900 border-b-gray-900';

function EditForm({
  label,
  content,
  onLabelChange,
  onContentChange,
  onSave,
  onCancel,
}: {
  label: string;
  content: string;
  onLabelChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const canSave = !!label.trim() && !!content.trim();
  return (
    <div className={`space-y-3 ${boxClass} p-4`}>
      <input
        type="text"
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
        placeholder="New Item"
        className={inputClass}
      />
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="New Item text"
        rows={4}
        className={`${inputClass} resize-none`}
      />
      <div className="flex justify-end gap-3">
        <button onClick={onSave} disabled={!canSave} className={btnDisabledClass}>
          OK
        </button>
        <button onClick={onCancel} className={btnClass}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function App() {
  const [items, setItems] = useState<PasterItem[]>(() => loadItems());
  const [state, setState] = useState<'default' | 'editItem'>('default');
  const [editingItem, setEditingItem] = useState<PasterItem | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editContent, setEditContent] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [pressedItemId, setPressedItemId] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleCopy = async (content: string) => {
    if (state !== 'default') return;
    if (await copyToClipboard(content)) showToast('Copied!');
  };

  const resetEdit = () => {
    setState('default');
    setEditingItem(null);
    setEditLabel('');
    setEditContent('');
  };

  const startEdit = (item: PasterItem | null) => {
    setEditingItem(item);
    setEditLabel(item?.label ?? '');
    setEditContent(item?.content ?? '');
    setState('editItem');
  };

  const handleSave = () => {
    if (!editLabel.trim() || !editContent.trim()) return;
    const updated = editingItem
      ? updateItem(items, editingItem.id, editLabel.trim(), editContent.trim())
      : [createItem(editLabel.trim(), editContent.trim()), ...items];
    setItems(updated);
    saveItems(updated);
    resetEdit();
  };

  const handleDelete = (id: string) => {
    const updated = deleteItems(items, [id]);
    setItems(updated);
    saveItems(updated);
  };

  const isDefault = state === 'default';

  return (
    <div className="min-h-screen bg-[#e8e4d9]">
      <header className="p-1">
        <div className="bg-[#6b9fff] text-white px-4 py-2 flex items-center gap-3">
          <h1 className="text-xl font-medium">Paster</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-8 min-h-[600px] relative">
        <div className="space-y-8 pb-24">
          {state === 'editItem' && !editingItem && (
            <EditForm
              label={editLabel}
              content={editContent}
              onLabelChange={setEditLabel}
              onContentChange={setEditContent}
              onSave={handleSave}
              onCancel={resetEdit}
            />
          )}

          {items.length === 0 && isDefault ? (
            <div className="text-center py-12">
              <p className="text-gray-700 text-lg mb-4">No items yet.</p>
            </div>
          ) : (
            items.map((item) => {
              const isEditingThis = state === 'editItem' && editingItem?.id === item.id;
              return (
                <div key={item.id} className="space-y-3">
                  {isEditingThis ? (
                    <EditForm
                      label={editLabel}
                      content={editContent}
                      onLabelChange={setEditLabel}
                      onContentChange={setEditContent}
                      onSave={handleSave}
                      onCancel={resetEdit}
                    />
                  ) : (
                    <>
                      <div>
                        <div className="flex justify-between items-center pb-2">
                          <label className="text-base font-normal text-gray-900">{item.label}</label>
                          {isDefault && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEdit(item)}
                                className={iconBtnClass}
                                aria-label="Edit"
                              >
                                <img src="./pencil_icon.png" alt="" className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className={iconBtnClass}
                                aria-label="Delete"
                              >
                                <img src="./trash_icon.png" alt="" className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="h-[5px] border border-t-[#c9c5ba] border-l-[#c9c5ba] border-r-white border-b-white" />
                      </div>
                      <div
                        onMouseDown={() => isDefault && setPressedItemId(item.id)}
                        onMouseUp={() => setPressedItemId(null)}
                        onMouseLeave={() => setPressedItemId(null)}
                        onClick={() => isDefault && handleCopy(item.content)}
                        className={`p-4 transition-all border-2 ${
                          isDefault
                            ? `cursor-pointer ${
                                pressedItemId === item.id
                                  ? 'bg-[#6b9fff] text-white border-t-gray-900 border-l-gray-900 border-r-white border-b-white'
                                  : `${boxClass} hover:bg-[#d4d0c5]`
                              }`
                            : boxClass
                        }`}
                      >
                        <pre className="whitespace-pre-wrap text-base">{item.content}</pre>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="fixed bottom-8 right-8">
          <button onClick={() => startEdit(null)} className={`${btnClass} bg-[#e8e4d9]`}>
            Add new
          </button>
        </div>
      </main>

      {toast && (
        <div className="fixed top-15 right-4 bg-[#6b9fff] text-white px-6 py-3 shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
