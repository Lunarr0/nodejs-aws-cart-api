import { User } from './user.entity';
import { CartItem } from './cart-item.entity';
import { CartStatuses } from '../cart/models';
export declare class Cart {
    id: string;
    user_id: string;
    created_at: Date;
    updated_at: Date;
    status: CartStatuses;
    user: User;
    items: CartItem[];
    getTotal(): number;
}
