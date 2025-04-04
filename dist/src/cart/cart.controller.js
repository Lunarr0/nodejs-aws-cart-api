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
var CartController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("../auth");
const services_1 = require("../order/services");
const shared_1 = require("../shared");
const services_2 = require("./services");
let CartController = CartController_1 = class CartController {
    constructor(cartService, orderService) {
        this.cartService = cartService;
        this.orderService = orderService;
        this.logger = new common_1.Logger(CartController_1.name);
    }
    async findUserCart(req) {
        try {
            const userId = (0, shared_1.getUserIdFromRequest)(req);
            this.logger.debug(`Finding cart for user: ${userId}`);
            const cart = await this.cartService.findOrCreateByUserId(userId);
            this.logger.debug(`Cart found: ${JSON.stringify(cart)}`);
            return cart.items;
        }
        catch (error) {
            this.logger.error('Error finding cart:', error);
            throw new common_1.InternalServerErrorException({
                message: 'Failed to fetch cart',
                error: error.message
            });
        }
    }
    async updateUserCart(req, body) {
        try {
            const userId = (0, shared_1.getUserIdFromRequest)(req);
            this.logger.debug(`Updating cart for user: ${userId}`);
            this.logger.debug('Update payload:', JSON.stringify(body));
            const cart = await this.cartService.updateByUserId(userId, body);
            this.logger.debug(`Cart updated: ${JSON.stringify(cart)}`);
            return cart.items;
        }
        catch (error) {
            this.logger.error('Error updating cart:', error);
            throw new common_1.InternalServerErrorException({
                message: 'Failed to update cart',
                error: error.message,
                details: error.stack
            });
        }
    }
    async clearUserCart(req) {
        try {
            const userId = (0, shared_1.getUserIdFromRequest)(req);
            this.logger.debug(`Clearing cart for user: ${userId}`);
            this.logger.debug('Cart cleared successfully');
        }
        catch (error) {
            this.logger.error('Error clearing cart:', error);
            throw new common_1.InternalServerErrorException({
                message: 'Failed to clear cart',
                error: error.message
            });
        }
    }
    async getOrder() {
        try {
            this.logger.debug('Fetching all orders');
            const orders = await this.orderService.getAll();
            this.logger.debug(`Found ${orders.length} orders`);
            return orders;
        }
        catch (error) {
            this.logger.error('Error fetching orders:', error);
            throw new common_1.InternalServerErrorException({
                message: 'Failed to fetch orders',
                error: error.message
            });
        }
    }
    async checkout(req, body) {
        try {
            const userId = (0, shared_1.getUserIdFromRequest)(req);
            this.logger.debug(`Processing checkout for user: ${userId}`);
            this.logger.debug('Checkout payload:', JSON.stringify(body));
            if (!this.isValidAddress(body.address)) {
                this.logger.warn('Invalid address data provided');
                throw new common_1.BadRequestException('Invalid address data');
            }
            const cart = await this.cartService.findByUserId(userId);
            this.logger.debug(`Found cart:`, cart ? `ID: ${cart.id}` : 'No cart found');
            if (!cart) {
                this.logger.warn(`No cart found for user: ${userId}`);
                throw new common_1.NotFoundException('Cart not found');
            }
            if (!cart.items || cart.items.length === 0) {
                this.logger.warn(`Cart is empty for user: ${userId}`);
                throw new common_1.BadRequestException('Cart is empty');
            }
            const { id: cartId, items } = cart;
            const invalidItems = items.filter(item => !item.product || item.count <= 0);
            if (invalidItems.length > 0) {
                this.logger.warn(`Invalid items found in cart: ${JSON.stringify(invalidItems)}`);
                throw new common_1.BadRequestException('Cart contains invalid items');
            }
            const total = this.calculateCartTotal(items);
            this.logger.debug(`Calculated total: ${total}`);
            if (total <= 0) {
                this.logger.warn(`Invalid cart total: ${total}`);
                throw new common_1.BadRequestException('Invalid cart total');
            }
            const orderPayload = {
                userId,
                cartId,
                items: items.map(({ product, count }) => ({
                    productId: product.id,
                    count,
                })),
                address: body.address,
                total,
            };
            const order = await this.orderService.create(orderPayload);
            this.logger.debug(`Order created with ID: ${order.id}`);
            this.logger.debug('Cart status updated to ORDERED');
            return {
                order,
                message: 'Order created successfully'
            };
        }
        catch (error) {
            this.logger.error('Error processing checkout:', error);
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException({
                message: 'Failed to process checkout',
                error: error.message
            });
        }
    }
    isValidAddress(address) {
        return !!(address &&
            typeof address.address === 'string' && address.address.trim() &&
            typeof address.firstName === 'string' && address.firstName.trim() &&
            typeof address.lastName === 'string' && address.lastName.trim());
    }
    calculateCartTotal(items) {
        return items.reduce((sum, item) => {
            const price = Number(item.product?.price) || 0;
            return sum + (price * item.count);
        }, 0);
    }
};
exports.CartController = CartController;
__decorate([
    (0, common_1.UseGuards)(auth_1.BasicAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "findUserCart", null);
__decorate([
    (0, common_1.UseGuards)(auth_1.BasicAuthGuard),
    (0, common_1.Put)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "updateUserCart", null);
__decorate([
    (0, common_1.UseGuards)(auth_1.BasicAuthGuard),
    (0, common_1.Delete)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "clearUserCart", null);
__decorate([
    (0, common_1.UseGuards)(auth_1.BasicAuthGuard),
    (0, common_1.Get)('order'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CartController.prototype, "getOrder", null);
__decorate([
    (0, common_1.UseGuards)(auth_1.BasicAuthGuard),
    (0, common_1.Put)('order'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "checkout", null);
exports.CartController = CartController = CartController_1 = __decorate([
    (0, common_1.Controller)('api/profile/cart'),
    (0, common_1.UseGuards)(auth_1.BasicAuthGuard),
    __metadata("design:paramtypes", [services_2.CartService,
        services_1.OrderService])
], CartController);
//# sourceMappingURL=cart.controller.js.map