import { Column, CalculatedColumn, FormatterProps } from '../types';
interface Metrics<R, SR> {
    rawColumns: readonly Column<R, SR>[];
    columnWidths: ReadonlyMap<string, number>;
    minColumnWidth: number;
    viewportWidth: number;
    defaultResizable: boolean;
    defaultSortable: boolean;
    defaultFormatter: React.ComponentType<FormatterProps<R, SR>>;
    rawGroupBy?: readonly string[];
}
interface ColumnMetrics<TRow, TSummaryRow> {
    columns: readonly CalculatedColumn<TRow, TSummaryRow>[];
    lastFrozenColumnIndex: number;
    totalFrozenColumnWidth: number;
    totalColumnWidth: number;
    groupBy: readonly string[];
}
export declare function getColumnMetrics<R, SR>(metrics: Metrics<R, SR>): ColumnMetrics<R, SR>;
export declare function getColumnScrollPosition<R, SR>(columns: readonly CalculatedColumn<R, SR>[], idx: number, currentScrollLeft: number, currentClientWidth: number): number;
/**
 * By default, the following navigation keys are enabled while an editor is open, under specific conditions:
 * - Tab:
 *   - The editor must be an <input>, a <textarea>, or a <select> element.
 *   - The editor element must be the only immediate child of the editor container/a label.
 */
export declare function onEditorNavigation({ key, target }: React.KeyboardEvent<HTMLDivElement>): boolean;
export {};
