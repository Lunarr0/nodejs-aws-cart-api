import { Address, OrderStatuses } from '../type';

export type Order = {
  id?: string;
  userId: string;
  items: Array<{ productId: string; count: number }>;
  cartId: string;
  address: Address;
  statusHistory: Array<{
    status: OrderStatuses.ORDERED;
    timestamp: number;
    comment: string;
  }>;
};
