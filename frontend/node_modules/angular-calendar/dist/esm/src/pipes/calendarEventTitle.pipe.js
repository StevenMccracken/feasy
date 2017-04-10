import { Pipe } from '@angular/core';
import { CalendarEventTitleFormatter } from '../providers/calendarEventTitleFormatter.provider';
var CalendarEventTitlePipe = (function () {
    function CalendarEventTitlePipe(calendarEventTitle) {
        this.calendarEventTitle = calendarEventTitle;
    }
    CalendarEventTitlePipe.prototype.transform = function (title, titleType, event) {
        return this.calendarEventTitle[titleType](event);
    };
    return CalendarEventTitlePipe;
}());
export { CalendarEventTitlePipe };
CalendarEventTitlePipe.decorators = [
    { type: Pipe, args: [{
                name: 'calendarEventTitle'
            },] },
];
/** @nocollapse */
CalendarEventTitlePipe.ctorParameters = function () { return [
    { type: CalendarEventTitleFormatter, },
]; };
//# sourceMappingURL=calendarEventTitle.pipe.js.map