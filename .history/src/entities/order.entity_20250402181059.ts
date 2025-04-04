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

    @ManyToOne(() => User, (user) => user.orders, { 
        nullable: false 
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Cart, { 
        nullable: false 
    })
    @JoinColumn({ name: 'cart_id' })
    cart: Cart;

    @Column({ 
        type: 'json', 
        nullable: true 
    })
    @IsOptional()
    @IsObject()
    payment: {
        method: string;
        status: string;
        transactionId?: string;
        amount: number;
    };

    @Column({ 
        type: 'json', 
        nullable: true 
    })
    @IsOptional()
    @IsObject()
    delivery: {
        address: string;
        city: string;
        country: string;
        postalCode: string;
        contactNumber: string;
    };

    @Column({ 
        type: 'text', 
        nullable: true 
    })
    @IsOptional()
    comments: string;

    @Column({ 
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.ORDERED 
    })
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @Column({ 
        type: 'decimal', 
        precision: 10, 
        scale: 2 
    })
    @IsNumber()
    @Min(0)
    total: number;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    // Helper methods
    isProcessing(): boolean {
        return this.status === OrderStatus.PROCESSING;
    }

    canBeCancelled(): boolean {
        return [OrderStatus.ORDERED, OrderStatus.PAID].includes(this.status);
    }

    isPaid(): boolean {
        return this.status !== OrderStatus.ORDERED;
    }

    getFormattedTotal(): string {
        return `$${this.total.toFixed(2)}`;
    }

    getDeliveryAddress(): string {
        if (!this.delivery) return '';
        const { address, city, country, postalCode } = this.delivery;
        return `${address}, ${city}, ${country} ${postalCode}`;
    }
}
