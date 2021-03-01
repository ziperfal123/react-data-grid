import { useRef, useLayoutEffect } from 'react';
export function useFocusRef(isCellSelected) {
    const ref = useRef(null);
    useLayoutEffect(() => {
        var _a;
        if (!isCellSelected)
            return;
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.focus({ preventScroll: true });
    }, [isCellSelected]);
    return ref;
}
//# sourceMappingURL=useFocusRef.js.map