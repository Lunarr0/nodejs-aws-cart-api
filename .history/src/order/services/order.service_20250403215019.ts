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

  async create(orderPayload: CreateOrderPayload): Promise<Order> {
    try {
      this.logger.debug('Starting order creation with payload:', orderPayload);

      return this.dataSource.transaction(async (transactionalEntityManager) => {
        // Find cart with items
        const cart = await this.cartRepository.findOne({
          where: { 
            user_id: orderPayload.userId,
            status: CartStatuses.OPEN 
          },
          relations: {
            items: {
              product: true
            }
          }
        });

        this.logger.debug('Found cart:', cart);

        if (!cart) {
          this.logger.warn(`No open cart found for user ${orderPayload.userId}`);
          throw new NotFoundException('Cart not found or not in OPEN status');
        }

        if (!cart.items?.length) {
          this.logger.warn(`Cart ${cart.id} is empty`);
          throw new NotFoundException('Cart is empty');
        }

        // Calculate total from cart items
        const total = cart.items.reduce((sum, item) => 
          sum + (Number(item.product.price) * item.count), 0);
        this.logger.debug(`Calculated total: ${total}`);

        // Update cart status to ORDERED
        await transactionalEntityManager.update(Cart, cart.id, {
          status: CartStatuses.ORDERED,
          updated_at: new Date()
        });
        this.logger.debug(`Updated cart ${cart.id} status to ORDERED`);

        // Create order
        const orderData = {
          user_id: orderPayload.userId,
          cart_id: cart.id,
          total: total,
          delivery: orderPayload.address,
          status: OrderStatuses.Ordered,
          status_history: [{
            status: OrderStatuses.Ordered,
            timestamp: Date.now(),
            comment: 'Order created'
          }],
          payment: null,
          comments: null
        };

        this.logger.debug('Creating order with data:', orderData);
        const order = transactionalEntityManager.create(Order, orderData);
        const savedOrder = await transactionalEntityManager.save(Order, order);
        this.logger.debug('Order saved:', savedOrder);

        // Return complete order with relations
        const completeOrder = await transactionalEntityManager.findOne(Order, {
          where: { id: savedOrder.id },
          relations: {
            cart: {
              items: {
                product: true
              }
            }
          }
        });

        if (!completeOrder) {
          throw new Error('Failed to fetch complete order after creation');
        }

        this.logger.debug('Returning complete order:', completeOrder);
        return completeOrder;
      });
    } catch (error) {
      this.logger.error('Error creating order:', error);
      throw error;
    }
  }

  async getAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: {
        cart: {
          items: {
            product: true
          }
        }
      }
    });
  }

  async findById(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        cart: {
          items: {
            product: true
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return order;
  }

  async updateOrderStatus(orderId: string, status: OrderStatuses, comment: string): Promise<Order> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
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

      return await this.findById(orderId);
    });
  }
}
