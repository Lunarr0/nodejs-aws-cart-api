import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

  async create(data: CreateOrderPayload): Promise<Order> {
    const order = this.orderRepository.create({
      user_id: data.userId,
      cart_id: data.cartId,
      total: data.total,
      delivery: data.address,
      status: OrderStatuses.Open,
      status_history: [
        {
          comment: 'Order was Created',
          status: OrderStatuses.Open,
          timestamp: Date.now(),
        },
      ],
    });

    return await this.orderRepository.save(order);
  }

  async update(orderId: string, data: Partial<Order>): Promise<Order> {
    const order = await this.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Merge the updates while preserving the ID
    const updatedOrder = {
      ...order,
      ...data,
      id: orderId,
    };

    return await this.orderRepository.save(updatedOrder);
  }

  async checkout(userId: string, orderPayload: CreateOrderPayload): Promise<Order> {
    try {
      this.logger.debug(`Processing checkout for userId: ${userId}`);
      
      return this.dataSource.transaction(async (transactionalEntityManager) => {
        // Find cart
        const cart = await this.cartRepository.findOne({
          where: { 
            user_id: userId,
            status: CartStatuses.OPEN
          },
          relations: ['items', 'items.product']
        });

        if (!cart) {
          throw new NotFoundException('Cart not found');
        }

        // Update cart status
        await transactionalEntityManager.update(Cart, cart.id, {
          status: CartStatuses.ORDERED,
          updated_at: new Date()
        });

        // Create order
        const order = transactionalEntityManager.create(Order, {
          userId: orderPayload.userId,
          cartId: orderPayload.cartId,
          status: OrderStatuses.Open,
          total: orderPayload.total,
          address: orderPayload.address,
          statusHistory: [{
            status: OrderStatuses.Open,
            timestamp: Date.now(),
            comment: 'Order Created'
          }]
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

  async updateOrderStatus(orderId: string, status: OrderStatuses, comment: string): Promise<Order> {
    const order = await this.findById(orderId);
    
    const updatedStatusHistory = [
      ...order.status_history,
      {
        status,
        timestamp: Date.now(),
        comment
      }
    ];

    return this.update(orderId, {
      status,
      status_history: updatedStatusHistory
    });
  }
}
