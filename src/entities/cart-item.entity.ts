import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from './products.entity';
import { Min } from 'class-validator';

@Entity('cart_items')
export class CartItem {
    @Column({ type: 'uuid', primary: true })
    cart_id: string;

    @Column({ type: 'uuid', primary: true })
    product_id: string;

    @Column('integer')
    @Min(1)
    count: number;

    @ManyToOne(() => Cart, (cart) => cart.items, { 
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'cart_id' })
    cart: Cart;

    @ManyToOne(() => Product, { 
        eager: true
    })
    @JoinColumn({ name: 'product_id' })
    product: Product;
}