import {
  Controller,
  Get,
  Delete,
  Put,
  Body,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';

import { BasicAuthGuard } from '../auth';
import { OrderService } from '../order/services';
import { Order } from '../entities/order.entity';  // Update this import to use the entity
import { AppRequest, getUserIdFromRequest } from '../shared';
import { calculateCartTotal } from './models-rules';
import { CartService } from './services';
import { CartItem } from './models';
import { CreateOrderDto, PutCartPayload } from 'src/order/type';

