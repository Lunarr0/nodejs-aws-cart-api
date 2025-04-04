import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './services';
import { Order, Cart, CartItem } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,  // Register Order entity
      Cart,   // Register Cart entity since OrderService needs it
      CartItem
    ]),
  ],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
