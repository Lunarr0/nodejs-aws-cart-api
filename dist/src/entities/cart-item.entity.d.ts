import { Cart } from './cart.entity';
import { Product } from './products.entity';
export declare class CartItem {
    cart_id: string;
    product_id: string;
    count: number;
    cart: Cart;
    product: Product;
}
