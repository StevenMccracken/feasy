var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@angular/core';
import { ASSIGNMENTS } from '../mock-data/mock-assignment';
var AssignmentService = (function () {
    function AssignmentService() {
    }
    AssignmentService.prototype.getAssignments = function (uid) {
        return Promise.resolve(ASSIGNMENTS);
    };
    AssignmentService.prototype.getAssignment = function (uid, aid) {
        return this.getAssignments(uid)
            .then(function (assignments) { return assignments.find(function (assignment) { return assignment.assign_id === aid; }); });
    };
    return AssignmentService;
}());
AssignmentService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], AssignmentService);
export { AssignmentService };
//# sourceMappingURL=../../../../src/app/service/assignment.service.js.map