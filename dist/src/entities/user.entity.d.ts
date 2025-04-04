import { Cart } from './cart.entity';
import { Order } from './order.entity';
export declare class User {
    id: string;
    name: string;
    email: string;
    created_at: Date;
    carts: Promise<Cart[]>;
    orders: Promise<Order[]>;
}
