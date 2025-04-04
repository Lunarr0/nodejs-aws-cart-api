import { Injectable, NotFoundException, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, Cart, CartItem } from '../../entities';
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

  async create(orderPayload: CreateOrderPayload): Promise<Order> {
    try {
      this.logger.debug(`Processing order creation for userId: ${orderPayload.userId}`);
      
      return this.dataSource.transaction(async (transactionalEntityManager) => {
        // Find cart and verify it exists
        const cart = await transactionalEntityManager.findOne(Cart, {
          where: { 
            id: orderPayload.cartId,
            user_id: orderPayload.userId,
            status: CartStatuses.OPEN 
          },
          relations: ['cart','cart.items', 'items.product']
        });

        if (!cart) {
          this.logger.warn(`Cart not found or not in OPEN status for user ${orderPayload.userId}`);
          throw new NotFoundException('Cart not found');
        }

        // Update cart status to ORDERED
        await transactionalEntityManager.update(Cart, cart.id, {
          status: CartStatuses.ORDERED,
          updated_at: new Date()
        });

        const statusHistory = [{
          status: OrderStatuses.ORDERED,
          timestamp: Date.now(),
          comment: 'Order created'
        }];

        // Create order
        const order = transactionalEntityManager.create(Order, {
          user_id: orderPayload.userId,
          cart_id: orderPayload.cartId,
          status: OrderStatuses.ORDERED,
          total: orderPayload.total,
          delivery: orderPayload.address, // Changed from delivery to address
          status_history: statusHistory
        });

        this.logger.debug('Saving order:', order);
        const savedOrder = await transactionalEntityManager.save(Order, order);

        // Return complete order with relations
        const completeOrder = await transactionalEntityManager.findOne(Order, {
          where: { id: savedOrder.id },
          relations: ['cart', 'cart.items', 'cart.items.product']
        });

        if (!completeOrder) {
          throw new Error('Failed to fetch complete order after creation');
        }

        this.logger.debug('Order created successfully:', completeOrder.id);
        return completeOrder;
      });
    } catch (error) {
      this.logger.error(`Error creating order for user ${orderPayload.userId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create order');
    }
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

  async getAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['cart', 'cart.items', 'cart.items.product']
    });
  }

  private isValidStatusTransition(currentStatus: OrderStatuses, newStatus: OrderStatuses): boolean {
    const validTransitions = {
      [OrderStatuses.OPEN]: [OrderStatuses.ORDERED],
      [OrderStatuses.ORDERED]: [OrderStatuses.PAID, OrderStatuses.CANCELLED],
      [OrderStatuses.PAID]: [OrderStatuses.PROCESSING, OrderStatuses.CANCELLED],
      [OrderStatuses.PROCESSING]: [OrderStatuses.SHIPPED, OrderStatuses.CANCELLED],
      [OrderStatuses.SHIPPED]: [OrderStatuses.DELIVERED, OrderStatuses.CANCELLED],
      [OrderStatuses.DELIVERED]: [],
      [OrderStatuses.CANCELLED]: []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  async updateOrderStatus(orderId: string, status: OrderStatuses, comment: string): Promise<Order> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const order = await this.findById(orderId);

      // Validate status transition
      if (!this.isValidStatusTransition(order.status, status)) {
        throw new BadRequestException(
          `Invalid status transition from ${order.status} to ${status}`
        );
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

      await transactionalEntityManager.save(Order, updatedOrder);

      return await transactionalEntityManager.findOne(Order, {
        where: { id: orderId },
        relations: ['cart', 'cart.items', 'cart.items.product']
      });
    });
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user_id: userId },
      relations: ['cart', 'cart.items', 'cart.items.product'],
      // order: { created_at: 'DESC' }
    });
  }
}
