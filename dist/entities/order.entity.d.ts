import { Cart } from './cart.entity';
import { User } from './user.entity';
export declare class Order {
    id: string;
    user: User;
    cart: Cart;
    payment: object;
    delivery: object;
    comments: string;
    status: string;
    total: number;
}
