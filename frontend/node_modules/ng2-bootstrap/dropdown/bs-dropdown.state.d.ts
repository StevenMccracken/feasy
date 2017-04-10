import { EventEmitter, TemplateRef } from '@angular/core';
export declare class BsDropdownState {
    direction: 'down' | 'up';
    autoClose: boolean;
    isOpenChange: EventEmitter<boolean>;
    isDisabledChange: EventEmitter<boolean>;
    toggleClick: EventEmitter<boolean>;
    /**
     * Content to be displayed as popover.
     */
    dropdownMenu: Promise<TemplateRef<any>>;
    resolveDropdownMenu: Function;
    constructor();
}
