export var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PREPARING"] = "preparing";
    OrderStatus["SHIPPING"] = "shipping";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (OrderStatus = {}));
export var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["COD"] = "cod";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
})(PaymentMethod || (PaymentMethod = {}));
export var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["UNPAID"] = "unpaid";
    PaymentStatus["PAID"] = "paid";
})(PaymentStatus || (PaymentStatus = {}));
//# sourceMappingURL=order.enums.js.map