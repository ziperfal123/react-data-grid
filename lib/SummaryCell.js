import React, { memo } from 'react';
import clsx from 'clsx';
function SummaryCell({ column, row }) {
    const { summaryFormatter: SummaryFormatter, width, left, summaryCellClass } = column;
    const className = clsx('rdg-cell', {
        'rdg-cell-frozen': column.frozen,
        'rdg-cell-frozen-last': column.isLastFrozenColumn
    }, typeof summaryCellClass === 'function' ? summaryCellClass(row) : summaryCellClass);
    return (React.createElement("div", { role: "gridcell", "aria-colindex": column.idx + 1, className: className, style: { width, left } }, SummaryFormatter && React.createElement(SummaryFormatter, { column: column, row: row })));
}
export default memo(SummaryCell);
//# sourceMappingURL=SummaryCell.js.map