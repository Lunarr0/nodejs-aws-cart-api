import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart, CartItem, Order, OrderStatus, P } from '../../entities';
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
          status: CartStatuses.OPEN 
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
        status: CartStatuses.OPEN,
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
            // Create new product without ID to let the database generate it
            const newProduct = transactionalEntityManager.create(Product, {
              title: payload.product.title,
              description: payload.product.description,
              price: payload.product.price
            });
            product = await transactionalEntityManager.save(Product, newProduct);
            this.logger.debug(`Created new product: ${JSON.stringify(product)}`);
            
            // Update the payload with the new product id
            payload.product.id = product.id;
          }
  
          const cart = await this.findOrCreateByUserId(userId);
          this.logger.debug(`Found/Created cart: ${JSON.stringify(cart)}`);
  
          this.logger.debug(`Looking for existing cart item for product: ${payload.product.id}`);
          const cartItem = await transactionalEntityManager.findOne(CartItem, {
            where: {
              cart_id: cart.id,
              product_id: payload.product.id
            }
          });
          this.logger.debug(`Existing cart item: ${JSON.stringify(cartItem)}`);
  
          if (!cartItem && payload.count > 0) {
            this.logger.debug('Creating new cart item');
            const newCartItem = transactionalEntityManager.create(CartItem, {
              cart_id: cart.id,
              product_id: payload.product.id,
              count: payload.count
            });
            await transactionalEntityManager.save(CartItem, newCartItem);
          } else if (cartItem && payload.count === 0) {
            this.logger.debug('Removing cart item');
            await transactionalEntityManager.remove(CartItem, cartItem);
          } else if (cartItem) {
            this.logger.debug(`Updating cart item count to: ${payload.count}`);
            cartItem.count = payload.count;
            await transactionalEntityManager.save(CartItem, cartItem);
          }
  
          this.logger.debug('Updating cart timestamp');
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
  
  

  async removeByUserId(userId: string): Promise<void> {
    try {
      this.logger.debug(`Removing cart for userId: ${userId}`);
      const cart = await this.findByUserId(userId);
      
      if (!cart) {
        this.logger.warn(`Cart not found for user ${userId}`);
        throw new NotFoundException('Cart not found');
      }
    
      return this.dataSource.transaction(async (transactionalEntityManager) => {
        try {
          this.logger.debug(`Removing cart with ID: ${cart.id}`);
          await transactionalEntityManager.remove(Cart, cart);
          this.logger.debug('Cart removed successfully');
        } catch (error) {
          this.logger.error('Transaction error:', error);
          throw error;
        }
      });
    } catch (error) {
      this.logger.error(`Error removing cart for user ${userId}:`, error);
      throw error;
    }
  }

  async checkout(userId: string, orderPayload: CreateOrderPayload): Promise<Order> {
    try {
      this.logger.debug(`Processing checkout for userId: ${userId}`);
      this.logger.debug('Order payload:', JSON.stringify(orderPayload));

      const cart = await this.findByUserId(userId);
      if (!cart) {
        this.logger.warn(`Cart not found for user ${userId}`);
        throw new NotFoundException('Cart not found');
      }

      return this.dataSource.transaction(async (transactionalEntityManager) => {
        try {
          this.logger.debug('Updating cart status to ORDERED');
          await transactionalEntityManager.update(Cart, cart.id, {
            status: CartStatuses.ORDERED,
            updated_at: new Date()
          });

          this.logger.debug('Creating new order');
          const order = transactionalEntityManager.create(Order, {
            user_id: userId,
            cart_id: cart.id,
            items: orderPayload.items,
            address: orderPayload.address,
            status: OrderStatus.ORDERED,
            total: orderPayload.total
          });

          const savedOrder = await transactionalEntityManager.save(Order, order);
          this.logger.debug(`Order created: ${JSON.stringify(savedOrder)}`);
          return savedOrder;
        } catch (error) {
          this.logger.error('Transaction error:', error);
          throw error;
        }
      });
    } catch (error) {
      this.logger.error(`Error processing checkout for user ${userId}:`, error);
      throw error;
    }
  }
}
