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
import { ASSIGNMENTS } from '../mock-data/mock-assignment';
import { AssignmentService } from '../service/assignment.service';
var HealthbarComponent = (function () {
    function HealthbarComponent(assignmentService) {
        this.assignmentService = assignmentService;
        this.type_HOMEWORK = 'homework';
        this.type_TEST = 'test';
        this.type_QUIZ = 'quiz';
        this.type_PROJECT = 'project';
        this.homeworkCounts = [0, 0, 0];
        this.testCounts = [0, 0, 0];
        this.quizCounts = [0, 0, 0];
        this.projectCounts = [0, 0, 0];
    }
    HealthbarComponent.prototype.getAssignments_DueSoon = function (assignments, dayLimit) {
        return assignments.filter(function (assignment) {
            return (((assignment.due - Math.round(+new Date() / 1000)) / 86400).valueOf() <= dayLimit);
        });
    };
    HealthbarComponent.prototype.getDateCategory = function (assignment, category0Limit, category1Limit, category2Limit) {
        var dueDateCategory = -1;
        var daysOut = Math.floor(((assignment.due - Math.round(+new Date() / 1000)) / 86400).valueOf());
        console.log(assignment.name + " is " + daysOut + " days away");
        if (daysOut <= category0Limit) {
            dueDateCategory = 0;
        }
        else if (daysOut > category0Limit && daysOut <= category1Limit) {
            dueDateCategory = 1;
        }
        else if (daysOut > category1Limit && daysOut <= category2Limit) {
            dueDateCategory = 2;
        }
        return dueDateCategory;
    };
    HealthbarComponent.prototype.countAssignmentDueDates = function (assignments) {
        for (var _i = 0, assignments_1 = assignments; _i < assignments_1.length; _i++) {
            var assignment = assignments_1[_i];
            var dueDateCategory = this.getDateCategory(assignment, 2, 5, 10);
            if (dueDateCategory != -1) {
                var type = assignment.type;
                switch (type) {
                    case this.type_HOMEWORK:
                        this.homeworkCounts[dueDateCategory]++;
                        break;
                    case this.type_TEST:
                        this.testCounts[dueDateCategory]++;
                        break;
                    case this.type_QUIZ:
                        this.quizCounts[dueDateCategory]++;
                        break;
                    case this.type_PROJECT:
                        this.projectCounts[dueDateCategory]++;
                        break;
                    default:
                }
            }
        }
    };
    HealthbarComponent.prototype.ngOnInit = function () {
        var allAssignments = ASSIGNMENTS;
        var assignmentsDueSoon = this.getAssignments_DueSoon(allAssignments, 10);
        this.countAssignmentDueDates(assignmentsDueSoon);
    };
    return HealthbarComponent;
}());
HealthbarComponent = __decorate([
    Component({
        selector: 'app-healthbar',
        templateUrl: './healthbar.component.html',
        styleUrls: ['./healthbar.component.css']
    }),
    __metadata("design:paramtypes", [AssignmentService])
], HealthbarComponent);
export { HealthbarComponent };
//# sourceMappingURL=../../../../src/app/healthbar/healthbar.component.js.map