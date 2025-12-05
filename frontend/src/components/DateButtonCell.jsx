import { useState, useRef, useEffect } from 'react';

/**
 * DateButtonCell - A cell that shows a button when empty, and becomes an editable date when clicked
 * @param {string} value - The date value (ISO format or empty)
 * @param {string} buttonLabel - Label to show on the button (e.g., "Frukt", "T", "LF")
 * @param {function} onSave - Callback when date is saved
 * @param {string} className - Additional CSS classes
 */
export default function DateButtonCell({
  value,
  buttonLabel = 'Set',
  onSave,
  className = ''
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  // Format date for display (YYYY-MM-DD)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    onSave(today);
  };

  const handleSave = () => {
    if (editValue !== formatDate(value)) {
      onSave(editValue || null);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(formatDate(value));
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // If editing, show date input
  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="date"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className="px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs w-full"
      />
    );
  }

  // If no value, show button to set today's date
  if (!value) {
    return (
      <button
        onClick={handleSetToday}
        className={`px-2 py-1 bg-gray-100 hover:bg-blue-100 rounded text-xs w-full ${className}`}
        title={`Sett dagens dato (${buttonLabel})`}
      >
        {buttonLabel}
      </button>
    );
  }

  // If value exists, show date (clickable to edit)
  return (
    <div
      onClick={() => {
        setEditValue(formatDate(value));
        setIsEditing(true);
      }}
      className={`cursor-pointer hover:bg-blue-50 px-2 py-1 rounded text-xs ${className}`}
      title="Klikk for å redigere dato"
    >
      {formatDate(value)}
    </div>
  );
}
