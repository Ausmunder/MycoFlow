import { useState, useRef, useEffect } from 'react';
import { formatDateShort, parseShortDate } from '../utils/dateFormat';

/**
 * DateButtonCell - A cell that shows a button when empty, and becomes an editable date when clicked
 * Displays: DD.MM (year hidden but stored)
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

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSetToday = () => {
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
    onSave(localDate.toISOString());
  };

  const handleSave = () => {
    if (editValue && editValue !== formatDateShort(value)) {
      // Parse DD.MM to ISO format
      const isoDate = parseShortDate(editValue);
      if (isoDate) {
        onSave(isoDate);
      } else {
        alert('Ugyldig datoformat. Bruk DD.MM (f.eks. 05.12)');
        return;
      }
    } else if (!editValue && value) {
      onSave(null);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(formatDateShort(value));
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // If editing, show text input for DD.MM format
  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        placeholder="DD.MM"
        maxLength="5"
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

  // If value exists, show date in DD.MM format (clickable to edit)
  return (
    <div
      onClick={() => {
        setEditValue(formatDateShort(value));
        setIsEditing(true);
      }}
      className={`cursor-pointer hover:bg-blue-50 px-2 py-1 rounded text-xs ${className}`}
      title="Klikk for å redigere dato (DD.MM)"
    >
      {formatDateShort(value)}
    </div>
  );
}
