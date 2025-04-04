import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, Cart } from '../../entities';
import { CreateOrderPayload, OrderStatuses } from '../type';
import { CartStatuses } from '../../cart/models';

1 Create the following tables:
Cart model
carts:
id - uuid (Primary key)
user_id - uuid, not null (It's not Foreign key, because there is no user entity in DB)
created_at - date, not null
updated_at - date, not null
status - enum ("OPEN", "ORDERED")

Cart item model
cart_items:
cart_id - uuid (Foreign key from carts.id)
product_id - uuid
count - integer (Number of items in a cart)

Create orders table and integrated with it Order model:

orders:
id - uuid
user_id - uuid
cart_id - uuid (Foreign key from carts.id)
payment - JSON
delivery - JSON
comments - text
status - ENUM or text
total - number

Set status to 'ORDERED' after checkout instead of cart deletion.
• (All languages) - Create users table and integrate with it
• (All languages) - Transaction based creation of checkout

What will the response (json) of a put request be taking into consideration, these requirements

fix order service