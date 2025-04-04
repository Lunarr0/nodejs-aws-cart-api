import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from './products.entity';

@Entity('cart_items')
export class CartItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Cart, (cart) => cart.cartItems, { onDelete: 'CASCADE' })
    cart: Cart; // Link to the Cart entity

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    product: Product; // Link to the Product entity

    @Column({ type: 'int' })
    count: number; // Number of items in a cart
}
