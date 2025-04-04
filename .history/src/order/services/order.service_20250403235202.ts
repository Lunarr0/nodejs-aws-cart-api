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
    try {
      return await this.dataSource.transaction(async (transactionalEntityManager) => {
        // Find cart and validate
        const cart = await transactionalEntityManager.findOne(Cart, {
          where: { 
            id: orderPayload.cartId,
            user_id: orderPayload.userId,
            status: CartStatuses.OPEN 
          },
          relations: ['items', 'items.product']
        });

        if (!cart) {
          throw new NotFoundException('Cart not found or not in OPEN status');
        }

        if (!cart.items || cart.items.length === 0) {
          throw new BadRequestException('Cart is empty');
        }

        // Update cart status to ORDERED
        await transactionalEntityManager.update(Cart, cart.id, {
          status: CartStatuses.ORDERED,
          updated_at: new Date()
        });

        // Create order with initial status
        const order = transactionalEntityManager.create(Order, {
          user_id: orderPayload.userId,
          cart_id: orderPayload.cartId,
          total: orderPayload.total,
          delivery: orderPayload.address,
          status: OrderStatuses.ORDERED, //change to open  22:35
          status_history: [{
            status: OrderStatuses.ORDERED, //change to open  22:35
            timestamp: Date.now(),
            comment: 'Initial Order created'
          }],
          payment: null,
          comments: null
        });

        const savedOrder = await transactionalEntityManager.save(Order, order);

        // Return complete order with relations
        return await transactionalEntityManager.findOne(Order, {
          where: { id: savedOrder.id },
          relations: ['cart', 'cart.items', 'cart.items.product']
        });
      });
    } catch (error) {
      this.logger.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatuses, comment: string): Promise<Order> {
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      const order = await this.findById(orderId);

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

      return await this.dataSource.transaction(async (transactionalEntityManager) => {
        // Find the cart for the user
        const cart = await transactionalEntityManager.findOne(Cart, {
          where: { user_id: userId, status: CartStatuses.OPEN },
          relations: ['items', 'items.product']
        });

        if (!cart) {
          throw new NotFoundException('Cart not found or not in OPEN status');
        }

        if (!cart.items || cart.items.length === 0) {
          throw new NotFoundException('Cart is empty');
        }

        // Calculate the total based on cart items
        const total = cart.items.reduce((sum, item) => 
          sum + (Number(item.product.price) * item.count), 0
        );

        // Update cart status to ORDERED
        await transactionalEntityManager.update(Cart, cart.id, {
          status: CartStatuses.ORDERED,
          updated_at: new Date()
        });

        // Create the order
        const order = transactionalEntityManager.create(Order, {
          user_id: userId,
          cart_id: cart.id,
          total: total,
          delivery: orderPayload.address,
          status: OrderStatuses.O,
          status_history: [{
            status: OrderStatuses.OPEN,
            timestamp: Date.now(),
            comment: 'Order created'
          }],
          payment: null,
          comments: null
        });

        const savedOrder = await transactionalEntityManager.save(Order, order);

        // Return complete order with relations
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
