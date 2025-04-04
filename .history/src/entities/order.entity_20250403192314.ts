import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { IsNumber, Min, IsEnum, IsObject, IsOptional } from 'class-validator';
import { Cart } from './cart.entity';
import { User } from './user.entity';

export enum OrderStatus {
    ORDERED = 'ORDERED',
    PAID = 'PAID',
    PROCESSING = 'PROCESSING',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED'
}

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
    delivery: {
        address: string;
        firstName: string;
        lastName: string;
        comment: string;
    };

    @Column({ type: 'text', nullable: true })
    comments: string;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.ORDERED
    })
    status: OrderStatus;

    @Column('decimal', { precision: 10, scale: 2 })
    total: number;

    @Column({ type: 'json' })
    status_history: Array<{
        status: OrderStatus;
        timestamp: number;
        comment: string;
    }>;

    @ManyToOne(() => Cart)
    @JoinColumn({ name: 'cart_id' })
    cart: Cart;
}



