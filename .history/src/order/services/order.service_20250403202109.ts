import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, Cart } from '../../entities';
import { CreateOrderPayload, OrderStatuses } from '../type';
import { CartStatuses } from '../../cart/models';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    private dataSource: DataSource
  ) {}

  async getAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['cart', 'cart.items', 'cart.items.product']
    });
  }

  async findById(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['cart', 'cart.items', 'cart.items.product']
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return order;
  }

  async create(orderPayload: CreateOrderPayload): Promise<Order> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const cart = await this.cartRepository.findOne({
        where: { id: orderPayload.cartId, user_id: orderPayload.userId, status: CartStatuses.OPEN },
        relations: ['cart', car 'items.product']
      });

      if (!cart) {
        throw new NotFoundException('Cart not found or not in OPEN status');
      }

      if (!cart.items || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // Update cart status
      await transactionalEntityManager.update(Cart, cart.id, {
        status: CartStatuses.ORDERED,
        updated_at: new Date()
      });

      const order = transactionalEntityManager.create(Order, {
        user_id: orderPayload.userId,
        cart_id: orderPayload.cartId,
        total: orderPayload.total,
        delivery: orderPayload.address,
        status: OrderStatuses.Ordered,
        status_history: [{
          status: OrderStatuses.Ordered,
          timestamp: Date.now(),
          comment: 'Order Created'
        }],
        payment: null,
        comments: null
      });

      const savedOrder = await transactionalEntityManager.save(Order, order);

      return await transactionalEntityManager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: ['cart', 'cart.items', 'cart.items.product']
      });
    });
  }

  async update(orderId: string, data: Partial<Order>): Promise<Order> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const order = await this.findById(orderId);

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      const updatedOrder = {
        ...order,
        ...data,
        id: orderId,
      };

      await transactionalEntityManager.save(Order, updatedOrder);

      return await transactionalEntityManager.findOne(Order, {
        where: { id: orderId },
        relations: ['cart', 'cart.items', 'cart.items.product']
      });
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatuses, comment: string): Promise<Order> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const order = await this.findById(orderId);

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
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
        status_history: updatedStatusHistory
      };

      await transactionalEntityManager.save(Order, updatedOrder);

      return await transactionalEntityManager.findOne(Order, {
        where: { id: orderId },
        relations: ['cart', 'cart.items', 'cart.items.product']
      });
    });
  }

  async checkout(userId: string, orderPayload: CreateOrderPayload): Promise<Order> {
    try {
      this.logger.debug(`Processing checkout for userId: ${userId}`);

      return this.dataSource.transaction(async (transactionalEntityManager) => {
        const cart = await this.cartRepository.findOne({
          where: { user_id: userId, status: CartStatuses.OPEN },
          relations: ['items', 'items.product']
        });

        if (!cart) {
          throw new NotFoundException('Cart not found or not in OPEN status');
        }

        if (!cart.items || cart.items.length === 0) {
          throw new NotFoundException('Cart is empty');
        }

        // Update cart status
        await transactionalEntityManager.update(Cart, cart.id, {
          status: CartStatuses.ORDERED,
          updated_at: new Date()
        });

        const order = transactionalEntityManager.create(Order, {
          user_id: orderPayload.userId,
          cart_id: orderPayload.cartId,
          total: orderPayload.total,
          delivery: orderPayload.address,
          status: OrderStatuses.Ordered,
          status_history: [
            {
              status: OrderStatuses.Ordered,
              timestamp: Date.now(),
              comment: 'Order created'
            }
          ],
          payment: null,
          comments: null
        });

        const savedOrder = await transactionalEntityManager.save(Order, order);

        return await transactionalEntityManager.findOne(Order, {
          where: { id: savedOrder.id },
          relations: ['cart', 'cart.items', 'cart.items.product']
        });
      });
    } catch (error) {
      this.logger.error(`Error processing checkout for user ${userId}:`, error);
      throw error;
    }
  }
}
