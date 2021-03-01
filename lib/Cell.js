import React, { forwardRef, memo, useRef } from 'react';
import clsx from 'clsx';
import { wrapEvent } from './utils';
import { useCombinedRefs } from './hooks';
function Cell({ className, column, isCellSelected, isCopied, isDraggedOver, isRowSelected, row, rowIdx, eventBus, dragHandleProps, onRowClick, onClick, onDoubleClick, onContextMenu, ...props }, ref) {
    const cellRef = useRef(null);
    const { cellClass } = column;
    className = clsx('rdg-cell', {
        'rdg-cell-frozen': column.frozen,
        'rdg-cell-frozen-last': column.isLastFrozenColumn,
        'rdg-cell-selected': isCellSelected,
        'rdg-cell-copied': isCopied,
        'rdg-cell-dragged-over': isDraggedOver
    }, typeof cellClass === 'function' ? cellClass(row) : cellClass, className);
    function selectCell(openEditor) {
        eventBus.dispatch('SelectCell', { idx: column.idx, rowIdx }, openEditor);
    }
    function handleClick() {
        var _a;
        selectCell((_a = column.editorOptions) === null || _a === void 0 ? void 0 : _a.editOnClick);
        onRowClick === null || onRowClick === void 0 ? void 0 : onRowClick(rowIdx, row, column);
    }
    function handleContextMenu() {
        selectCell();
    }
    function handleDoubleClick() {
        selectCell(true);
    }
    function onRowSelectionChange(checked, isShiftClick) {
        eventBus.dispatch('SelectRow', { rowIdx, checked, isShiftClick });
    }
    return (React.createElement("div", Object.assign({ role: "gridcell", "aria-colindex": column.idx + 1, "aria-selected": isCellSelected, ref: useCombinedRefs(cellRef, ref), className: className, style: {
            width: column.width,
            left: column.left
        }, onClick: wrapEvent(handleClick, onClick), onDoubleClick: wrapEvent(handleDoubleClick, onDoubleClick), onContextMenu: wrapEvent(handleContextMenu, onContextMenu) }, props), !column.rowGroup && (React.createElement(React.Fragment, null,
        React.createElement(column.formatter, { column: column, rowIdx: rowIdx, row: row, isCellSelected: isCellSelected, isRowSelected: isRowSelected, onRowSelectionChange: onRowSelectionChange }),
        dragHandleProps && (React.createElement("div", Object.assign({ className: "rdg-cell-drag-handle" }, dragHandleProps)))))));
}
export default memo(forwardRef(Cell));
//# sourceMappingURL=Cell.js.map