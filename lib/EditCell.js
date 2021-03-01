import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import EditorContainer from './editors/EditorContainer';
export default function EditCell({ className, column, row, rowIdx, editorProps, ...props }) {
    const [dimensions, setDimensions] = useState(null);
    const cellRef = useCallback(node => {
        if (node !== null) {
            const { left, top } = node.getBoundingClientRect();
            setDimensions({ left, top });
        }
    }, []);
    const { cellClass } = column;
    className = clsx('rdg-cell', {
        'rdg-cell-frozen': column.frozen,
        'rdg-cell-frozen-last': column.isLastFrozenColumn
    }, 'rdg-cell-selected', 'rdg-cell-editing', typeof cellClass === 'function' ? cellClass(row) : cellClass, className);
    function getCellContent() {
        var _a;
        if (dimensions === null)
            return;
        const { scrollTop: docTop, scrollLeft: docLeft } = (_a = document.scrollingElement) !== null && _a !== void 0 ? _a : document.documentElement;
        const { left, top } = dimensions;
        const gridLeft = left + docLeft;
        const gridTop = top + docTop;
        return (React.createElement(EditorContainer, Object.assign({}, editorProps, { rowIdx: rowIdx, column: column, left: gridLeft, top: gridTop })));
    }
    return (React.createElement("div", Object.assign({ role: "gridcell", "aria-colindex": column.idx + 1, "aria-selected": true, ref: cellRef, className: className, style: {
            width: column.width,
            left: column.left
        } }, props), getCellContent()));
}
//# sourceMappingURL=EditCell.js.map