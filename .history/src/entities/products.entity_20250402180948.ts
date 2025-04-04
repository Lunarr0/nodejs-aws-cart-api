import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { IsNotEmpty, Min, IsUrl, IsBoolean } from 'class-validator';
import { CartItem } from './cart-item.entity';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @IsNotEmpty()
    title: string;

    @Column()
    @IsNotEmpty()
    description: string;

    @Column({ 
        type: 'decimal', 
        precision: 10, 
        scale: 2 
    })
    @Min(0)
    price: number;

    @Column()
    @IsUrl()
    image: string;

    @Column({ default: true })
    @IsBoolean()
    available: boolean;

    @OneToMany(() => CartItem, cartItem => cartItem.product)
    cartItems: CartItem[];

    // Helper methods
    isAvailable(): boolean {
        return this.available;
    }

    getFormattedPrice(): string {
        return `$${this.price.toFixed(2)}`;
    }
}
