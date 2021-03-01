import React from 'react';
import { CalculatedColumn } from '../types';
interface ResizableHeaderCellProps<R, SR> {
    children: React.ReactElement<React.ComponentProps<'div'>>;
    column: CalculatedColumn<R, SR>;
    onResize: (column: CalculatedColumn<R, SR>, width: number) => void;
}
export default function ResizableHeaderCell<R, SR>({ children, column, onResize }: ResizableHeaderCellProps<R, SR>): React.ReactElement<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, string | ((props: any) => React.ReactElement<any, any> | null) | (new (props: any) => React.Component<any, any, any>)>;
export {};
