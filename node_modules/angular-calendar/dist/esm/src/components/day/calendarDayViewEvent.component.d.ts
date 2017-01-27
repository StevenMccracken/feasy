import { EventEmitter, ChangeDetectorRef } from '@angular/core';
import { DayViewEvent } from 'calendar-utils';
import { ResizeEvent } from 'angular-resizable-element';
export declare class CalendarDayViewEventComponent {
    private cdr;
    dayEvent: DayViewEvent;
    hourSegments: number;
    eventSnapSize: number;
    tooltipPlacement: string;
    dayViewContainer: HTMLElement;
    eventClicked: EventEmitter<any>;
    eventResized: EventEmitter<any>;
    currentResize: {
        originalTop: number;
        originalHeight: number;
        edge: string;
    };
    validateDrag: Function;
    validateResize: Function;
    constructor(cdr: ChangeDetectorRef);
    resizeStarted(event: DayViewEvent, resizeEvent: ResizeEvent): void;
    resizing(event: DayViewEvent, resizeEvent: ResizeEvent): void;
    resizeEnded(dayEvent: DayViewEvent): void;
    dragStart(event: HTMLElement): void;
    eventDragged(dayEvent: DayViewEvent, draggedInPixels: number): void;
}
