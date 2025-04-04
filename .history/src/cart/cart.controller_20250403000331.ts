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
import { Order, OrderService } from '../order';
import { AppRequest, getUserIdFromRequest } from '../shared';
import { calculateCartTotal } from './models-rules';
import { CartService } from './services';
import { CartItem } from './models';
import { CreateOrderDto, PutCartPayload } from 'src/order/type';

@Controller('api/profile/cart')
@UseGuards(BasicAuthGuard)
export class CartController {
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
  ) {}

 @UseGuards(BasicAuthGuard)
  @Get()
  async findUserCart(@Req() req: AppRequest): Promise<CartItem[]> {
    try {
      this.logger.debug('Request user:', req.user);
      const userId = getUserIdFromRequest(req);
      this.logger.debug(`Finding cart for user: ${userId}`);
      
      const cart = await this.cartService.findOrCreateByUserId(userId);
      this.logger.debug('Cart found:', cart);
      
      return cart.items;
    } catch (error) {
      this.logger.error('Error in findUserCart:', error);
      throw new InternalServerErrorException({
        message: 'Failed to fetch cart',
        error: error.message
      });
    }
  }
  }

  @UseGuards(BasicAuthGuard)
  @Put()
  async updateUserCart(
    @Req() req: AppRequest,
    @Body() body: PutCartPayload,
  ): Promise<CartItem[]> {
    const cart = await this.cartService.updateByUserId(
      getUserIdFromRequest(req),
      body,
    );
    return cart.items;
  }

  @UseGuards(BasicAuthGuard)
  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearUserCart(@Req() req: AppRequest) {
    await this.cartService.removeByUserId(getUserIdFromRequest(req));
  }

  @UseGuards(BasicAuthGuard)
  @Put('order')
  async checkout(@Req() req: AppRequest, @Body() body: CreateOrderDto) {
    const userId = getUserIdFromRequest(req);
    const cart = await this.cartService.findByUserId(userId);

    if (!(cart && cart.items.length)) {
      throw new BadRequestException('Cart is empty');
    }

    const { id: cartId, items } = cart;
    const total = calculateCartTotal(items);
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

    await this.cartService.removeByUserId(userId);

    return {
      order,
    };
  }

  @UseGuards(BasicAuthGuard)
  @Get('order')
  async getOrder(): Promise<Order[]> {
    return this.orderService.getAll();
  }
}
