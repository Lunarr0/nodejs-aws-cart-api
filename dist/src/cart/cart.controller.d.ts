import { Order, OrderService } from '../order';
import { AppRequest } from '../shared';
import { CartService } from './services';
import { CartItem } from './models';
import { CreateOrderDto, PutCartPayload } from 'src/order/type';
export declare class CartController {
    private cartService;
    private orderService;
    constructor(cartService: CartService, orderService: OrderService);
    findUserCart(req: AppRequest): CartItem[];
    updateUserCart(req: AppRequest, body: PutCartPayload): CartItem[];
    clearUserCart(req: AppRequest): void;
    checkout(req: AppRequest, body: CreateOrderDto): {
        order: Order;
    };
    getOrder(): Order[];
}
