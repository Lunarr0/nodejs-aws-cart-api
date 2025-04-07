import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsNotEmpty, Min } from 'class-validator';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @IsNotEmpty()
    title: string;

    @Column()
    @IsNotEmpty()
    description: string;

    @Column({ 
        type: 'decimal', 
        precision: 10, 
        scale: 2 
    })
    @Min(0)
    price: number;
}
