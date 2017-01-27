import { EventEmitter } from '@angular/core';
import { WeekViewEvent } from 'calendar-utils';
export declare class CalendarWeekViewEventComponent {
    weekEvent: WeekViewEvent;
    tooltipPlacement: string;
    eventClicked: EventEmitter<any>;
}
