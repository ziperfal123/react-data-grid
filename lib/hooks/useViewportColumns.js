import { useMemo } from 'react';
import { getColumnMetrics } from '../utils';
import { ValueFormatter } from '../formatters';
export function useViewportColumns({ rawColumns, columnWidths, viewportWidth, scrollLeft, defaultColumnOptions, rawGroupBy, rowGrouper }) {
    var _a, _b, _c, _d;
    const minColumnWidth = (_a = defaultColumnOptions === null || defaultColumnOptions === void 0 ? void 0 : defaultColumnOptions.minWidth) !== null && _a !== void 0 ? _a : 80;
    const defaultFormatter = (_b = defaultColumnOptions === null || defaultColumnOptions === void 0 ? void 0 : defaultColumnOptions.formatter) !== null && _b !== void 0 ? _b : ValueFormatter;
    const defaultSortable = (_c = defaultColumnOptions === null || defaultColumnOptions === void 0 ? void 0 : defaultColumnOptions.sortable) !== null && _c !== void 0 ? _c : false;
    const defaultResizable = (_d = defaultColumnOptions === null || defaultColumnOptions === void 0 ? void 0 : defaultColumnOptions.resizable) !== null && _d !== void 0 ? _d : false;
    const { columns, lastFrozenColumnIndex, totalColumnWidth, totalFrozenColumnWidth, groupBy } = useMemo(() => {
        return getColumnMetrics({
            rawColumns,
            minColumnWidth,
            viewportWidth,
            columnWidths,
            defaultSortable,
            defaultResizable,
            defaultFormatter,
            rawGroupBy: rowGrouper ? rawGroupBy : undefined
        });
    }, [columnWidths, defaultFormatter, defaultResizable, defaultSortable, minColumnWidth, rawColumns, rawGroupBy, rowGrouper, viewportWidth]);
    const [colOverscanStartIdx, colOverscanEndIdx] = useMemo(() => {
        // get the viewport's left side and right side positions for non-frozen columns
        const viewportLeft = scrollLeft + totalFrozenColumnWidth;
        const viewportRight = scrollLeft + viewportWidth;
        // get first and last non-frozen column indexes
        const lastColIdx = columns.length - 1;
        const firstUnfrozenColumnIdx = Math.min(lastFrozenColumnIndex + 1, lastColIdx);
        // skip rendering non-frozen columns if the frozen columns cover the entire viewport
        if (viewportLeft >= viewportRight) {
            return [firstUnfrozenColumnIdx, firstUnfrozenColumnIdx];
        }
        // get the first visible non-frozen column index
        let colVisibleStartIdx = firstUnfrozenColumnIdx;
        while (colVisibleStartIdx < lastColIdx) {
            const { left, width } = columns[colVisibleStartIdx];
            // if the right side of the columnn is beyond the left side of the available viewport,
            // then it is the first column that's at least partially visible
            if (left + width > viewportLeft) {
                break;
            }
            colVisibleStartIdx++;
        }
        // get the last visible non-frozen column index
        let colVisibleEndIdx = colVisibleStartIdx;
        while (colVisibleEndIdx < lastColIdx) {
            const { left, width } = columns[colVisibleEndIdx];
            // if the right side of the column is beyond or equal to the right side of the available viewport,
            // then it the last column that's at least partially visible, as the previous column's right side is not beyond the viewport.
            if (left + width >= viewportRight) {
                break;
            }
            colVisibleEndIdx++;
        }
        const colOverscanStartIdx = Math.max(firstUnfrozenColumnIdx, colVisibleStartIdx - 1);
        const colOverscanEndIdx = Math.min(lastColIdx, colVisibleEndIdx + 1);
        return [colOverscanStartIdx, colOverscanEndIdx];
    }, [columns, lastFrozenColumnIndex, scrollLeft, totalFrozenColumnWidth, viewportWidth]);
    const viewportColumns = useMemo(() => {
        const viewportColumns = [];
        for (let colIdx = 0; colIdx <= colOverscanEndIdx; colIdx++) {
            const column = columns[colIdx];
            if (colIdx < colOverscanStartIdx && !column.frozen)
                continue;
            viewportColumns.push(column);
        }
        return viewportColumns;
    }, [colOverscanEndIdx, colOverscanStartIdx, columns]);
    return { columns, viewportColumns, totalColumnWidth, lastFrozenColumnIndex, totalFrozenColumnWidth, groupBy };
}
//# sourceMappingURL=useViewportColumns.js.map