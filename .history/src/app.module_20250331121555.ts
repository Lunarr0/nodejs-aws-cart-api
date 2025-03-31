import { Module } from '@nestjs/common';

import { AppController } from './app.controller';

import { CartModule } from './cart/cart.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AuthModule, 
    CartModule,
     OrderModule, 
     TypeOrmModule.forRootAsync({
      useFactory: async () => {
        const credentials = await getDatabaseCredentials(); // Fetch credentials from Secrets Manager

        return {
          type: 'postgres',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT) || 5432,
          username: credentials.username, // Use the username from the secret
          password: credentials.password, // Use the password from the secret
          database: process.env.DB_NAME || 'cartdb',
          entities: [Cart, CartItem, Order, User, Products],
          synchronize: false, // Set to false in production
          ssl: { rejectUnauthorized: false }, // Change to true if using SSL
        };
      },
    }),
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
