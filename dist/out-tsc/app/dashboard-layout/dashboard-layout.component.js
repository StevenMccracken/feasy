var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component } from '@angular/core';
var DashboardLayoutComponent = (function () {
    function DashboardLayoutComponent() {
        this.user = "Sign-In";
        this.items = [
            { icon: "fa fa-home fa-lg", menu: "Home" },
            { icon: "fa fa-list fa-lg", menu: "To-Do List" },
            { icon: "fa fa-file-word-o fa-lg", menu: "Work" },
            { icon: "fa fa-rocket fa-lg", menu: "Widgets" }
        ];
    }
    DashboardLayoutComponent.prototype.ngOnInit = function () {
    };
    return DashboardLayoutComponent;
}());
DashboardLayoutComponent = __decorate([
    Component({
        selector: 'app-dashboard-layout',
        templateUrl: './dashboard-layout.component.html',
        styleUrls: ['./dashboard-layout.component.css']
    }),
    __metadata("design:paramtypes", [])
], DashboardLayoutComponent);
export { DashboardLayoutComponent };
//# sourceMappingURL=../../../../src/app/dashboard-layout/dashboard-layout.component.js.map