import { EventEmitter } from '@angular/core';
import { CalendarEvent } from 'calendar-utils';
export declare class CalendarAllDayEventComponent {
    event: CalendarEvent;
    eventClicked: EventEmitter<any>;
}
