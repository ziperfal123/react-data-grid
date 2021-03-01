import React, { forwardRef, useState, useRef, useLayoutEffect, useEffect, useImperativeHandle, useCallback, createElement } from 'react';
import clsx from 'clsx';
import { useGridDimensions, useViewportColumns, useViewportRows } from './hooks';
import EventBus from './EventBus';
import HeaderRow from './HeaderRow';
import FilterRow from './FilterRow';
import Row from './Row';
import GroupRowRenderer from './GroupRow';
import SummaryRow from './SummaryRow';
import { assertIsValidKeyGetter, getColumnScrollPosition, onEditorNavigation, getNextSelectedCellPosition, isSelectedCellEditable, canExitGrid, isCtrlKeyHeldDown, isDefaultCellInput } from './utils';
/**
 * Main API Component to render a data grid of rows and columns
 *
 * @example
 *
 * <DataGrid columns={columns} rows={rows} />
*/
function DataGrid({ 
// Grid and data Props
columns: rawColumns, rows: rawRows, summaryRows, rowKeyGetter, onRowsChange, 
// Dimensions props
rowHeight = 35, headerRowHeight = rowHeight, headerFiltersHeight = 45, 
// Feature props
selectedRows, onSelectedRowsChange, sortColumn, sortDirection, onSort, filters, onFiltersChange, defaultColumnOptions, groupBy: rawGroupBy, rowGrouper, expandedGroupIds, onExpandedGroupIdsChange, 
// Custom renderers
rowRenderer: RowRenderer = Row, emptyRowsRenderer, 
// Event props
onRowClick, onScroll, onColumnResize, onSelectedCellChange, onFill, onPaste, 
// Toggles and modes
enableFilterRow = false, cellNavigationMode = 'NONE', 
// Miscellaneous
editorPortalTarget = document.body, className, style, rowClass, 
// ARIA
'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy }, ref) {
    var _a;
    /**
     * states
     */
    const [eventBus] = useState(() => new EventBus());
    const [scrollTop, setScrollTop] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [columnWidths, setColumnWidths] = useState(() => new Map());
    const [selectedPosition, setSelectedPosition] = useState({ idx: -1, rowIdx: -1, mode: 'SELECT' });
    const [copiedCell, setCopiedCell] = useState(null);
    const [isDragging, setDragging] = useState(false);
    const [draggedOverRowIdx, setOverRowIdx] = useState(undefined);
    /**
     * refs
     */
    const focusSinkRef = useRef(null);
    const prevSelectedPosition = useRef(selectedPosition);
    const latestDraggedOverRowIdx = useRef(draggedOverRowIdx);
    const lastSelectedRowIdx = useRef(-1);
    const isCellFocusable = useRef(false);
    /**
     * computed values
     */
    const [gridRef, gridWidth, gridHeight] = useGridDimensions();
    const headerRowsCount = enableFilterRow ? 2 : 1;
    const summaryRowsCount = (_a = summaryRows === null || summaryRows === void 0 ? void 0 : summaryRows.length) !== null && _a !== void 0 ? _a : 0;
    const totalHeaderHeight = headerRowHeight + (enableFilterRow ? headerFiltersHeight : 0);
    const clientHeight = gridHeight - totalHeaderHeight - summaryRowsCount * rowHeight;
    const isSelectable = selectedRows !== undefined && onSelectedRowsChange !== undefined;
    const { columns, viewportColumns, totalColumnWidth, lastFrozenColumnIndex, totalFrozenColumnWidth, groupBy } = useViewportColumns({
        rawColumns,
        columnWidths,
        scrollLeft,
        viewportWidth: gridWidth,
        defaultColumnOptions,
        rawGroupBy,
        rowGrouper
    });
    const { rowOverscanStartIdx, rowOverscanEndIdx, rows, rowsCount, isGroupRow } = useViewportRows({
        rawRows,
        groupBy,
        rowGrouper,
        rowHeight,
        clientHeight,
        scrollTop,
        expandedGroupIds
    });
    const hasGroups = groupBy.length > 0 && rowGrouper;
    const minColIdx = hasGroups ? -1 : 0;
    // Cell drag is not supported on a treegrid
    const enableCellDragAndDrop = hasGroups ? false : onFill !== undefined;
    /**
     * effects
     */
    useLayoutEffect(() => {
        if (selectedPosition === prevSelectedPosition.current || selectedPosition.mode === 'EDIT' || !isCellWithinBounds(selectedPosition))
            return;
        prevSelectedPosition.current = selectedPosition;
        scrollToCell(selectedPosition);
        if (isCellFocusable.current) {
            isCellFocusable.current = false;
            return;
        }
        focusSinkRef.current.focus({ preventScroll: true });
    });
    useEffect(() => {
        if (!onSelectedRowsChange)
            return;
        const handleRowSelectionChange = ({ rowIdx, checked, isShiftClick }) => {
            assertIsValidKeyGetter(rowKeyGetter);
            const newSelectedRows = new Set(selectedRows);
            const row = rows[rowIdx];
            if (isGroupRow(row)) {
                for (const childRow of row.childRows) {
                    const rowKey = rowKeyGetter(childRow);
                    if (checked) {
                        newSelectedRows.add(rowKey);
                    }
                    else {
                        newSelectedRows.delete(rowKey);
                    }
                }
                onSelectedRowsChange(newSelectedRows);
                return;
            }
            const rowKey = rowKeyGetter(row);
            if (checked) {
                newSelectedRows.add(rowKey);
                const previousRowIdx = lastSelectedRowIdx.current;
                lastSelectedRowIdx.current = rowIdx;
                if (isShiftClick && previousRowIdx !== -1 && previousRowIdx !== rowIdx) {
                    const step = Math.sign(rowIdx - previousRowIdx);
                    for (let i = previousRowIdx + step; i !== rowIdx; i += step) {
                        const row = rows[i];
                        if (isGroupRow(row))
                            continue;
                        newSelectedRows.add(rowKeyGetter(row));
                    }
                }
            }
            else {
                newSelectedRows.delete(rowKey);
                lastSelectedRowIdx.current = -1;
            }
            onSelectedRowsChange(newSelectedRows);
        };
        return eventBus.subscribe('SelectRow', handleRowSelectionChange);
    });
    useEffect(() => {
        return eventBus.subscribe('SelectCell', selectCell);
    });
    useEffect(() => {
        if (!onExpandedGroupIdsChange)
            return;
        const toggleGroup = (expandedGroupId) => {
            const newExpandedGroupIds = new Set(expandedGroupIds);
            if (newExpandedGroupIds.has(expandedGroupId)) {
                newExpandedGroupIds.delete(expandedGroupId);
            }
            else {
                newExpandedGroupIds.add(expandedGroupId);
            }
            onExpandedGroupIdsChange(newExpandedGroupIds);
        };
        return eventBus.subscribe('ToggleGroup', toggleGroup);
    }, [eventBus, expandedGroupIds, onExpandedGroupIdsChange]);
    useImperativeHandle(ref, () => ({
        scrollToColumn(idx) {
            scrollToCell({ idx });
        },
        scrollToRow(rowIdx) {
            const { current } = gridRef;
            if (!current)
                return;
            current.scrollTo({
                top: rowIdx * rowHeight,
                behavior: 'smooth'
            });
        },
        selectCell,
        deselectCell,
    }));
    /**
    * callbacks
    */
    const handleColumnResize = useCallback((column, width) => {
        const newColumnWidths = new Map(columnWidths);
        newColumnWidths.set(column.key, width);
        setColumnWidths(newColumnWidths);
        onColumnResize === null || onColumnResize === void 0 ? void 0 : onColumnResize(column.idx, width);
    }, [columnWidths, onColumnResize]);
    const setDraggedOverRowIdx = useCallback((rowIdx) => {
        setOverRowIdx(rowIdx);
        latestDraggedOverRowIdx.current = rowIdx;
    }, []);
    /**
    * event handlers
    */
    function handleKeyDown(event) {
        const { key, keyCode } = event;
        const row = rows[selectedPosition.rowIdx];
        if (onPaste
            && isCtrlKeyHeldDown(event)
            && isCellWithinBounds(selectedPosition)
            && !isGroupRow(row)
            && selectedPosition.idx !== -1
            && selectedPosition.mode === 'SELECT') {
            // event.key may differ by keyboard input language, so we use event.keyCode instead
            // event.nativeEvent.code cannot be used either as it would break copy/paste for the DVORAK layout
            const cKey = 67;
            const vKey = 86;
            if (keyCode === cKey) {
                handleCopy();
                return;
            }
            if (keyCode === vKey) {
                handlePaste();
                return;
            }
        }
        if (isCellWithinBounds(selectedPosition)
            && isGroupRow(row)
            && selectedPosition.idx === -1
            && (
            // Collapse the current group row if it is focused and is in expanded state
            (key === 'ArrowLeft' && row.isExpanded)
                // Expand the current group row if it is focused and is in collapsed state
                || (key === 'ArrowRight' && !row.isExpanded))) {
            event.preventDefault(); // Prevents scrolling
            eventBus.dispatch('ToggleGroup', row.id);
            return;
        }
        switch (event.key) {
            case 'Escape':
                setCopiedCell(null);
                closeEditor();
                return;
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'Tab':
            case 'Home':
            case 'End':
            case 'PageUp':
            case 'PageDown':
                navigate(event);
                break;
            default:
                handleCellInput(event);
                break;
        }
    }
    function handleFocus() {
        isCellFocusable.current = true;
    }
    function handleScroll(event) {
        const { scrollTop, scrollLeft } = event.currentTarget;
        setScrollTop(scrollTop);
        setScrollLeft(scrollLeft);
        onScroll === null || onScroll === void 0 ? void 0 : onScroll(event);
    }
    function getRawRowIdx(rowIdx) {
        return hasGroups ? rawRows.indexOf(rows[rowIdx]) : rowIdx;
    }
    function commitEditorChanges() {
        var _a;
        if (((_a = columns[selectedPosition.idx]) === null || _a === void 0 ? void 0 : _a.editor) === undefined
            || selectedPosition.mode === 'SELECT'
            || selectedPosition.row === selectedPosition.originalRow) {
            return;
        }
        const updatedRows = [...rawRows];
        updatedRows[getRawRowIdx(selectedPosition.rowIdx)] = selectedPosition.row;
        onRowsChange === null || onRowsChange === void 0 ? void 0 : onRowsChange(updatedRows);
    }
    function handleCopy() {
        const { idx, rowIdx } = selectedPosition;
        setCopiedCell({ row: rawRows[getRawRowIdx(rowIdx)], columnKey: columns[idx].key });
    }
    function handlePaste() {
        const { idx, rowIdx } = selectedPosition;
        const targetRow = rawRows[getRawRowIdx(rowIdx)];
        if (!onPaste
            || !onRowsChange
            || copiedCell === null
            || !isCellEditable(selectedPosition)) {
            return;
        }
        const updatedTargetRow = onPaste({
            sourceRow: copiedCell.row,
            sourceColumnKey: copiedCell.columnKey,
            targetRow,
            targetColumnKey: columns[idx].key
        });
        const updatedRows = [...rawRows];
        updatedRows[rowIdx] = updatedTargetRow;
        onRowsChange(updatedRows);
    }
    function handleCellInput(event) {
        var _a, _b;
        if (!isCellWithinBounds(selectedPosition))
            return;
        const row = rows[selectedPosition.rowIdx];
        if (isGroupRow(row))
            return;
        const { key } = event;
        const column = columns[selectedPosition.idx];
        if (selectedPosition.mode === 'EDIT') {
            if (key === 'Enter') {
                // Custom editors can listen for the event and stop propagation to prevent commit
                commitEditorChanges();
                closeEditor();
            }
            return;
        }
        (_b = (_a = column.editorOptions) === null || _a === void 0 ? void 0 : _a.onCellKeyDown) === null || _b === void 0 ? void 0 : _b.call(_a, event);
        if (event.isDefaultPrevented())
            return;
        if (isCellEditable(selectedPosition) && isDefaultCellInput(event)) {
            setSelectedPosition(({ idx, rowIdx }) => ({
                idx,
                rowIdx,
                key,
                mode: 'EDIT',
                row,
                originalRow: row
            }));
        }
    }
    function handleDragEnd() {
        const overRowIdx = latestDraggedOverRowIdx.current;
        if (overRowIdx === undefined || !onFill || !onRowsChange)
            return;
        const { idx, rowIdx } = selectedPosition;
        const sourceRow = rawRows[rowIdx];
        const startRowIndex = rowIdx < overRowIdx ? rowIdx + 1 : overRowIdx;
        const endRowIndex = rowIdx < overRowIdx ? overRowIdx + 1 : rowIdx;
        const targetRows = rawRows.slice(startRowIndex, endRowIndex);
        const updatedTargetRows = onFill({ columnKey: columns[idx].key, sourceRow, targetRows });
        const updatedRows = [...rawRows];
        for (let i = startRowIndex; i < endRowIndex; i++) {
            updatedRows[i] = updatedTargetRows[i - startRowIndex];
        }
        onRowsChange(updatedRows);
        setDraggedOverRowIdx(undefined);
    }
    function handleMouseDown(event) {
        if (event.buttons !== 1)
            return;
        setDragging(true);
        window.addEventListener('mouseover', onMouseOver);
        window.addEventListener('mouseup', onMouseUp);
        function onMouseOver(event) {
            // Trigger onMouseup in edge cases where we release the mouse button but `mouseup` isn't triggered,
            // for example when releasing the mouse button outside the iframe the grid is rendered in.
            // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
            if (event.buttons !== 1)
                onMouseUp();
        }
        function onMouseUp() {
            window.removeEventListener('mouseover', onMouseOver);
            window.removeEventListener('mouseup', onMouseUp);
            setDragging(false);
            handleDragEnd();
        }
    }
    function handleDoubleClick(event) {
        event.stopPropagation();
        if (!onFill || !onRowsChange)
            return;
        const { idx, rowIdx } = selectedPosition;
        const sourceRow = rawRows[rowIdx];
        const targetRows = rawRows.slice(rowIdx + 1);
        const updatedTargetRows = onFill({ columnKey: columns[idx].key, sourceRow, targetRows });
        const updatedRows = [...rawRows];
        for (let i = rowIdx + 1; i < updatedRows.length; i++) {
            updatedRows[i] = updatedTargetRows[i - rowIdx - 1];
        }
        onRowsChange(updatedRows);
    }
    function handleRowChange(row, commitChanges) {
        if (selectedPosition.mode === 'SELECT')
            return;
        if (commitChanges) {
            const updatedRows = [...rawRows];
            updatedRows[getRawRowIdx(selectedPosition.rowIdx)] = row;
            onRowsChange === null || onRowsChange === void 0 ? void 0 : onRowsChange(updatedRows);
            closeEditor();
        }
        else {
            setSelectedPosition(position => ({ ...position, row }));
        }
    }
    function handleOnClose(commitChanges) {
        if (commitChanges) {
            commitEditorChanges();
        }
        closeEditor();
    }
    /**
     * utils
     */
    function isCellWithinBounds({ idx, rowIdx }) {
        return rowIdx >= 0 && rowIdx < rows.length && idx >= minColIdx && idx < columns.length;
    }
    function isCellEditable(position) {
        return isCellWithinBounds(position)
            && isSelectedCellEditable({ columns, rows, selectedPosition: position, isGroupRow });
    }
    function selectCell(position, enableEditor = false) {
        if (!isCellWithinBounds(position))
            return;
        commitEditorChanges();
        if (enableEditor && isCellEditable(position)) {
            const row = rows[position.rowIdx];
            setSelectedPosition({ ...position, mode: 'EDIT', key: null, row, originalRow: row });
        }
        else {
            setSelectedPosition({ ...position, mode: 'SELECT' });
        }
        onSelectedCellChange === null || onSelectedCellChange === void 0 ? void 0 : onSelectedCellChange({ ...position });
    }
    function deselectCell() {
        setSelectedPosition({ idx: -1, rowIdx: -1, mode: "SELECT" });
        setCopiedCell(null);
        setDraggedOverRowIdx(undefined);
    }
    function closeEditor() {
        if (selectedPosition.mode === 'SELECT')
            return;
        setSelectedPosition(({ idx, rowIdx }) => ({ idx, rowIdx, mode: 'SELECT' }));
    }
    function scrollToCell({ idx, rowIdx }) {
        const { current } = gridRef;
        if (!current)
            return;
        if (typeof idx === 'number' && idx > lastFrozenColumnIndex) {
            const { clientWidth } = current;
            const { left, width } = columns[idx];
            const isCellAtLeftBoundary = left < scrollLeft + width + totalFrozenColumnWidth;
            const isCellAtRightBoundary = left + width > clientWidth + scrollLeft;
            if (isCellAtLeftBoundary || isCellAtRightBoundary) {
                const newScrollLeft = getColumnScrollPosition(columns, idx, scrollLeft, clientWidth);
                current.scrollLeft = scrollLeft + newScrollLeft;
            }
        }
        if (typeof rowIdx === 'number') {
            if (rowIdx * rowHeight < scrollTop) {
                // at top boundary, scroll to the row's top
                current.scrollTop = rowIdx * rowHeight;
            }
            else if ((rowIdx + 1) * rowHeight > scrollTop + clientHeight) {
                // at bottom boundary, scroll the next row's top to the bottom of the viewport
                current.scrollTop = (rowIdx + 1) * rowHeight - clientHeight;
            }
        }
    }
    function getNextPosition(key, ctrlKey, shiftKey) {
        const { idx, rowIdx } = selectedPosition;
        const row = rows[rowIdx];
        const isRowSelected = isCellWithinBounds(selectedPosition) && idx === -1;
        // If a group row is focused, and it is collapsed, move to the parent group row (if there is one).
        if (key === 'ArrowLeft'
            && isRowSelected
            && isGroupRow(row)
            && !row.isExpanded
            && row.level !== 0) {
            let parentRowIdx = -1;
            for (let i = selectedPosition.rowIdx - 1; i >= 0; i--) {
                const parentRow = rows[i];
                if (isGroupRow(parentRow) && parentRow.id === row.parentId) {
                    parentRowIdx = i;
                    break;
                }
            }
            if (parentRowIdx !== -1) {
                return { idx, rowIdx: parentRowIdx };
            }
        }
        switch (key) {
            case 'ArrowUp':
                return { idx, rowIdx: rowIdx - 1 };
            case 'ArrowDown':
                return { idx, rowIdx: rowIdx + 1 };
            case 'ArrowLeft':
                return { idx: idx - 1, rowIdx };
            case 'ArrowRight':
                return { idx: idx + 1, rowIdx };
            case 'Tab':
                if (selectedPosition.idx === -1 && selectedPosition.rowIdx === -1) {
                    return shiftKey ? { idx: columns.length - 1, rowIdx: rows.length - 1 } : { idx: 0, rowIdx: 0 };
                }
                return { idx: idx + (shiftKey ? -1 : 1), rowIdx };
            case 'Home':
                // If row is selected then move focus to the first row
                if (isRowSelected)
                    return { idx, rowIdx: 0 };
                return ctrlKey ? { idx: 0, rowIdx: 0 } : { idx: 0, rowIdx };
            case 'End':
                // If row is selected then move focus to the last row.
                if (isRowSelected)
                    return { idx, rowIdx: rows.length - 1 };
                return ctrlKey ? { idx: columns.length - 1, rowIdx: rows.length - 1 } : { idx: columns.length - 1, rowIdx };
            case 'PageUp':
                return { idx, rowIdx: rowIdx - Math.floor(clientHeight / rowHeight) };
            case 'PageDown':
                return { idx, rowIdx: rowIdx + Math.floor(clientHeight / rowHeight) };
            default:
                return selectedPosition;
        }
    }
    function navigate(event) {
        var _a, _b;
        if (selectedPosition.mode === 'EDIT') {
            const onNavigation = (_b = (_a = columns[selectedPosition.idx].editorOptions) === null || _a === void 0 ? void 0 : _a.onNavigation) !== null && _b !== void 0 ? _b : onEditorNavigation;
            if (!onNavigation(event))
                return;
        }
        const { key, shiftKey } = event;
        const ctrlKey = isCtrlKeyHeldDown(event);
        let nextPosition = getNextPosition(key, ctrlKey, shiftKey);
        let mode = cellNavigationMode;
        if (key === 'Tab') {
            // If we are in a position to leave the grid, stop editing but stay in that cell
            if (canExitGrid({ shiftKey, cellNavigationMode, columns, rowsCount: rows.length, selectedPosition })) {
                // Allow focus to leave the grid so the next control in the tab order can be focused
                return;
            }
            mode = cellNavigationMode === 'NONE'
                ? 'CHANGE_ROW'
                : cellNavigationMode;
        }
        // Do not allow focus to leave
        event.preventDefault();
        nextPosition = getNextSelectedCellPosition({
            columns,
            rowsCount: rows.length,
            cellNavigationMode: mode,
            nextPosition
        });
        selectCell(nextPosition);
    }
    function getDraggedOverCellIdx(currentRowIdx) {
        if (draggedOverRowIdx === undefined)
            return;
        const { rowIdx } = selectedPosition;
        const isDraggedOver = rowIdx < draggedOverRowIdx
            ? rowIdx < currentRowIdx && currentRowIdx <= draggedOverRowIdx
            : rowIdx > currentRowIdx && currentRowIdx >= draggedOverRowIdx;
        return isDraggedOver ? selectedPosition.idx : undefined;
    }
    function getSelectedCellProps(rowIdx) {
        if (selectedPosition.rowIdx !== rowIdx)
            return;
        if (selectedPosition.mode === 'EDIT') {
            return {
                mode: 'EDIT',
                idx: selectedPosition.idx,
                onKeyDown: handleKeyDown,
                editorProps: {
                    editorPortalTarget,
                    rowHeight,
                    row: selectedPosition.row,
                    onRowChange: handleRowChange,
                    onClose: handleOnClose
                }
            };
        }
        return {
            mode: 'SELECT',
            idx: selectedPosition.idx,
            onFocus: handleFocus,
            onKeyDown: handleKeyDown,
            dragHandleProps: enableCellDragAndDrop && isCellEditable(selectedPosition)
                ? { onMouseDown: handleMouseDown, onDoubleClick: handleDoubleClick }
                : undefined
        };
    }
    function getViewportRows() {
        var _a;
        const rowElements = [];
        let startRowIndex = 0;
        for (let rowIdx = rowOverscanStartIdx; rowIdx <= rowOverscanEndIdx; rowIdx++) {
            const row = rows[rowIdx];
            const top = rowIdx * rowHeight + totalHeaderHeight;
            if (isGroupRow(row)) {
                ({ startRowIndex } = row);
                rowElements.push(React.createElement(GroupRowRenderer, { "aria-level": row.level + 1, "aria-setsize": row.setSize, "aria-posinset": row.posInSet + 1, "aria-rowindex": headerRowsCount + startRowIndex + 1, key: row.id, id: row.id, groupKey: row.groupKey, viewportColumns: viewportColumns, childRows: row.childRows, rowIdx: rowIdx, top: top, level: row.level, isExpanded: row.isExpanded, selectedCellIdx: selectedPosition.rowIdx === rowIdx ? selectedPosition.idx : undefined, isRowSelected: isSelectable && row.childRows.every(cr => selectedRows === null || selectedRows === void 0 ? void 0 : selectedRows.has(rowKeyGetter(cr))), eventBus: eventBus, onFocus: selectedPosition.rowIdx === rowIdx ? handleFocus : undefined, onKeyDown: selectedPosition.rowIdx === rowIdx ? handleKeyDown : undefined }));
                continue;
            }
            startRowIndex++;
            let key = hasGroups ? startRowIndex : rowIdx;
            let isRowSelected = false;
            if (typeof rowKeyGetter === 'function') {
                key = rowKeyGetter(row);
                isRowSelected = (_a = selectedRows === null || selectedRows === void 0 ? void 0 : selectedRows.has(key)) !== null && _a !== void 0 ? _a : false;
            }
            rowElements.push(React.createElement(RowRenderer, { "aria-rowindex": headerRowsCount + (hasGroups ? startRowIndex : rowIdx) + 1, "aria-selected": isSelectable ? isRowSelected : undefined, key: key, rowIdx: rowIdx, row: row, viewportColumns: viewportColumns, eventBus: eventBus, isRowSelected: isRowSelected, onRowClick: onRowClick, rowClass: rowClass, top: top, copiedCellIdx: copiedCell !== null && copiedCell.row === row ? columns.findIndex(c => c.key === copiedCell.columnKey) : undefined, draggedOverCellIdx: getDraggedOverCellIdx(rowIdx), setDraggedOverRowIdx: isDragging ? setDraggedOverRowIdx : undefined, selectedCellProps: getSelectedCellProps(rowIdx) }));
        }
        return rowElements;
    }
    // Reset the positions if the current values are no longer valid. This can happen if a column or row is removed
    if (selectedPosition.idx >= columns.length || selectedPosition.rowIdx >= rows.length) {
        setSelectedPosition({ idx: -1, rowIdx: -1, mode: 'SELECT' });
        setDraggedOverRowIdx(undefined);
    }
    if (selectedPosition.mode === 'EDIT' && rows[selectedPosition.rowIdx] !== selectedPosition.originalRow) {
        // Discard changes if rows are updated from outside
        closeEditor();
    }
    return (React.createElement("div", { role: hasGroups ? 'treegrid' : 'grid', "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, "aria-describedby": ariaDescribedBy, "aria-multiselectable": isSelectable ? true : undefined, "aria-colcount": columns.length, "aria-rowcount": headerRowsCount + rowsCount + summaryRowsCount, className: clsx('rdg', { 'rdg-viewport-dragging': isDragging }, className), style: {
            ...style,
            '--header-row-height': `${headerRowHeight}px`,
            '--filter-row-height': `${headerFiltersHeight}px`,
            '--row-width': `${totalColumnWidth}px`,
            '--row-height': `${rowHeight}px`
        }, ref: gridRef, onScroll: handleScroll },
        React.createElement(HeaderRow, { rowKeyGetter: rowKeyGetter, rows: rawRows, columns: viewportColumns, onColumnResize: handleColumnResize, allRowsSelected: (selectedRows === null || selectedRows === void 0 ? void 0 : selectedRows.size) === rawRows.length, onSelectedRowsChange: onSelectedRowsChange, sortColumn: sortColumn, sortDirection: sortDirection, onSort: onSort }),
        enableFilterRow && (React.createElement(FilterRow, { columns: viewportColumns, filters: filters, onFiltersChange: onFiltersChange })),
        rows.length === 0 && emptyRowsRenderer ? createElement(emptyRowsRenderer) : (React.createElement(React.Fragment, null,
            React.createElement("div", { ref: focusSinkRef, tabIndex: 0, className: "rdg-focus-sink", onKeyDown: handleKeyDown }),
            React.createElement("div", { style: { height: Math.max(rows.length * rowHeight, clientHeight) } }),
            getViewportRows(), summaryRows === null || summaryRows === void 0 ? void 0 :
            summaryRows.map((row, rowIdx) => (React.createElement(SummaryRow, { "aria-rowindex": headerRowsCount + rowsCount + rowIdx + 1, key: rowIdx, rowIdx: rowIdx, row: row, bottom: rowHeight * (summaryRows.length - 1 - rowIdx), viewportColumns: viewportColumns })))))));
}
export default forwardRef(DataGrid);
//# sourceMappingURL=DataGrid.js.map