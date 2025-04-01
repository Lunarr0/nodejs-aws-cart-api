"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const models_1 = require("../models");
let CartService = class CartService {
    constructor() {
        this.userCarts = {};
    }
    findByUserId(userId) {
        return this.userCarts[userId];
    }
    createByUserId(user_id) {
        const timestamp = Date.now();
        const userCart = {
            id: (0, node_crypto_1.randomUUID)(),
            user_id,
            created_at: timestamp,
            updated_at: timestamp,
            status: models_1.CartStatuses.OPEN,
            items: [],
        };
        this.userCarts[user_id] = userCart;
        return userCart;
    }
    findOrCreateByUserId(userId) {
        const userCart = this.findByUserId(userId);
        if (userCart) {
            return userCart;
        }
        return this.createByUserId(userId);
    }
    updateByUserId(userId, payload) {
        const userCart = this.findOrCreateByUserId(userId);
        const index = userCart.items.findIndex(({ product }) => product.id === payload.product.id);
        if (index === -1) {
            userCart.items.push(payload);
        }
        else if (payload.count === 0) {
            userCart.items.splice(index, 1);
        }
        else {
            userCart.items[index] = payload;
        }
        return userCart;
    }
    removeByUserId(userId) {
        this.userCarts[userId] = null;
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)()
], CartService);
//# sourceMappingURL=cart.service.js.map