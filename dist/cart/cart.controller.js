"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("../auth");
const order_1 = require("../order");
const shared_1 = require("../shared");
const models_rules_1 = require("./models-rules");
const services_1 = require("./services");
let CartController = class CartController {
    constructor(cartService, orderService) {
        this.cartService = cartService;
        this.orderService = orderService;
    }
    findUserCart(req) {
        const cart = this.cartService.findOrCreateByUserId((0, shared_1.getUserIdFromRequest)(req));
        return cart.items;
    }
    updateUserCart(req, body) {
        const cart = this.cartService.updateByUserId((0, shared_1.getUserIdFromRequest)(req), body);
        return cart.items;
    }
    clearUserCart(req) {
        this.cartService.removeByUserId((0, shared_1.getUserIdFromRequest)(req));
    }
    checkout(req, body) {
        const userId = (0, shared_1.getUserIdFromRequest)(req);
        const cart = this.cartService.findByUserId(userId);
        if (!(cart && cart.items.length)) {
            throw new common_1.BadRequestException('Cart is empty');
        }
        const { id: cartId, items } = cart;
        const total = (0, models_rules_1.calculateCartTotal)(items);
        const order = this.orderService.create({
            userId,
            cartId,
            items: items.map(({ product, count }) => ({
                productId: product.id,
                count,
            })),
            address: body.address,
            total,
        });
        this.cartService.removeByUserId(userId);
        return {
            order,
        };
    }
    getOrder() {
        return this.orderService.getAll();
    }
};
exports.CartController = CartController;
__decorate([
    (0, common_1.UseGuards)(auth_1.BasicAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Array)
], CartController.prototype, "findUserCart", null);
__decorate([
    (0, common_1.UseGuards)(auth_1.BasicAuthGuard),
    (0, common_1.Put)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Array)
], CartController.prototype, "updateUserCart", null);
__decorate([
    (0, common_1.UseGuards)(auth_1.BasicAuthGuard),
    (0, common_1.Delete)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CartController.prototype, "clearUserCart", null);
__decorate([
    (0, common_1.UseGuards)(auth_1.BasicAuthGuard),
    (0, common_1.Put)('order'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CartController.prototype, "checkout", null);
__decorate([
    (0, common_1.UseGuards)(auth_1.BasicAuthGuard),
    (0, common_1.Get)('order'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], CartController.prototype, "getOrder", null);
exports.CartController = CartController = __decorate([
    (0, common_1.Controller)('api/profile/cart'),
    __metadata("design:paramtypes", [services_1.CartService,
        order_1.OrderService])
], CartController);
//# sourceMappingURL=cart.controller.js.map