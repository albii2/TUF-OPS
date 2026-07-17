"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionRequestStatus = exports.ProductionRequestType = void 0;
var ProductionRequestType;
(function (ProductionRequestType) {
    ProductionRequestType["MOCKUP"] = "MOCKUP";
    ProductionRequestType["SAMPLE"] = "SAMPLE";
})(ProductionRequestType || (exports.ProductionRequestType = ProductionRequestType = {}));
var ProductionRequestStatus;
(function (ProductionRequestStatus) {
    ProductionRequestStatus["REQUESTED"] = "REQUESTED";
    ProductionRequestStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ProductionRequestStatus["READY"] = "READY";
    ProductionRequestStatus["DELIVERED"] = "DELIVERED";
    ProductionRequestStatus["REVISION_REQUESTED"] = "REVISION_REQUESTED";
    ProductionRequestStatus["APPROVED"] = "APPROVED";
    ProductionRequestStatus["REJECTED"] = "REJECTED";
    ProductionRequestStatus["CANCELLED"] = "CANCELLED";
})(ProductionRequestStatus || (exports.ProductionRequestStatus = ProductionRequestStatus = {}));
//# sourceMappingURL=production-requests.interface.js.map