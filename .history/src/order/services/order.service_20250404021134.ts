import { Injectable, NotFoundException, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, Cart, CartItem } from '../../entities';
import { CreateOrderPayload, OrderStatuses } from '../type';
import { CartStatuses } from '../../cart/models';
import { CartService } from '@/cart';

