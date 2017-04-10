import { EventEmitter, TemplateRef } from '@angular/core';
import { WeekViewEvent } from 'calendar-utils';
export declare class CalendarWeekViewEventComponent {
    weekEvent: WeekViewEvent;
    tooltipPlacement: string;
    customTemplate: TemplateRef<any>;
    eventClicked: EventEmitter<any>;
}
