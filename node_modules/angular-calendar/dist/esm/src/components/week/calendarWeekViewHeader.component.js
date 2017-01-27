import { Component, Input } from '@angular/core';
export var CalendarWeekViewHeaderComponent = (function () {
    function CalendarWeekViewHeaderComponent() {
    }
    CalendarWeekViewHeaderComponent.decorators = [
        { type: Component, args: [{
                    selector: 'mwl-calendar-week-view-header',
                    template: "\n    <b>{{ day.date | calendarDate:'weekViewColumnHeader':locale }}</b><br>\n    <span>{{ day.date | calendarDate:'weekViewColumnSubHeader':locale }}</span>\n  ",
                    host: {
                        '[class]': '"cal-header"',
                        '[class.cal-past]': 'day.isPast',
                        '[class.cal-today]': 'day.isToday',
                        '[class.cal-future]': 'day.isFuture',
                        '[class.cal-weekend]': 'day.isWeekend'
                    }
                },] },
    ];
    /** @nocollapse */
    CalendarWeekViewHeaderComponent.ctorParameters = function () { return []; };
    CalendarWeekViewHeaderComponent.propDecorators = {
        'day': [{ type: Input },],
        'locale': [{ type: Input },],
    };
    return CalendarWeekViewHeaderComponent;
}());
//# sourceMappingURL=calendarWeekViewHeader.component.js.map