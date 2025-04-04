import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Index } from 'typeorm';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { Cart } from './cart.entity';
import { Order } from './order.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @IsNotEmpty()
    @MinLength(2)
    name: string;

    @Column({ unique: true })
    @Index()  // Add index for email lookups
    @IsEmail()
    email: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @OneToMany(() => Cart, (cart) => cart.user_id, { 
        lazy: true,  // Load carts only when needed
        cascade: ['update'] 
    })
    carts: Promise<Cart[]>; // Make it a Promise for lazy loading

    @OneToMany(() => Order, (order) => order.user, { 
        lazy: true,  // Load orders only when needed
        cascade: ['update']
    })
    orders: Promise<Order[]>; // Make it a Promise for lazy loading

    
}
