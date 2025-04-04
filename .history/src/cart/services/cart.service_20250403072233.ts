import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart, CartItem, Order, OrderStatus, Product } from '../../entities';
import { PutCartPayload, CreateOrderPayload } from 'src/order/type';
import { CartStatuses } from '../models';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

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
    try {
      this.logger.debug(`Finding cart for userId: ${userId}`);
      const cart = await this.cartRepository.findOne({
        where: { 
          user_id: userId,
          status: 'Ordered'
        },
        relations: ['items', 'items.product']
      });
      this.logger.debug(`Cart found: ${JSON.stringify(cart)}`);
      return cart;
    } catch (error) {
      this.logger.error(`Error finding cart for user ${userId}:`, error);
      throw error;
    }
  }

  async createByUserId(userId: string): Promise<Cart> {
    try {
      this.logger.debug(`Creating new cart for userId: ${userId}`);
      const cart = this.cartRepository.create({
        user_id: userId,
        status: 'OPEN'
      });
      const savedCart = await this.cartRepository.save(cart);
      this.logger.debug(`Created cart: ${JSON.stringify(savedCart)}`);
      return savedCart;
    } catch (error) {
      this.logger.error(`Error creating cart for user ${userId}:`, error);
      throw error;
    }
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    try {
      this.logger.debug(`Finding or creating cart for userId: ${userId}`);
      let cart = await this.findByUserId(userId);
      if (!cart) {
        this.logger.debug('Cart not found, creating new one');
        cart = await this.createByUserId(userId);
      }
      return cart;
    } catch (error) {
      this.logger.error(`Error in findOrCreateByUserId for user ${userId}:`, error);
      throw error;
    }
  }

  async updateByUserId(userId: string, payload: PutCartPayload): Promise<Cart> {
    try {
      this.logger.debug(`Updating cart for userId: ${userId}`);
      this.logger.debug('Update payload:', JSON.stringify(payload));
  
      return this.dataSource.transaction(async (transactionalEntityManager) => {
        try {
          // First, ensure the product exists or create it
          let product = await transactionalEntityManager.findOne(Product, {
            where: { id: payload.product.id }
          });
  
          if (!product) {
            this.logger.debug(`Product ${payload.product.id} not found, creating new product`);
            const newProduct = transactionalEntityManager.create(Product, {
              id: payload.product.id,
              title: payload.product.title,
              description: payload.product.description,
              price: payload.product.price
            });
            product = await transactionalEntityManager.save(Product, newProduct);
            this.logger.debug(`Created new product: ${JSON.stringify(product)}`);
          } else {
            await transactionalEntityManager.update(Product, product.id, {
              title: payload.product.title,
              description: payload.product.description,
              price: payload.product.price
            });
          }

          const cart = await this.findOrCreateByUserId(userId);
          this.logger.debug(`Found/Created cart: ${JSON.stringify(cart)}`);
  
          // Find existing cart item
          const cartItem = await transactionalEntityManager.findOne(CartItem, {
            where: {
              cart_id: cart.id,
              product_id: product.id
            }
          });
  
          if (!cartItem && payload.count > 0) {
            this.logger.debug('Creating new cart item');
            const newCartItem = transactionalEntityManager.create(CartItem, {
              cart_id: cart.id,
              product_id: product.id,
              count: payload.count
            });
            await transactionalEntityManager.save(CartItem, newCartItem);
          } else if (cartItem && payload.count === 0) {
            this.logger.debug('Removing cart item');
            await transactionalEntityManager.delete(CartItem, {
              cart_id: cart.id,
              product_id: product.id
            });
          } else if (cartItem) {
            this.logger.debug(`Updating cart item count to: ${payload.count}`);
            await transactionalEntityManager.update(CartItem, 
              { cart_id: cart.id, product_id: product.id },
              { count: payload.count }
            );
          }
  
          await transactionalEntityManager.update(Cart, cart.id, {
            updated_at: new Date()
          });
  
          const updatedCart = await transactionalEntityManager.findOne(Cart, {
            where: { id: cart.id },
            relations: ['items', 'items.product']
          });
  
          this.logger.debug(`Updated cart: ${JSON.stringify(updatedCart)}`);
          return updatedCart;
        } catch (error) {
          this.logger.error('Transaction error:', error);
          throw error;
        }
      });
    } catch (error) {
      this.logger.error(`Error updating cart for user ${userId}:`, error);
      throw error;
    }
  }

  async checkout(userId: string, orderPayload: CreateOrderPayload): Promise<Order> {
    try {
      this.logger.debug(`Processing checkout for userId: ${userId}`);
      
      return this.dataSource.transaction(async (transactionalEntityManager) => {
        const cart = await this.findByUserId(userId);
        if (!cart) {
          throw new NotFoundException('Cart not found');
        }

        // Update cart status to ORDERED
        await transactionalEntityManager.update(Cart, cart.id, {
          status: 'ORDERED',
          updated_at: new Date()
        });

        // Create initial status history
        const statusHistory = [{
          status: OrderStatus.Open,
          timestamp: Date.now(),
          comment: 'Order created'
        }];

        // Create new order
        const order = transactionalEntityManager.create(Order, {
          user_id: orderPayload.userId,
          cart_id: orderPayload.cartId,
          status: OrderStatus.Open,
          total: orderPayload.total,
          delivery: orderPayload.address,
          status_history: statusHistory,
          items: orderPayload.items
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
