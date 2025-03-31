import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('products')
export class Products {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column({ type: 'decimal' })
    price: number;

    @Column()
    image: string;

    @Column({ default: true })
    available: boolean;
}
