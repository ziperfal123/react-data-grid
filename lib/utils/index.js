export * from './domUtils';
export * from './columnUtils';
export * from './keyboardUtils';
export * from './selectedCellUtils';
export function assertIsValidKeyGetter(keyGetter) {
    if (typeof keyGetter !== 'function') {
        throw new Error('Please specify the rowKeyGetter prop to use selection');
    }
}
//# sourceMappingURL=index.js.map