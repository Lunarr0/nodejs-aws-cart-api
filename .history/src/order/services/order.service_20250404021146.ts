import { Injectable, NotFoundException, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, Cart, CartItem } from '../../entities';
import { CreateOrderPayload, OrderStatuses } from '../type';
import { CartStatuses } from '../../cart/models';
import { CartService } from '@/cart';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private cartService: CartService,
    private dataSource: DataSource
  ) {}

  async createOrder(userId: string, orderData: CreateOrderDto): Promise<Order> {
    try {
      this.logger.debug(`Creating order for user: ${userId}`);
      this.logger.debug('Order payload:', JSON.stringify(orderData));

      return this.dataSource.transaction(async (transactionalEntityManager) => {
        // Find cart and verify it exists
        const cart = await this.cartService.findByUserId(userId);
        
        if (!cart) {
          this.logger.warn(`No active cart found for user: ${userId}`);
          throw new NotFoundException('Cart not found');
        }

        if (!cart.items || cart.items.length === 0) {
          this.logger.warn(`Cart is empty for user: ${userId}`);
          throw new BadRequestException('Cart is empty');
        }

        const total = this.calculateCartTotal(cart.items);
        this.logger.debug(`Calculated total: ${total}`);

        // Create order
        const statusHistory = [{
          status: OrderStatuses.ORDERED,
          timestamp: Date.now(),
          comment: 'Order created'
        }];

        const order = transactionalEntityManager.create(Order, {
          user_id: userId,
          cart_id: cart.id,
          status: OrderStatuses.ORDERED,
          total,
          delivery: orderData.address,
          status_history: statusHistory
        });

        const savedOrder = await transactionalEntityManager.save(Order, order);

        // Update cart status
        await this.cartService.removeByUserId(userId);

        // Return complete order
        const completeOrder = await transactionalEntityManager.findOne(Order, {
          where: { id: savedOrder.id },
          relations: ['cart', 'cart.items', 'cart.items.product']
        });

        if (!completeOrder) {
          throw new Error('Failed to fetch complete order after creation');
        }

        this.logger.debug(`Order created successfully: ${completeOrder.id}`);
        return completeOrder;
      });
    } catch (error) {
      this.logger.error(`Error creating order for user ${userId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  private calculateCartTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => {
      return sum + (item.product.price * item.count);
    }, 0);
  }

  // ... other OrderService methods ...
}
