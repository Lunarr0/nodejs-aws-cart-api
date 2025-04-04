import { Injectable, NotFoundException, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, Cart, CartItem } from '../../entities';
import { CreateOrderDto, CreateOrderPayload, OrderStatuses } from '../type';
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

  async createOrder(userId: string, body: CreateOrderDto): Promise<Order> {
    try {
      this.logger.debug(`Processing order creation for user: ${userId}`);
      this.logger.debug('Order payload:', JSON.stringify(body));

      // Validate address data
      if (!this.isValidAddress(body.address)) {
        this.logger.warn('Invalid address data provided');
        throw new BadRequestException('Invalid address data');
      }

      // Find cart with items
      const cart = await this.cartService.findByUserId(userId);
      this.logger.debug(`Found cart:`, cart ? `ID: ${cart.id}` : 'No cart found');

      // Validate cart exists and has items
      if (!cart) {
        this.logger.warn(`No cart found for user: ${userId}`);
        throw new NotFoundException('Cart not found');
      }

      if (!cart.items || cart.items.length === 0) {
        this.logger.warn(`Cart is empty for user: ${userId}`);
        throw new BadRequestException('Cart is empty');
      }

      // Calculate total and validate items
      const { id: cartId, items } = cart;
      
      // Validate each item has valid count and product
      const invalidItems = items.filter(item => !item.product || item.count <= 0);
      if (invalidItems.length > 0) {
        this.logger.warn(`Invalid items found in cart: ${JSON.stringify(invalidItems)}`);
        throw new BadRequestException('Cart contains invalid items');
      }

      const total = this.calculateCartTotal(items);
      this.logger.debug(`Calculated total: ${total}`);

      if (total <= 0) {
        this.logger.warn(`Invalid cart total: ${total}`);
        throw new BadRequestException('Invalid cart total');
      }

      return this.dataSource.transaction(async (transactionalEntityManager) => {
        // Create order with status history
        const statusHistory = [{
          status: OrderStatuses.ORDERED,
          timestamp: Date.now(),
          comment: 'Order created'
        }];

        const order = transactionalEntityManager.create(Order, {
          user_id: userId,
          cart_id: cartId,
          status: OrderStatuses.ORDERED,
          total,
          delivery: body.address,
          status_history: statusHistory
        });

        const savedOrder = await transactionalEntityManager.save(Order, order);

        // Update cart status
        await this.cartService.removeByUserId(userId);
        this.logger.debug('Cart status updated to ORDERED');

        // Get complete order with relations
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
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  private isValidAddress(address: any): boolean {
    return !!(
      address &&
      typeof address.address === 'string' && address.address.trim() &&
      typeof address.firstName === 'string' && address.firstName.trim() &&
      typeof address.lastName === 'string' && address.lastName.trim()
    );
  }

  private calculateCartTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => {
      return sum + (item.product.price * item.count);
    }, 0);
  }
}
