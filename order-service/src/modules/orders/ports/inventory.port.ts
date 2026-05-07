import { OrderItemDto } from '../../../../../shared/contracts/orders/create-order.dto';

export const INVENTORY_PORT = Symbol('INVENTORY_PORT');

export interface InventoryPort {
  decreaseStock(orderItems: OrderItemDto[], accessToken: string): Promise<void>;
}
