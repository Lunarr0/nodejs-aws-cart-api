import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string; // Unique identifier for the product

    @Column()
    title: string; // Product title

    @Column()
    description: string; // Product description

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number; // Product price

    @Column()
    image: string; // URL of the product image

    @Column({ default: true })
    available: boolean; // Availability status of the product
}
