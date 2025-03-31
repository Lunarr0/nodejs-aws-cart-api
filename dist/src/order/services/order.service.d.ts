import { Order } from '../models';
import { CreateOrderPayload } from '../type';
export declare class OrderService {
    private orders;
    getAll(): Order[];
    findById(orderId: string): Order;
    create(data: CreateOrderPayload): Order;
    update(orderId: string, data: Order): void;
}
