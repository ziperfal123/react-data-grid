import { Position, SelectRowEvent } from './types';
interface EventMap {
    SelectCell: (position: Position, openEditor?: boolean) => void;
    SelectRow: (event: SelectRowEvent) => void;
    ToggleGroup: (id: unknown) => void;
}
declare type EventName = keyof EventMap;
export default class EventBus {
    private readonly subscribers;
    subscribe<T extends EventName>(type: T, handler: EventMap[T]): () => void;
    dispatch<T extends EventName>(type: T, ...args: Parameters<EventMap[T]>): void;
}
export {};
