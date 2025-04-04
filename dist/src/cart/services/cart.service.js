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
var CartService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../entities");
const models_1 = require("../models");
let CartService = CartService_1 = class CartService {
    constructor(cartRepository, cartItemRepository, orderRepository, dataSource) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderRepository = orderRepository;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(CartService_1.name);
    }
    async findByUserId(userId) {
        try {
            this.logger.debug(`Finding cart for userId: ${userId}`);
            const cart = await this.cartRepository.findOne({
                where: {
                    user_id: userId,
                    status: models_1.CartStatuses.OPEN
                },
                relations: ['items', 'items.product']
            });
            this.logger.debug(`Cart found: ${JSON.stringify(cart)}`);
            return cart;
        }
        catch (error) {
            this.logger.error(`Error finding cart for user ${userId}:`, error);
            throw error;
        }
    }
    async createByUserId(userId) {
        try {
            this.logger.debug(`Creating new cart for userId: ${userId}`);
            const cart = this.cartRepository.create({
                user_id: userId,
                status: models_1.CartStatuses.OPEN
            });
            const savedCart = await this.cartRepository.save(cart);
            this.logger.debug(`Created cart: ${JSON.stringify(savedCart)}`);
            return savedCart;
        }
        catch (error) {
            this.logger.error(`Error creating cart for user ${userId}:`, error);
            throw error;
        }
    }
    async findOrCreateByUserId(userId) {
        try {
            this.logger.debug(`Finding or creating cart for userId: ${userId}`);
            let cart = await this.findByUserId(userId);
            if (!cart) {
                this.logger.debug('Cart not found, creating new one');
                cart = await this.createByUserId(userId);
            }
            return cart;
        }
        catch (error) {
            this.logger.error(`Error in findOrCreateByUserId for user ${userId}:`, error);
            throw error;
        }
    }
    async updateByUserId(userId, payload) {
        try {
            this.logger.debug(`Updating cart for userId: ${userId}`);
            this.logger.debug('Update payload:', JSON.stringify(payload));
            return this.dataSource.transaction(async (transactionalEntityManager) => {
                try {
                    let product = await transactionalEntityManager.findOne(entities_1.Product, {
                        where: { id: payload.product.id }
                    });
                    if (!product) {
                        this.logger.debug(`Product ${payload.product.id} not found, creating new product`);
                        const newProduct = transactionalEntityManager.create(entities_1.Product, {
                            id: payload.product.id,
                            title: payload.product.title,
                            description: payload.product.description,
                            price: payload.product.price
                        });
                        product = await transactionalEntityManager.save(entities_1.Product, newProduct);
                    }
                    else {
                        await transactionalEntityManager.update(entities_1.Product, product.id, {
                            title: payload.product.title,
                            description: payload.product.description,
                            price: payload.product.price
                        });
                    }
                    const cart = await this.findOrCreateByUserId(userId);
                    if (payload.count > 0) {
                        const existingCartItem = await transactionalEntityManager.findOne(entities_1.CartItem, {
                            where: {
                                cart_id: cart.id,
                                product_id: product.id
                            }
                        });
                        if (existingCartItem) {
                            await transactionalEntityManager.update(entities_1.CartItem, { cart_id: cart.id, product_id: product.id }, { count: payload.count });
                        }
                        else {
                            await transactionalEntityManager.save(entities_1.CartItem, {
                                cart_id: cart.id,
                                product_id: product.id,
                                count: payload.count
                            });
                        }
                    }
                    else {
                        await transactionalEntityManager.delete(entities_1.CartItem, {
                            cart_id: cart.id,
                            product_id: product.id
                        });
                    }
                    await transactionalEntityManager.update(entities_1.Cart, cart.id, {
                        updated_at: new Date()
                    });
                    const updatedCart = await transactionalEntityManager.findOne(entities_1.Cart, {
                        where: { id: cart.id },
                        relations: ['items', 'items.product']
                    });
                    this.logger.debug(`Updated cart: ${JSON.stringify(updatedCart)}`);
                    return updatedCart;
                }
                catch (error) {
                    this.logger.error('Transaction error:', error);
                    throw error;
                }
            });
        }
        catch (error) {
            this.logger.error(`Error updating cart for user ${userId}:`, error);
            throw error;
        }
    }
};
exports.CartService = CartService;
exports.CartService = CartService = CartService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Cart)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.CartItem)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], CartService);
//# sourceMappingURL=cart.service.js.map