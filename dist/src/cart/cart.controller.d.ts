import { OrderService } from '../order/services';
import { Order } from '../entities/order.entity';
import { AppRequest } from '../shared';
import { CartService } from './services';
import { CartItem } from './models';
import { CreateOrderDto, PutCartPayload } from 'src/order/type';
export declare class CartController {
    private cartService;
    private orderService;
    private readonly logger;
    constructor(cartService: CartService, orderService: OrderService);
    findUserCart(req: AppRequest): Promise<CartItem[]>;
    updateUserCart(req: AppRequest, body: PutCartPayload): Promise<CartItem[]>;
    clearUserCart(req: AppRequest): Promise<void>;
    getOrder(): Promise<Order[]>;
    checkout(req: AppRequest, body: CreateOrderDto): Promise<{
        order: Order;
        message: string;
    }>;
    private isValidAddress;
    private calculateCartTotal;
}
