import { Directive, HostListener, Input, Output, EventEmitter } from '@angular/core';
import subDays from 'date-fns/sub_days';
import subWeeks from 'date-fns/sub_weeks';
import subMonths from 'date-fns/sub_months';
/**
 * Change the view date to the previous view. For example:
 *
 * ```typescript
 * &lt;button
 *  mwlCalendarPreviousView
 *  [(viewDate)]="viewDate"
 *  [view]="view"&gt;
 *  Previous
 * &lt;/button&gt;
 * ```
 */
var CalendarPreviousViewDirective = (function () {
    function CalendarPreviousViewDirective() {
        /**
         * Called when the view date is changed
         */
        this.viewDateChange = new EventEmitter();
    }
    /**
     * @hidden
     */
    CalendarPreviousViewDirective.prototype.onClick = function () {
        var subFn = {
            day: subDays,
            week: subWeeks,
            month: subMonths
        }[this.view];
        this.viewDateChange.emit(subFn(this.viewDate, 1));
    };
    return CalendarPreviousViewDirective;
}());
export { CalendarPreviousViewDirective };
CalendarPreviousViewDirective.decorators = [
    { type: Directive, args: [{
                selector: '[mwlCalendarPreviousView]'
            },] },
];
/** @nocollapse */
CalendarPreviousViewDirective.ctorParameters = function () { return []; };
CalendarPreviousViewDirective.propDecorators = {
    'view': [{ type: Input },],
    'viewDate': [{ type: Input },],
    'viewDateChange': [{ type: Output },],
    'onClick': [{ type: HostListener, args: ['click',] },],
};
//# sourceMappingURL=calendarPreviousView.directive.js.map