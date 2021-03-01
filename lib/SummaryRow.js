import React, { memo } from 'react';
import SummaryCell from './SummaryCell';
function SummaryRow({ rowIdx, row, viewportColumns, bottom, 'aria-rowindex': ariaRowIndex }) {
    return (React.createElement("div", { role: "row", "aria-rowindex": ariaRowIndex, className: `rdg-row rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'} rdg-summary-row`, style: { bottom } }, viewportColumns.map(column => (React.createElement(SummaryCell, { key: column.key, column: column, row: row })))));
}
export default memo(SummaryRow);
//# sourceMappingURL=SummaryRow.js.map