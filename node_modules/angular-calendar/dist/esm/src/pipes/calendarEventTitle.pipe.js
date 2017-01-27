import { Pipe } from '@angular/core';
import { CalendarEventTitleFormatter } from '../providers/calendarEventTitle.provider';
export var CalendarEventTitlePipe = (function () {
    function CalendarEventTitlePipe(calendarEventTitle) {
        this.calendarEventTitle = calendarEventTitle;
    }
    CalendarEventTitlePipe.prototype.transform = function (title, titleType, event) {
        return this.calendarEventTitle[titleType](event);
    };
    CalendarEventTitlePipe.decorators = [
        { type: Pipe, args: [{
                    name: 'calendarEventTitle'
                },] },
    ];
    /** @nocollapse */
    CalendarEventTitlePipe.ctorParameters = function () { return [
        { type: CalendarEventTitleFormatter, },
    ]; };
    return CalendarEventTitlePipe;
}());
//# sourceMappingURL=calendarEventTitle.pipe.js.map