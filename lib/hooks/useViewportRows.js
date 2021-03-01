import { useMemo } from 'react';
const RENDER_BACTCH_SIZE = 8;
export function useViewportRows({ rawRows, rowHeight, clientHeight, scrollTop, groupBy, rowGrouper, expandedGroupIds }) {
    const [groupedRows, rowsCount] = useMemo(() => {
        if (groupBy.length === 0 || !rowGrouper)
            return [undefined, rawRows.length];
        const groupRows = (rows, [groupByKey, ...remainingGroupByKeys], startRowIndex) => {
            let groupRowsCount = 0;
            const groups = {};
            for (const [key, childRows] of Object.entries(rowGrouper(rows, groupByKey))) {
                // Recursively group each parent group
                const [childGroups, childRowsCount] = remainingGroupByKeys.length === 0
                    ? [childRows, childRows.length]
                    : groupRows(childRows, remainingGroupByKeys, startRowIndex + groupRowsCount + 1); // 1 for parent row
                groups[key] = { childRows, childGroups, startRowIndex: startRowIndex + groupRowsCount };
                groupRowsCount += childRowsCount + 1; // 1 for parent row
            }
            return [groups, groupRowsCount];
        };
        return groupRows(rawRows, groupBy, 0);
    }, [groupBy, rowGrouper, rawRows]);
    const [rows, allGroupRows] = useMemo(() => {
        const allGroupRows = new Set();
        if (!groupedRows)
            return [rawRows, allGroupRows];
        const flattenedRows = [];
        const expandGroup = (rows, parentId, level) => {
            if (Array.isArray(rows)) {
                flattenedRows.push(...rows);
                return;
            }
            Object.keys(rows).forEach((groupKey, posInSet, keys) => {
                var _a;
                // TODO: should users have control over the generated key?
                const id = parentId !== undefined ? `${parentId}__${groupKey}` : groupKey;
                const isExpanded = (_a = expandedGroupIds === null || expandedGroupIds === void 0 ? void 0 : expandedGroupIds.has(id)) !== null && _a !== void 0 ? _a : false;
                const { childRows, childGroups, startRowIndex } = rows[groupKey]; // https://github.com/microsoft/TypeScript/issues/17002
                const groupRow = {
                    id,
                    parentId,
                    groupKey,
                    isExpanded,
                    childRows,
                    level,
                    posInSet,
                    startRowIndex,
                    setSize: keys.length
                };
                flattenedRows.push(groupRow);
                allGroupRows.add(groupRow);
                if (isExpanded) {
                    expandGroup(childGroups, id, level + 1);
                }
            });
        };
        expandGroup(groupedRows, undefined, 0);
        return [flattenedRows, allGroupRows];
    }, [expandedGroupIds, groupedRows, rawRows]);
    const isGroupRow = (row) => allGroupRows.has(row);
    const overscanThreshold = 4;
    const rowVisibleStartIdx = Math.floor(scrollTop / rowHeight);
    const rowVisibleEndIdx = Math.min(rows.length - 1, Math.floor((scrollTop + clientHeight) / rowHeight));
    const rowOverscanStartIdx = Math.max(0, Math.floor((rowVisibleStartIdx - overscanThreshold) / RENDER_BACTCH_SIZE) * RENDER_BACTCH_SIZE);
    const rowOverscanEndIdx = Math.min(rows.length - 1, Math.ceil((rowVisibleEndIdx + overscanThreshold) / RENDER_BACTCH_SIZE) * RENDER_BACTCH_SIZE);
    return {
        rowOverscanStartIdx,
        rowOverscanEndIdx,
        rows,
        rowsCount,
        isGroupRow
    };
}
//# sourceMappingURL=useViewportRows.js.map