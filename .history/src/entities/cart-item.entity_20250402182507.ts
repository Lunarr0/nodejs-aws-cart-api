import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from './product.entity';
import { Min } from 'class-validator';

@Entity('cart_items')
export class CartItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    cart_id: string;

    @Column({ type: 'uuid' })
    product_id: string;

    @ManyToOne(() => Cart, (cart) => cart.items, { 
        onDelete: 'CASCADE',
        nullable: false 
    })
    @JoinColumn({ name: 'cart_id' })
    cart: Cart;

    @ManyToOne(() => Product, { 
        onDelete: 'CASCADE',
        nullable: false,
        eager: true // This will automatically load the product details
    })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ type: 'int' })
    @Min(1)
    count: number;

    // Helper method to get item total
    getTotal(): number {
        return this.count * this.product.price;
    }
}
