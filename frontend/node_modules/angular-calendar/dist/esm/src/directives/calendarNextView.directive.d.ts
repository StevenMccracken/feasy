import { EventEmitter } from '@angular/core';
/**
 * Change the view date to the next view. For example:
 *
 * ```typescript
 * &lt;button
 *  mwlCalendarNextView
 *  [(viewDate)]="viewDate"
 *  [view]="view"&gt;
 *  Next
 * &lt;/button&gt;
 * ```
 */
export declare class CalendarNextViewDirective {
    /**
     * The current view
     */
    view: string;
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
