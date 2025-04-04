import {
  Controller,
  Get,
  Delete,
  Put,
  Body,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';

import { BasicAuthGuard } from '../auth';
import { OrderService } from '../order/services';
import { Order } from '../entities/order.entity';  // Update this import to use the entity
import { AppRequest, getUserIdFromRequest } from '../shared';
import { calculateCartTotal } from './models-rules';
import { CartService } from './services';
import { CartItem } from './models';
import { CreateOrderDto, PutCartPayload } from 'src/order/type';

@Controller('api/profile/cart')
@UseGuards(BasicAuthGuard)
export class CartController {
  // ... other code remains the same ...
  private readonly logger = new Logger(CartController.name);
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    ) {}

    @UseGuards(BasicAuthGuard)

    @Get()
    async findUserCart(@Req() req: AppRequest): Promise<CartItem[]> {
      try {
        const userId = getUserIdFromRequest(req);
          this.logger.debug(`Finding cart for user: ${userId}`);

        const cart = await this.cartService.findOrCreateByUserId(userId);
        this.logger.debug(`Cart found: ${JSON.stringify(cart)}`);
  
        return cart.items;
  
      } catch (error) {
  
        this.logger.error('Error finding cart:', error);
  
        throw new InternalServerErrorException({
  
          message: 'Failed to fetch cart',
  
          error: error.message
  
        });
  
      }
  
    }
  
  
  
    @UseGuards(BasicAuthGuard)
  
    @Put()
  
    async updateUserCart(
  
      @Req() req: AppRequest,
  
      @Body() body: PutCartPayload,
  
    ): Promise<CartItem[]> {
  
      try {
  
        const userId = getUserIdFromRequest(req);
  
        this.logger.debug(`Updating cart for user: ${userId}`);
  
        this.logger.debug('Update payload:', JSON.stringify(body));
  
  
  
        const cart = await this.cartService.updateByUserId(userId, body);
  
        this.logger.debug(`Cart updated: ${JSON.stringify(cart)}`);
  
  
  
        return cart.items;
  
      } catch (error) {
  
        this.logger.error('Error updating cart:', error);
  
        throw new InternalServerErrorException({
  
          message: 'Failed to update cart',
  
          error: error.message,
  
          details: error.stack
  
        });
  
      }
  
    }
  
  
  
    @UseGuards(BasicAuthGuard)
  
    @Delete()
  
    @HttpCode(HttpStatus.OK)
  
    async clearUserCart(@Req() req: AppRequest) {
  
      try {
  
        const userId = getUserIdFromRequest(req);
  
        this.logger.debug(`Clearing cart for user: ${userId}`);
  
        
  
        await this.cartService.removeByUserId(userId);
  
        this.logger.debug('Cart cleared successfully');
  
      } catch (error) {
  
        this.logger.error('Error clearing cart:', error);
  
        throw new InternalServerErrorException({
  
          message: 'Failed to clear cart',
  
          error: error.message
  
        });
  
      }
  
    }

  @UseGuards(BasicAuthGuard)
  @Get('order')
  async getOrder(): Promise<Order[]> {  // Now using the entity Order type
    try {
      this.logger.debug('Fetching all orders');
      const orders = await this.orderService.getAll();
      this.logger.debug(`Found ${orders.length} orders`);
      return orders;
    } catch (error) {
      this.logger.error('Error fetching orders:', error);
      throw new InternalServerErrorException({
        message: 'Failed to fetch orders',
        error: error.message
      });
    }
  }

  @UseGuards(BasicAuthGuard)
  @Put('order')
  async checkout(@Req() req: AppRequest, @Body() body: CreateOrderDto) {
    try {
      const userId = getUserIdFromRequest(req);
      this.logger.debug(`Processing checkout for user: ${userId}`);
      this.logger.debug('Checkout payload:', JSON.stringify(body));

      const cart = await this.cartService.findByUserId(userId);
      this.logger.debug(`Found cart: ${JSON.stringify(cart)}`);

      if (!(cart && cart.items.length)) {
        this.logger.warn(`Cart is empty for user: ${userId}`);
        throw new BadRequestException('Cart is empty');
      }

      const { id: cartId, items } = cart;
      const total = calculateCartTotal(items);
      this.logger.debug(`Calculated total: ${total}`);

      const order = await this.orderService.create({
        userId,
        cartId,
        items: items.map(({ product, count }) => ({
          productId: product.id,
          count,
        })),
        address: body.address,
        total,
      });
      this.logger.debug(`Order created: ${JSON.stringify(order)}`);

      await this.cartService.removeByUserId(userId);
      this.logger.debug('Cart cleared after order creation');

      return { order };
    } catch (error) {
      this.logger.error('Error processing checkout:', error);
      throw new InternalServerErrorException({
        message: 'Failed to process checkout',
        error: error.message
      });
    }
  }
}
