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
var OrderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../entities");
const type_1 = require("../type");
const models_1 = require("../../cart/models");
let OrderService = OrderService_1 = class OrderService {
    constructor(orderRepository, cartRepository, dataSource) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(OrderService_1.name);
    }
    async create(orderPayload) {
        try {
            this.logger.debug(`Processing order creation for userId: ${orderPayload.userId}`);
            return this.dataSource.transaction(async (transactionalEntityManager) => {
                const cart = await transactionalEntityManager.findOne(entities_1.Cart, {
                    where: {
                        id: orderPayload.cartId,
                        user_id: orderPayload.userId,
                        status: models_1.CartStatuses.OPEN
                    },
                    relations: ['items', 'items.product']
                });
                if (!cart) {
                    this.logger.warn(`Cart not found or not in OPEN status for user ${orderPayload.userId}`);
                    throw new common_1.NotFoundException('Cart not found');
                }
                await transactionalEntityManager.update(entities_1.Cart, cart.id, {
                    status: models_1.CartStatuses.ORDERED,
                    updated_at: new Date()
                });
                const statusHistory = [{
                        status: type_1.OrderStatuses.ORDERED,
                        timestamp: Date.now(),
                        comment: 'Order created'
                    }];
                const order = transactionalEntityManager.create(entities_1.Order, {
                    user_id: orderPayload.userId,
                    cart_id: orderPayload.cartId,
                    status: type_1.OrderStatuses.ORDERED,
                    total: orderPayload.total,
                    delivery: orderPayload.address,
                    status_history: statusHistory
                });
                this.logger.debug('Saving order:', order);
                const savedOrder = await transactionalEntityManager.save(entities_1.Order, order);
                const completeOrder = await transactionalEntityManager.findOne(entities_1.Order, {
                    where: { id: savedOrder.id },
                    relations: ['cart', 'cart.items', 'cart.items.product']
                });
                if (!completeOrder) {
                    throw new Error('Failed to fetch complete order after creation');
                }
                this.logger.debug('Order created successfully:', completeOrder.id);
                return completeOrder;
            });
        }
        catch (error) {
            this.logger.error(`Error creating order for user ${orderPayload.userId}:`, error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to create order');
        }
    }
    async findById(orderId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['cart', 'cart.items', 'cart.items.product']
        });
        if (!order) {
            throw new common_1.NotFoundException(`Order with ID ${orderId} not found`);
        }
        return order;
    }
    async getAll() {
        return this.orderRepository.find({
            relations: ['cart', 'cart.items', 'cart.items.product']
        });
    }
    isValidStatusTransition(currentStatus, newStatus) {
        const validTransitions = {
            [type_1.OrderStatuses.OPEN]: [type_1.OrderStatuses.ORDERED],
            [type_1.OrderStatuses.ORDERED]: [type_1.OrderStatuses.PAID, type_1.OrderStatuses.CANCELLED],
            [type_1.OrderStatuses.PAID]: [type_1.OrderStatuses.PROCESSING, type_1.OrderStatuses.CANCELLED],
            [type_1.OrderStatuses.PROCESSING]: [type_1.OrderStatuses.SHIPPED, type_1.OrderStatuses.CANCELLED],
            [type_1.OrderStatuses.SHIPPED]: [type_1.OrderStatuses.DELIVERED, type_1.OrderStatuses.CANCELLED],
            [type_1.OrderStatuses.DELIVERED]: [],
            [type_1.OrderStatuses.CANCELLED]: []
        };
        return validTransitions[currentStatus]?.includes(newStatus) || false;
    }
    async updateOrderStatus(orderId, status, comment) {
        return this.dataSource.transaction(async (transactionalEntityManager) => {
            const order = await this.findById(orderId);
            if (!this.isValidStatusTransition(order.status, status)) {
                throw new common_1.BadRequestException(`Invalid status transition from ${order.status} to ${status}`);
            }
            const updatedStatusHistory = [
                ...order.status_history,
                {
                    status,
                    timestamp: Date.now(),
                    comment
                }
            ];
            const updatedOrder = {
                ...order,
                status,
                status_history: updatedStatusHistory,
                updated_at: new Date()
            };
            await transactionalEntityManager.save(entities_1.Order, updatedOrder);
            return await transactionalEntityManager.findOne(entities_1.Order, {
                where: { id: orderId },
                relations: ['cart', 'cart.items', 'cart.items.product']
            });
        });
    }
    async findByUserId(userId) {
        return this.orderRepository.find({
            where: { user_id: userId },
            relations: ['cart', 'cart.items', 'cart.items.product'],
        });
    }
    async findOrdersByUserId(userId) {
        try {
            this.logger.debug(`Finding orders for userId: ${userId}`);
            const orders = await this.orderRepository.find({
                where: { user_id: userId },
                relations: ['cart', 'cart.items', 'cart.items.product'],
                order: {}
            });
            this.logger.debug(`Found ${orders.length} orders for user ${userId}`);
            return orders;
        }
        catch (error) {
            this.logger.error(`Error finding orders for user ${userId}:`, error);
            throw error;
        }
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = OrderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Cart)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], OrderService);
//# sourceMappingURL=order.service.js.map