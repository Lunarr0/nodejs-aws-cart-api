import { Cart } from './cart.entity';
import { User } from './user.entity';
import { OrderStatuses } from '../order/type';
export declare class Order {
    id: string;
    user_id: string;
    cart_id: string;
    payment: any;
    delivery: {
        address: string;
        firstName: string;
        lastName: string;
        comment: string;
    };
    comments: string;
    status: OrderStatuses;
    total: number;
    status_history: Array<{
        status: OrderStatuses;
        timestamp: number;
        comment: string;
    }>;
    cart: Cart;
    user: User;
}
