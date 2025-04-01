import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cart } from './cart.entity';
import { User } from './user.entity';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Cart, { nullable: false, onDelete: 'CASCADE' })
    cart: Cart;

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
