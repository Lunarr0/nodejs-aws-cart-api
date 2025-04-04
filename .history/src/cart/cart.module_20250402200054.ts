// src/cart/cart.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Order } from '../order/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem, Order]), // Make sure Cart entity is included
  ],
  providers: [
    CartService,
    {
      provide: 'CartRepository',
      useFactory: (dataSource: DataSource) => dataSource.getRepository(Cart),
      inject: [DataSource],
    },
    {
      provide: 'CartItemRepository',
      useFactory: (dataSource: DataSource) => dataSource.getRepository(CartItem),
      inject: [DataSource],
    },
    {
      provide: 'OrderRepository',
      useFactory: (dataSource: DataSource) => dataSource.getRepository(Order),
      inject: [DataSource],
    },
  ],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
