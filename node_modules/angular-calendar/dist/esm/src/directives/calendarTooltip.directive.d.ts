import { AfterViewChecked, OnDestroy, Renderer, Injector, ComponentFactoryResolver, ViewContainerRef, ElementRef } from '@angular/core';
export declare class CalendarTooltipWindowComponent {
    contents: string;
    placement: string;
}
export declare class CalendarTooltipDirective implements AfterViewChecked, OnDestroy {
    private elementRef;
    private renderer;
    private injector;
    private viewContainerRef;
    private document;
    contents: string;
    placement: string;
    private tooltipFactory;
    private tooltipRef;
    private positioning;
    constructor(elementRef: ElementRef, renderer: Renderer, injector: Injector, componentFactoryResolver: ComponentFactoryResolver, viewContainerRef: ViewContainerRef, document: any);
    ngAfterViewChecked(): void;
    ngOnDestroy(): void;
    onMouseOver(): void;
    onMouseOut(): void;
    private show();
    private hide();
    private positionPopover();
}
