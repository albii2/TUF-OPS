"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingEnrollmentStatus = exports.TrainingProgressStatus = exports.TrainingModuleType = exports.TrainingPhase = exports.TrainingRole = void 0;
var TrainingRole;
(function (TrainingRole) {
    TrainingRole["TAE"] = "TAE";
    TrainingRole["DIRECTOR"] = "DIRECTOR";
    TrainingRole["ADMIN"] = "ADMIN";
})(TrainingRole || (exports.TrainingRole = TrainingRole = {}));
var TrainingPhase;
(function (TrainingPhase) {
    TrainingPhase["DAY_1"] = "DAY_1";
    TrainingPhase["DAY_1_2"] = "DAY_1_2";
    TrainingPhase["WEEK_1_2"] = "WEEK_1_2";
    TrainingPhase["MONTH_1"] = "MONTH_1";
})(TrainingPhase || (exports.TrainingPhase = TrainingPhase = {}));
var TrainingModuleType;
(function (TrainingModuleType) {
    TrainingModuleType["VIDEO"] = "VIDEO";
    TrainingModuleType["INTERACTIVE"] = "INTERACTIVE";
    TrainingModuleType["HANDS_ON"] = "HANDS_ON";
    TrainingModuleType["MODULE"] = "MODULE";
})(TrainingModuleType || (exports.TrainingModuleType = TrainingModuleType = {}));
var TrainingProgressStatus;
(function (TrainingProgressStatus) {
    TrainingProgressStatus["NOT_STARTED"] = "NOT_STARTED";
    TrainingProgressStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TrainingProgressStatus["COMPLETED"] = "COMPLETED";
})(TrainingProgressStatus || (exports.TrainingProgressStatus = TrainingProgressStatus = {}));
var TrainingEnrollmentStatus;
(function (TrainingEnrollmentStatus) {
    TrainingEnrollmentStatus["ACTIVE"] = "ACTIVE";
    TrainingEnrollmentStatus["COMPLETED"] = "COMPLETED";
    TrainingEnrollmentStatus["INACTIVE"] = "INACTIVE";
})(TrainingEnrollmentStatus || (exports.TrainingEnrollmentStatus = TrainingEnrollmentStatus = {}));
//# sourceMappingURL=training.interface.js.map