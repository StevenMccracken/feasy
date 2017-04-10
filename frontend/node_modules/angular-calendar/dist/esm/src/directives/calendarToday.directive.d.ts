import { EventEmitter } from '@angular/core';
/**
 * Change the view date to the current day. For example:
 *
 * ```typescript
 * &lt;button
 *  mwlCalendarToday
 *  [(viewDate)]="viewDate"&gt;
 *  Today
 * &lt;/button&gt;
 * ```
 */
export declare class CalendarTodayDirective {
    /**
     * The current view date
     */
    viewDate: Date;
    /**
     * Called when the view date is changed
     */
    viewDateChange: EventEmitter<Date>;
    /**
     * @hidden
     */
    onClick(): void;
}
