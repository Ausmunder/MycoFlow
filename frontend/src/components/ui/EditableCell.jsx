import { useState, useRef, useEffect } from 'react';
import { formatDateShort } from '../../utils/dateUtils';

export default function EditableCell({
  value,
  type = 'text',
  options = [],
  onSave,
  className = ''
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const getDisplayValue = () => {
    if (!value) return '-';
    if (type === 'date' && value.includes('-')) {
      return formatDateShort(value);
    }
    return value;
  };

  const inputClasses = 'px-2 py-1 border border-zinc-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 text-xs w-full';

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`cursor-pointer hover:bg-zinc-100 rounded-sm px-2 py-1 min-h-[1.75rem] flex items-center text-xs ${className}`}
        data-cell-editable
        title="Klikk for å redigere"
      >
        {getDisplayValue()}
      </div>
    );
  }

  if (type === 'select') {
    return (
      <select
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className={inputClasses}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (type === 'date') {
    return (
      <input
        ref={inputRef}
        type="date"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className={inputClasses}
      />
    );
  }

  if (type === 'number') {
    return (
      <input
        ref={inputRef}
        type="number"
        step="0.1"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className={`${inputClasses} w-20`}
      />
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleSave}
      className={inputClasses}
    />
  );
}
