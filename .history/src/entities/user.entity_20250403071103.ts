@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @IsNotEmpty()
    @MinLength(2)
    name: string;

    @Column({ unique: true })
    @Index()
    @IsEmail()
    email: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @OneToMany(() => Cart, (cart) => cart.user, { 
        lazy: true,
        cascade: ['update'] 
    })
    carts: Promise<Cart[]>;

    @OneToMany(() => Order, (order) => order.user, { 
        lazy: true,
        cascade: ['update']
    })
    orders: Promise<Order[]>;
}