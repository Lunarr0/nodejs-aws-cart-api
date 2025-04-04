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

    // Helper methods
    async getActiveCart(): Promise<Cart | undefined> {
        const carts = await this.carts;
        return carts.find(cart => cart.status === 'OPEN');
    }

    async getOrderHistory(): Promise<Order[]> {
        const orders = await this.orders;
        return orders.sort((a, b) => 
            b.created_at.getTime() - a.created_at.getTime()
        );
    }
}
