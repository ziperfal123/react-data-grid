import React from 'react';
function autoFocusAndSelect(input) {
    input === null || input === void 0 ? void 0 : input.focus();
    input === null || input === void 0 ? void 0 : input.select();
}
export default function TextEditor({ row, column, onRowChange, onClose }) {
    return (React.createElement("input", { className: "rdg-text-editor", ref: autoFocusAndSelect, value: row[column.key], onChange: event => onRowChange({ ...row, [column.key]: event.target.value }), onBlur: () => onClose(true) }));
}
//# sourceMappingURL=TextEditor.js.map