import { Directive, HostListener, Input, Output, EventEmitter } from '@angular/core';
import addDays from 'date-fns/add_days';
import addWeeks from 'date-fns/add_weeks';
import addMonths from 'date-fns/add_months';
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
var CalendarNextViewDirective = (function () {
    function CalendarNextViewDirective() {
        /**
         * Called when the view date is changed
         */
        this.viewDateChange = new EventEmitter();
    }
    /**
     * @hidden
     */
    CalendarNextViewDirective.prototype.onClick = function () {
        var addFn = {
            day: addDays,
            week: addWeeks,
            month: addMonths
        }[this.view];
        this.viewDateChange.emit(addFn(this.viewDate, 1));
    };
    return CalendarNextViewDirective;
}());
export { CalendarNextViewDirective };
CalendarNextViewDirective.decorators = [
    { type: Directive, args: [{
                selector: '[mwlCalendarNextView]'
            },] },
];
/** @nocollapse */
CalendarNextViewDirective.ctorParameters = function () { return []; };
CalendarNextViewDirective.propDecorators = {
    'view': [{ type: Input },],
    'viewDate': [{ type: Input },],
    'viewDateChange': [{ type: Output },],
    'onClick': [{ type: HostListener, args: ['click',] },],
};
//# sourceMappingURL=calendarNextView.directive.js.map