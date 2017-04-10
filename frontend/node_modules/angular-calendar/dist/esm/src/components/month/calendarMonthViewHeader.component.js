import { Component, Input } from '@angular/core';
var CalendarMonthViewHeaderComponent = (function () {
    function CalendarMonthViewHeaderComponent() {
    }
    return CalendarMonthViewHeaderComponent;
}());
export { CalendarMonthViewHeaderComponent };
CalendarMonthViewHeaderComponent.decorators = [
    { type: Component, args: [{
                selector: 'mwl-calendar-month-view-header',
                template: "\n    <ng-template #defaultTemplate>\n      <div class=\"cal-cell-row cal-header\">\n        <div\n          class=\"cal-cell\"\n          *ngFor=\"let day of days\"\n          [class.cal-past]=\"day.isPast\"\n          [class.cal-today]=\"day.isToday\"\n          [class.cal-future]=\"day.isFuture\"\n          [class.cal-weekend]=\"day.isWeekend\">\n          {{ day.date | calendarDate:'monthViewColumnHeader':locale }}\n        </div>\n      </div>\n    </ng-template>\n    <ng-template\n      [ngTemplateOutlet]=\"customTemplate || defaultTemplate\"\n      [ngTemplateOutletContext]=\"{days: days, locale: locale}\">\n    </ng-template>\n  "
            },] },
];
/** @nocollapse */
CalendarMonthViewHeaderComponent.ctorParameters = function () { return []; };
CalendarMonthViewHeaderComponent.propDecorators = {
    'days': [{ type: Input },],
    'locale': [{ type: Input },],
    'customTemplate': [{ type: Input },],
};
//# sourceMappingURL=calendarMonthViewHeader.component.js.map