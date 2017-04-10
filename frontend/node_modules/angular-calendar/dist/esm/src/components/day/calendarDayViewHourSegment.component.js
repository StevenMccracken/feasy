import { Component, Input } from '@angular/core';
var CalendarDayViewHourSegmentComponent = (function () {
    function CalendarDayViewHourSegmentComponent() {
    }
    return CalendarDayViewHourSegmentComponent;
}());
export { CalendarDayViewHourSegmentComponent };
CalendarDayViewHourSegmentComponent.decorators = [
    { type: Component, args: [{
                selector: 'mwl-calendar-day-view-hour-segment',
                template: "\n    <ng-template #defaultTemplate>\n      <div\n        class=\"cal-hour-segment\"\n        [class.cal-hour-start]=\"segment.isStart\"\n        [class.cal-after-hour-start]=\"!segment.isStart\"\n        [ngClass]=\"segment.cssClass\">\n        <div class=\"cal-time\">\n          {{ segment.date | calendarDate:'dayViewHour':locale }}\n        </div>\n      </div>\n    </ng-template>\n    <ng-template\n      [ngTemplateOutlet]=\"customTemplate || defaultTemplate\"\n      [ngTemplateOutletContext]=\"{\n        segment: segment,\n        locale: locale\n      }\">\n    </ng-template>\n  "
            },] },
];
/** @nocollapse */
CalendarDayViewHourSegmentComponent.ctorParameters = function () { return []; };
CalendarDayViewHourSegmentComponent.propDecorators = {
    'segment': [{ type: Input },],
    'locale': [{ type: Input },],
    'customTemplate': [{ type: Input },],
};
//# sourceMappingURL=calendarDayViewHourSegment.component.js.map