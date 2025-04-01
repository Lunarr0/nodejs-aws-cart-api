import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Cart } from './cart.entity';
import { Order } from './order.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string; // Unique identifier for the user

    @Column()
    name: string; // User's name

    @Column({ unique: true })
    email: string; // User's email address

    @CreateDateColumn()
    created_at: Date; // Date when the user was created

    @OneToMany(() => Cart, (cart) => cart.user) // Link to the carts associated with this user
    carts: Cart[];

    @OneToMany(() => Order, (order) => order.user) // Link to the orders associated with this user
    orders: Order[];
}
