"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentTerms = exports.VendorTier = exports.VendorStatus = void 0;
var VendorStatus;
(function (VendorStatus) {
    VendorStatus["PROSPECT"] = "PROSPECT";
    VendorStatus["QUALIFIED"] = "QUALIFIED";
    VendorStatus["ACTIVE"] = "ACTIVE";
    VendorStatus["INACTIVE"] = "INACTIVE";
    VendorStatus["SUSPENDED"] = "SUSPENDED";
})(VendorStatus || (exports.VendorStatus = VendorStatus = {}));
var VendorTier;
(function (VendorTier) {
    VendorTier["PREMIUM"] = "PREMIUM";
    VendorTier["HIGH_VOLUME"] = "HIGH_VOLUME";
    VendorTier["MID_RANGE"] = "MID_RANGE";
})(VendorTier || (exports.VendorTier = VendorTier = {}));
var PaymentTerms;
(function (PaymentTerms) {
    PaymentTerms["NET_30"] = "NET_30";
    PaymentTerms["NET_60"] = "NET_60";
    PaymentTerms["DEPOSIT_50"] = "DEPOSIT_50";
    PaymentTerms["DEPOSIT_100"] = "DEPOSIT_100";
    PaymentTerms["COD"] = "COD";
})(PaymentTerms || (exports.PaymentTerms = PaymentTerms = {}));
//# sourceMappingURL=vendors.interface.js.map