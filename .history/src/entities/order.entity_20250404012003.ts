import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { IsNumber, Min, IsEnum, IsObject, IsOptional } from 'class-validator';
import { Cart } from './cart.entity';
import { User } from './user.entity';
import { OrderStatuses } from '../order/type';

// export enum OrderStatus {
//     ORDERED = 'ORDERED',
//     PAID = 'PAID',
//     PROCESSING = 'PROCESSING',
//     SHIPPED = 'SHIPPED',
//     DELIVERED = 'DELIVERED',
//     CANCELLED = 'CANCELLED'
// }

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ type: 'uuid' })
    cart_id: string;

    @Column({ type: 'json' })
    payment: any;

    @Column({ type: 'json' })
    addr: {
        address: string;
        firstName: string;
        lastName: string;
        comment: string;
    };

    @Column({ type: 'text', nullable: true })
    comments: string;

    @Column({
        type: 'enum',
        enum: OrderStatuses,
        default: OrderStatuses.OPEN
    })
    status: OrderStatuses;

    @Column('decimal', { precision: 10, scale: 2 })
    total: number;

    @Column({ type: 'json' })
    status_history: Array<{
        status: OrderStatuses;
        timestamp: number;
        comment: string;
    }>;

    @ManyToOne(() => Cart)
    @JoinColumn({ name: 'cart_id' })
    cart: Cart;


    @ManyToOne(() => User, (user) => user.orders)
    @JoinColumn({ name: 'user_id' })
    user: User;
}



