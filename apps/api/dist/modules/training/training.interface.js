"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingEnrollmentStatus = exports.TrainingProgressStatus = exports.TrainingModuleType = exports.LEGACY_PHASE_MAP = exports.TrainingPhase = exports.TrainingRole = void 0;
var TrainingRole;
(function (TrainingRole) {
    TrainingRole["TAE"] = "TAE";
    TrainingRole["REP"] = "REP";
    TrainingRole["DIRECTOR"] = "DIRECTOR";
    TrainingRole["ADMIN"] = "ADMIN";
})(TrainingRole || (exports.TrainingRole = TrainingRole = {}));
var TrainingPhase;
(function (TrainingPhase) {
    TrainingPhase["LEVEL_1_OPERATOR"] = "LEVEL_1_OPERATOR";
    TrainingPhase["LEVEL_2_PRODUCT"] = "LEVEL_2_PRODUCT";
    TrainingPhase["LEVEL_3_TERRITORY"] = "LEVEL_3_TERRITORY";
    TrainingPhase["LEVEL_4_SALES"] = "LEVEL_4_SALES";
    TrainingPhase["LEVEL_5_EXPANSION"] = "LEVEL_5_EXPANSION";
    TrainingPhase["SPECIALIZED_TRACKS"] = "SPECIALIZED_TRACKS";
    TrainingPhase["LEVEL_7_DIRECTOR"] = "LEVEL_7_DIRECTOR";
    TrainingPhase["MARKET_MASTERY"] = "MARKET_MASTERY";
})(TrainingPhase || (exports.TrainingPhase = TrainingPhase = {}));
exports.LEGACY_PHASE_MAP = {
    DAY_1: TrainingPhase.LEVEL_1_OPERATOR,
    DAY_1_2: TrainingPhase.LEVEL_2_PRODUCT,
    WEEK_1_2: TrainingPhase.LEVEL_4_SALES,
    MONTH_1: TrainingPhase.LEVEL_5_EXPANSION,
};
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