import { Repository, DataSource } from 'typeorm';
import { Order, Cart } from '../../entities';
import { CreateOrderPayload, OrderStatuses } from '../type';
export declare class OrderService {
    private orderRepository;
    private cartRepository;
    private dataSource;
    private readonly logger;
    constructor(orderRepository: Repository<Order>, cartRepository: Repository<Cart>, dataSource: DataSource);
    create(orderPayload: CreateOrderPayload): Promise<Order>;
    findById(orderId: string): Promise<Order>;
    getAll(): Promise<Order[]>;
    private isValidStatusTransition;
    updateOrderStatus(orderId: string, status: OrderStatuses, comment: string): Promise<Order>;
    findByUserId(userId: string): Promise<Order[]>;
    findOrdersByUserId(userId: string): Promise<Order[]>;
}
