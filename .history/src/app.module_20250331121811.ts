import { Module } from '@nestjs/common';

import { AppController } from './app.controller';

import { CartModule } from './cart/cart.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { ConfigModule } from '@nestjs/config';

import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Order } from './entities/order.entity';
import { User } from './entities/user.entity';
import { Products } from './entities/products.entity';
import * as AWS from 'aws-sdk';

@Module({
  imports: [
    AuthModule, 
    CartModule,
     OrderModule, 
     TypeOrmModule.forRootAsync({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT) || 5432,
          username: credentials.username, // Use the username from the secret
          password: credentials.password, // Use the password from the secret
          database: process.env.DB_NAME || 'cartdb',
          entities: [Cart, CartItem, Order, User, Products],
          synchronize: false, // Set to false in production
          ssl: { rejectUnauthorized: false }, // Change to true if using SSL
     ],
  controllers: [AppController],
  providers: [],
})

export class AppModule {}
