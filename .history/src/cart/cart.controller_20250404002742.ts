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
import { CreateOrderDto, PutCartPayload , CreateOrderPayload} from 'src/order/type';

@Controller('api/profile/cart')
@UseGuards(BasicAuthGuard)
export class CartController {
  private readonly logger = new Logger(CartController.name);
  
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
  ) {}

  @Put('order')
  async checkout(@Req() req: AppRequest, @Body() orderDto: CreateOrderDto) {
    try {
      const userId = getUserIdFromRequest(req);
      this.logger.debug(`Starting checkout process for user: ${userId}`);
      this.logger.debug('Checkout payload:', JSON.stringify(orderDto));

      // Find active cart with items
      const cart = await this.cartService.findByUserId(userId);
      
      if (!cart) {
        this.logger.warn(`No active cart found for user ${userId}`);
        throw new BadRequestException('No active cart found');
      }

      this.logger.debug('Found cart:', JSON.stringify(cart));

      if (!cart.items || cart.items.length === 0) {
        this.logger.warn(`Cart ${cart.id} is empty`);
        throw new BadRequestException('Cart is empty');
      }

      // Calculate total from cart items
      const total = cart.items.reduce((sum, item) => 
        sum + (Number(item.product.price) * item.count), 0
      );
      this.logger.debug(`Calculated total: ${total}`);

      // Prepare order payload
      const orderPayload: CreateOrderPayload = {
        userId,
        cartId: cart.id,
        items: cart.items.map(item => ({
          productId: item.product_id,
          count: item.count
        })),
        address: orderDto.address,
        total
      };

      // Create order
      const order = await this.orderService.create(orderPayload);
      this.logger.debug(`Order created successfully: ${order.id}`);

      return order;

    } catch (error) {
      this.logger.error('Checkout failed:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Failed to process checkout',
        error: error.message
      });
    }
  }
}
