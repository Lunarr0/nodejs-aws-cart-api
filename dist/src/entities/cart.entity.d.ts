import { CartItem } from './cart-item.entity';
export declare class Cart {
    id: string;
    user_id: string;
    created_at: Date;
    updated_at: Date;
    status: 'OPEN' | 'ORDERED';
    cartItems: CartItem[];
}
