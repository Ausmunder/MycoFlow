import { useState, useRef, useEffect } from 'react';
import { formatDateShort, parseShortDate } from '../../utils/dateUtils';

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
        className="px-2 py-1 border border-zinc-700 rounded-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 text-xs w-full"
      />
    );
  }

  if (!value) {
    return (
      <button
        onClick={handleSetToday}
        className={`px-2 py-1 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 rounded-sm text-xs w-full ${className}`}
        data-cell-editable
        title={`Sett dagens dato (${buttonLabel})`}
      >
        {buttonLabel}
      </button>
    );
  }

  return (
    <div
      onClick={() => {
        setEditValue(formatDateShort(value));
        setIsEditing(true);
      }}
      className={`cursor-pointer font-mono hover:bg-zinc-800 rounded-sm px-2 py-1 text-xs ${className}`}
      data-cell-editable
      title="Klikk for å redigere dato (DD.MM)"
    >
      {formatDateShort(value)}
    </div>
  );
}
