import React from 'react';
import clsx from 'clsx';
import { useFocusRef } from '../hooks/useFocusRef';
export function SelectCellFormatter({ value, tabIndex, isCellSelected, disabled, onClick, onChange, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy }) {
    const inputRef = useFocusRef(isCellSelected);
    function handleChange(e) {
        onChange(e.target.checked, e.nativeEvent.shiftKey);
    }
    return (React.createElement("label", { className: clsx('rdg-checkbox-label', { 'rdg-checkbox-label-disabled': disabled }) },
        React.createElement("input", { "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, tabIndex: tabIndex, ref: inputRef, type: "checkbox", className: "rdg-checkbox-input", disabled: disabled, checked: value, onChange: handleChange, onClick: onClick }),
        React.createElement("div", { className: "rdg-checkbox" })));
}
//# sourceMappingURL=SelectCellFormatter.js.map