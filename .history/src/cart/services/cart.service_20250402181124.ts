import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart, cart-item, Order } from '../../../src/entities';
import { PutCartPayload } from 'src/order/type';
import { CartStatuses } from '../models';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private dataSource: DataSource
  ) {}

  async findByUserId(userId: string): Promise<Cart> {
    return this.cartRepository.findOne({
      where: { 
        user_id: userId,
        status: CartStatuses.OPEN 
      },
      relations: ['items']
    });
  }

  async createByUserId(userId: string): Promise<Cart> {
    const cart = this.cartRepository.create({
      user_id: userId,
      status: CartStatuses.OPEN,
    });
    return await this.cartRepository.save(cart);
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    let cart = await this.findByUserId(userId);
    if (!cart) {
      cart = await this.createByUserId(userId);
    }
    return cart;
  }

  async updateByUserId(userId: string, payload: PutCartPayload): Promise<Cart> {
    const cart = await this.findOrCreateByUserId(userId);

    // Start a transaction
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // Find existing cart item
      const cartItem = await transactionalEntityManager.findOne(CartItem, {
        where: {
          cart_id: cart.id,
          product_id: payload.product.id
        }
      });

      if (!cartItem && payload.count > 0) {
        // Create new cart item
        await transactionalEntityManager.save(CartItem, {
          cart_id: cart.id,
          product_id: payload.product.id,
          count: payload.count
        });
      } else if (cartItem && payload.count === 0) {
        // Remove cart item
        await transactionalEntityManager.remove(CartItem, cartItem);
      } else if (cartItem) {
        // Update cart item count
        cartItem.count = payload.count;
        await transactionalEntityManager.save(CartItem, cartItem);
      }

      // Update cart's updated_at timestamp
      await transactionalEntityManager.update(Cart, cart.id, {
        updated_at: new Date()
      });

      return await transactionalEntityManager.findOne(Cart, {
        where: { id: cart.id },
        relations: ['items']
      });
    });
  }

  async checkout(userId: string, orderData: any): Promise<Order> {
    const cart = await this.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Start a transaction for checkout process
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // Update cart status to ORDERED
      await transactionalEntityManager.update(Cart, cart.id, {
        status: CartStatuses.ORDERED,
        updated_at: new Date()
      });

      // Create new order
      const order = transactionalEntityManager.create(Order, {
        user_id: userId,
        cart_id: cart.id,
        payment: orderData.payment,
        delivery: orderData.delivery,
        comments: orderData.comments,
        status: 'PENDING',
        total: orderData.total
      });

      return await transactionalEntityManager.save(Order, order);
    });
  }
}
