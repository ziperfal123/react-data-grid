import { CalculatedColumn } from './types';
import { DataGridProps } from './DataGrid';
declare type SharedDataGridProps<R, SR> = Pick<DataGridProps<R, SR>, 'filters' | 'onFiltersChange'>;
export interface FilterRowProps<R, SR> extends SharedDataGridProps<R, SR> {
    columns: readonly CalculatedColumn<R, SR>[];
}
declare const _default: <R, SR>(props: FilterRowProps<R, SR>) => JSX.Element;
export default _default;
