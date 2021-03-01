import { CalculatedColumn } from './types';
import { HeaderRowProps } from './HeaderRow';
declare type SharedHeaderRowProps<R, SR> = Pick<HeaderRowProps<R, SR>, 'sortColumn' | 'sortDirection' | 'onSort' | 'allRowsSelected'>;
export interface HeaderCellProps<R, SR> extends SharedHeaderRowProps<R, SR> {
    column: CalculatedColumn<R, SR>;
    onResize: (column: CalculatedColumn<R, SR>, width: number) => void;
    onAllRowsSelectionChange: (checked: boolean) => void;
}
export default function HeaderCell<R, SR>({ column, onResize, allRowsSelected, onAllRowsSelectionChange, sortColumn, sortDirection, onSort }: HeaderCellProps<R, SR>): JSX.Element;
export {};
