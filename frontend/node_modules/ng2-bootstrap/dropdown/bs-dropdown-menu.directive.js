import { Directive, TemplateRef } from '@angular/core';
import { BsDropdownState } from './bs-dropdown.state';
export var BsDropdownMenuDirective = (function () {
    function BsDropdownMenuDirective(_state, _templateRef) {
        this._state = _state;
        this._templateRef = _templateRef;
        _state.resolveDropdownMenu(_templateRef);
    }
    BsDropdownMenuDirective.decorators = [
        { type: Directive, args: [{
                    selector: '[bsDropdownMenu],[dropdownMenu]',
                    exportAs: 'bs-dropdown-menu'
                },] },
    ];
    /** @nocollapse */
    BsDropdownMenuDirective.ctorParameters = function () { return [
        { type: BsDropdownState, },
        { type: TemplateRef, },
    ]; };
    return BsDropdownMenuDirective;
}());
//# sourceMappingURL=bs-dropdown-menu.directive.js.map