"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCartTotal = calculateCartTotal;
function calculateCartTotal(items) {
    return items.length
        ? items.reduce((acc, { product: { price }, count }) => {
            return (acc += price * count);
        }, 0)
        : 0;
}
//# sourceMappingURL=index.js.map