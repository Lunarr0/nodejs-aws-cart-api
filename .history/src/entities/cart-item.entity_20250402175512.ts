import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from './products.entity';

@Entity('cart_items')
export class CartItem {
    @PrimaryGeneratedColumn('uuid')
    cart_id: string;

    @PrimaryColumn('uuid')
    product_id: string;

    @Column()
    @Min(0)
    count: number;

    @ManyToOne(() => Cart, cart => cart.items)
    @Column({ name: 'cart_id' })
    cart: Cart;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;
}

