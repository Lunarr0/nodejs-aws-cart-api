import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { IsNumber, Min, IsEnum, IsObject, IsOptional } from 'class-validator';
import { Cart } from './cart.entity';
import { User } from './user.entity';

export enum OrderStatus {
    ORDERED = 'ORDERED',
    PAID = 'PAID',
    PROCESSING = 'PROCESSING',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED'
}


