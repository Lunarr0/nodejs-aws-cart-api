import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cart } from './cart.entity';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    user_id: string; // Make sure this is handled properly in your application logic

    @ManyToOne(() => Cart, { nullable: true })
    cart: Cart; // Make this nullable if the relationship can be optional

    @Column({ type: 'json', nullable: true })
    payment: object;

    @Column({ type: 'json', nullable: true })
    delivery: object;

    @Column({ type: 'text', nullable: true })
    comments: string;

    @Column({ type: 'text', default: 'ORDERED' })
    status: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total: number;
}
