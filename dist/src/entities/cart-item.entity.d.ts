import { Cart } from './cart.entity';
import { Products } from './products.entity';
export declare class CartItem {
    id: string;
    cart: Cart;
    product: Products;
    count: number;
}
