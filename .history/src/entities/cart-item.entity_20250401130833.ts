import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cart } from './cart.entity';
import { Products } from './products.entity';

@Entity('cart_items')
export class CartItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Cart, (cart) => cart.cartItems, { onDelete: 'CASCADE', nullable: true })
    cart: Cart;

    @ManyToOne(() => Products, { onDelete: 'CASCADE' })
    product: Products;

    @Column({ type: 'int' })
    count: number;
}
