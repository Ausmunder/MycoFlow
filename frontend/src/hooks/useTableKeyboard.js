import { useEffect, useCallback } from 'react';

/**
 * Keyboard navigation for the batch table.
 * Tab/Shift+Tab: move between editable cells in a row
 * ArrowUp/ArrowDown: move between rows in the same column
 * Enter: activate edit mode on focused cell
 * Escape: cancel edit / blur
 */
export const useTableKeyboard = (tableRef) => {
  const getEditableCells = useCallback(() => {
    if (!tableRef.current) return [];
    return Array.from(tableRef.current.querySelectorAll('[data-cell-editable]'));
  }, [tableRef]);

  const handleKeyDown = useCallback((e) => {
    const cells = getEditableCells();
    if (cells.length === 0) return;

    const activeElement = document.activeElement;
    const currentCell = activeElement?.closest('[data-cell-editable]') || activeElement;
    const currentIndex = cells.indexOf(currentCell);

    if (currentIndex === -1) return;

    const currentRow = currentCell.closest('tr');
    const currentTd = currentCell.closest('td');
    if (!currentRow || !currentTd) return;

    const allTds = Array.from(currentRow.querySelectorAll('td'));
    const colIndex = allTds.indexOf(currentTd);

    if (e.key === 'Tab') {
      e.preventDefault();
      const direction = e.shiftKey ? -1 : 1;
      const nextIndex = currentIndex + direction;
      if (nextIndex >= 0 && nextIndex < cells.length) {
        cells[nextIndex].focus();
        cells[nextIndex].click();
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const rows = Array.from(tableRef.current.querySelectorAll('tbody tr'));
      const currentRowIndex = rows.indexOf(currentRow);
      const nextRowIndex = e.key === 'ArrowUp' ? currentRowIndex - 1 : currentRowIndex + 1;

      if (nextRowIndex >= 0 && nextRowIndex < rows.length) {
        const nextRow = rows[nextRowIndex];
        const nextTds = Array.from(nextRow.querySelectorAll('td'));
        if (colIndex < nextTds.length) {
          const nextCell = nextTds[colIndex].querySelector('[data-cell-editable]');
          if (nextCell) {
            nextCell.focus();
            nextCell.click();
          }
        }
      }
    } else if (e.key === 'Enter' && currentCell.hasAttribute('data-cell-editable')) {
      currentCell.click();
    } else if (e.key === 'Escape') {
      currentCell.blur();
    }
  }, [getEditableCells, tableRef]);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    table.addEventListener('keydown', handleKeyDown);
    return () => table.removeEventListener('keydown', handleKeyDown);
  }, [tableRef, handleKeyDown]);
};
