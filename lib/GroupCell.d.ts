import { GroupRowRendererProps, CalculatedColumn } from './types';
declare type SharedGroupRowRendererProps<R, SR> = Pick<GroupRowRendererProps<R, SR>, 'id' | 'rowIdx' | 'groupKey' | 'childRows' | 'isExpanded' | 'isRowSelected' | 'eventBus'>;
interface GroupCellProps<R, SR> extends SharedGroupRowRendererProps<R, SR> {
    column: CalculatedColumn<R, SR>;
    isCellSelected: boolean;
    groupColumnIndex: number;
}
declare const _default: <R, SR>(props: GroupCellProps<R, SR>) => JSX.Element;
export default _default;
