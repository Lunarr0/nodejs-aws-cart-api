import { Cart } from './cart.entity';
import { Product } from './products.entity';
export declare class CartItem {
    id: string;
    cart: Cart;
    product: Product;
    count: number;
}
