import React from 'react';
export function ValueFormatter(props) {
    try {
        return React.createElement(React.Fragment, null, props.row[props.column.key]);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=ValueFormatter.js.map