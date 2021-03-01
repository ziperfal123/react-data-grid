import React from 'react';
import { createPortal } from 'react-dom';
import { useClickOutside } from '../hooks';
export default function EditorContainer({ row, column, onRowChange, ...props }) {
    var _a;
    const onClickCapture = useClickOutside(() => onRowChange(row, true));
    if (column.editor === undefined)
        return null;
    const editor = (React.createElement("div", { className: "rdg-editor-container", onClickCapture: onClickCapture },
        React.createElement(column.editor, Object.assign({ row: row, column: column, onRowChange: onRowChange }, props))));
    if ((_a = column.editorOptions) === null || _a === void 0 ? void 0 : _a.createPortal) {
        return createPortal(editor, props.editorPortalTarget);
    }
    return editor;
}
//# sourceMappingURL=EditorContainer.js.map