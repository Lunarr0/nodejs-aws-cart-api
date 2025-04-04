import { Injectable, NotFoundException, Logger, BadRequestException, I } from '@nestjs/common';
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

        // Create the order with initial status
        const order = transactionalEntityManager.create(Order, {
          user_id: orderPayload.userId,
          cart_id: orderPayload.cartId,
          total: orderPayload.total,
          delivery: orderPayload.address,
          status: OrderStatuses.ORDERED, // Set initial status to ORDERED
          status_history: [{
            status: OrderStatuses.ORDERED,
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

  // async checkout(userId: string, orderPayload: CreateOrderPayload): Promise<Order> {
  //   try {
  //     this.logger.debug(`Processing checkout for userId: ${userId}`);

  //     return await this.dataSource.transaction(async (transactionalEntityManager) => {
  //       const cart = await transactionalEntityManager.findOne(Cart, {
  //         where: { user_id: userId, status: CartStatuses.ORDERED },
  //         relations: ['items', 'items.product']
  //       });

  //       if (!cart) {
  //         throw new NotFoundException('Cart not found or not in OPEN status');
  //       }

  //       if (!cart.items || cart.items.length === 0) {
  //         throw new NotFoundException('Cart is empty');
  //       }

  //       // Calculate the total based on cart items
  //       const total = cart.items.reduce((sum, item) => 
  //         sum + (Number(item.product.price) * item.count), 0
  //       );

  //       // Update cart status to ORDERED
  //       await transactionalEntityManager.update(Cart, cart.id, {
  //         status: CartStatuses.ORDERED,
  //         updated_at: new Date()
  //       });

  //       // Create the order
  //       const order = transactionalEntityManager.create(Order, {
  //         user_id: userId,
  //         cart_id: cart.id,
  //         total: total,
  //         delivery: orderPayload.address,
  //         status: OrderStatuses.ORDERED, // Ensure the status is set to ORDERED
  //         status_history: [{
  //           status: OrderStatuses.ORDERED,
  //           timestamp: Date.now(),
  //           comment: 'Order created'
  //         }],
  //         payment: null,
  //         comments: null
  //       });

  //       const savedOrder = await transactionalEntityManager.save(Order, order);

  //       // Return complete order with relations
  //       return await transactionalEntityManager.findOne(Order, {
  //         where: { id: savedOrder.id },
  //         relations: ['cart', 'cart.items', 'cart.items.product']
  //       });
  //     });
  //   } catch (error) {
  //     this.logger.error(`Error processing checkout for user ${userId}:`, error);
  //     throw error;
  //   }
  // }

  async checkout(userId: string, orderPayload: CreateOrderPayload): Promise<Order> {
    try {
      this.logger.debug(`Starting checkout process for user ${userId}`);

      return await this.dataSource.transaction(async (transactionalEntityManager) => {
        // Find cart with explicit relations
        const cart = await transactionalEntityManager.findOne(Cart, {
          where: { 
            user_id: userId,
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
          this.logger.warn(`No OPEN cart found for user ${userId}`);
          throw new NotFoundException('No active cart found. Please create a cart first.');
        }

        // Explicitly check cart items
        const cartItems = await transactionalEntityManager
          .createQueryBuilder(CartItem, 'cartItem')
          .leftJoinAndSelect('cartItem.product', 'product')
          .where('cartItem.cart_id = :cartId', { cartId: cart.id })
          .getMany();

        this.logger.debug('Cart items found:', cartItems);

        if (!cartItems || cartItems.length === 0) {
          this.logger.warn(`Cart ${cart.id} has no items`);
          throw new BadRequestException('Cart is empty. Please add items before checkout.');
        }

        // Calculate total
        const total = cartItems.reduce((sum, item) => 
          sum + (Number(item.product.price) * item.count), 0
        );
        this.logger.debug(`Calculated total: ${total}`);

        // Update cart status
        await transactionalEntityManager.update(Cart, cart.id, {
          status: CartStatuses.ORDERED,
          updated_at: new Date()
        });
        this.logger.debug(`Updated cart ${cart.id} status to ORDERED`);

        // Create order
        const order = transactionalEntityManager.create(Order, {
          user_id: userId,
          cart_id: cart.id,
          total: total,
          delivery: orderPayload.address,
          status: OrderStatuses.ORDERED,
          status_history: [{
            status: OrderStatuses.ORDERED,
            timestamp: Date.now(),
            comment: 'Order created via checkout'
          }],
          payment: null,
          comments: null
        });

        this.logger.debug('Creating order with data:', order);
        const savedOrder = await transactionalEntityManager.save(Order, order);
        this.logger.debug('Order saved:', savedOrder);

        // Return complete order
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

        this.logger.debug('Checkout completed successfully');
        return completeOrder;
      });
    } catch (error) {
      this.logger.error('Checkout failed:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process checkout');
    }
  }
}
