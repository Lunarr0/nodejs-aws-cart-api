import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cart } from './cart.entity';
import { User } from './user.entity';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.orders, { nullable: false }) // Linking to User
    user: User; // Link to the User entity

    @ManyToOne(() => Cart, { nullable: false })
    cart: Cart; // Link to the Cart entity

    @Column({ type: 'json', nullable: true })
    payment: object; // Payment details in JSON format

    @Column({ type: 'json', nullable: true })
    delivery: object; // Delivery details in JSON format

    @Column({ type: 'text', nullable: true })
    comments: string; // Any comments from the user

    @Column({ type: 'text', default: 'ORDERED' })
    status: string; // Status of the order

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total: number; // Total amount for the order
}
