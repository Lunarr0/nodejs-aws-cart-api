import { Repository, DataSource } from 'typeorm';
import { Cart, CartItem, Order } from '../../entities';
import { PutCartPayload } from 'src/order/type';
export declare class CartService {
    private cartRepository;
    private cartItemRepository;
    private orderRepository;
    private dataSource;
    private readonly logger;
    constructor(cartRepository: Repository<Cart>, cartItemRepository: Repository<CartItem>, orderRepository: Repository<Order>, dataSource: DataSource);
    findByUserId(userId: string): Promise<Cart>;
    createByUserId(userId: string): Promise<Cart>;
    findOrCreateByUserId(userId: string): Promise<Cart>;
    updateByUserId(userId: string, payload: PutCartPayload): Promise<Cart>;
}
