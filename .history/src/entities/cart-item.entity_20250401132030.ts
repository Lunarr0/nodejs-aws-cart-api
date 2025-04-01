import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from './product.entity';

@Entity('cart_items')
export class CartItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Cart, (cart) => cart.cartItems, { onDelete: 'CASCADE' })
    cart: Cart;

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    product: Product;

    @Column({ type: 'int' })
    count: number;
}
