import { EventEmitter, TemplateRef } from '@angular/core';
import { DayViewEvent } from 'calendar-utils';
export declare class CalendarDayViewEventComponent {
    dayEvent: DayViewEvent;
    tooltipPlacement: string;
    customTemplate: TemplateRef<any>;
    eventClicked: EventEmitter<any>;
}
