export function isKeyPrintable(keycode) {
    return (keycode > 47 && keycode < 58) // number keys
        || keycode === 32 || keycode === 13 // spacebar & return key(s) (if you want to allow carriage returns)
        || (keycode > 64 && keycode < 91) // letter keys
        || (keycode > 95 && keycode < 112) // numpad keys
        || (keycode > 185 && keycode < 193) // ;=,-./` (in order)
        || (keycode > 218 && keycode < 223); // [\]' (in order)
}
export function isCtrlKeyHeldDown(e) {
    return (e.ctrlKey || e.metaKey) && e.key !== 'Control';
}
export function isDefaultCellInput(event) {
    return isKeyPrintable(event.keyCode) || ['Enter', 'F2', 'Backspace', 'Delete'].includes(event.key);
}
//# sourceMappingURL=keyboardUtils.js.map