import { Component, Input } from '@angular/core';
var CalendarEventTitleComponent = (function () {
    function CalendarEventTitleComponent() {
    }
    return CalendarEventTitleComponent;
}());
export { CalendarEventTitleComponent };
CalendarEventTitleComponent.decorators = [
    { type: Component, args: [{
                selector: 'mwl-calendar-event-title',
                template: "\n    <a\n      class=\"cal-event-title\"\n      href=\"javascript:;\"\n      [innerHTML]=\"event.title | calendarEventTitle:view:event\">\n    </a>\n  "
            },] },
];
/** @nocollapse */
CalendarEventTitleComponent.ctorParameters = function () { return []; };
CalendarEventTitleComponent.propDecorators = {
    'event': [{ type: Input },],
    'view': [{ type: Input },],
};
//# sourceMappingURL=calendarEventTitle.component.js.map