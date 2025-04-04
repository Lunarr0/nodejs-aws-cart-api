import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart, CartItem, Order, OrderStatus } from 'src/entities';
import { PutCartPayload, CreateOrderPayload } from 'src/order/type';
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
      relations: ['items', 'items.product']
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

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const cartItem = await transactionalEntityManager.findOne(CartItem, {
        where: {
          cart_id: cart.id,
          product_id: payload.product.id
        }
      });

      if (!cartItem && payload.count > 0) {
        await transactionalEntityManager.save(CartItem, {
          cart_id: cart.id,
          product_id: payload.product.id,
          count: payload.count
        });
      } else if (cartItem && payload.count === 0) {
        await transactionalEntityManager.remove(CartItem, cartItem);
      } else if (cartItem) {
        cartItem.count = payload.count;
        await transactionalEntityManager.save(CartItem, cartItem);
      }

      await transactionalEntityManager.update(Cart, cart.id, {
        updated_at: new Date()
      });

      return await transactionalEntityManager.findOne(Cart, {
        where: { id: cart.id },
        relations: ['items', 'items.product']
      });
    });
  }

  

  // async removeByUserId(userId: string): Promise<void> {
  //   const cart = await this.findByUserId(userId);
    
  //   if (!cart) {
  //     throw new NotFoundException('Cart not found');
  //   }

  //   return this.dataSource.transaction(async (transactionalEntityManager) => {
  //     // First remove all cart items
  //     await transactionalEntityManager
  //       .createQueryBuilder()
  //       .delete()
  //       .from(CartItem)
  //       .where("cart_id = :cartId", { cartId: cart.id })
  //       .execute();

  //     // Then remove the cart itself
  //     await transactionalEntityManager
  //       .createQueryBuilder()
  //       .delete()
  //       .from(Cart)
  //       .where("id = :id", { id: cart.id })
  //       .execute();
  //   });
  // }


  async checkout(userId: string, orderPayload: CreateOrderPayload): Promise<Order> {
    const cart = await this.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // Update cart status to ORDERED
      await transactionalEntityManager.update(Cart, cart.id, {
        status: CartStatuses.STATUS,
        updated_at: new Date()
      });

      // Create new order
      const order = transactionalEntityManager.create(Order, {
        user_id: userId,
        cart_id: cart.id,
        items: orderPayload.items,
        address: orderPayload.address,
        status: OrderStatus.ORDERED,
        total: orderPayload.total
      });

      return await transactionalEntityManager.save(Order, order);
    });
  }
}
