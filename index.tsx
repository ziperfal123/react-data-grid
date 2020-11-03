import { useMemo } from 'react';
import { unstable_createRoot } from 'react-dom';
import DataGrid from './src/';

const rows = Array(1000);

function CellFormatter(props) {
  return `${props.column.key}x${props.rowIdx}`;
}

function MillionCells() {
  const columns = useMemo(() => {
    const columns = [];

    for (let i = 0; i < 1000; i++) {
      const key = String(i);
      columns.push({
        key,
        name: key,
        frozen: i < 5,
        resizable: true,
        formatter: CellFormatter
      });
    }

    return columns;
  }, []);

  return (
    <DataGrid
      columns={columns}
      rows={rows}
      rowHeight={ 22}
      className= "fill-grid"
    />
  );
}

unstable_createRoot(document.getElementById('root'))
  .render(<MillionCells />);
