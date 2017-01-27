export var CalendarEventTitleFormatter = (function () {
    function CalendarEventTitleFormatter() {
    }
    CalendarEventTitleFormatter.prototype.month = function (event) {
        return event.title;
    };
    CalendarEventTitleFormatter.prototype.monthTooltip = function (event) {
        return event.title;
    };
    CalendarEventTitleFormatter.prototype.week = function (event) {
        return event.title;
    };
    CalendarEventTitleFormatter.prototype.weekTooltip = function (event) {
        return event.title;
    };
    CalendarEventTitleFormatter.prototype.day = function (event) {
        return event.title;
    };
    CalendarEventTitleFormatter.prototype.dayTooltip = function (event) {
        return event.title;
    };
    return CalendarEventTitleFormatter;
}());
//# sourceMappingURL=calendarEventTitle.provider.js.map