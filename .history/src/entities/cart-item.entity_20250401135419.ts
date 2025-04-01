import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from './products.entity';

@Entity('cart_items')
export class CartItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Cart, (cart) => cart.cartItems, { onDelete: 'CASCADE', nullable: true }) // Set nullable to true
    cart: Cart;

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    product: Products;

    @Column({ type: 'int' })
    count: number;
}
