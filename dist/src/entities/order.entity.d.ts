import { Cart } from './cart.entity';
export declare class Order {
    id: string;
    user_id: string;
    cart: Cart;
    payment: object;
    delivery: object;
    comments: string;
    status: string;
    total: number;
}
