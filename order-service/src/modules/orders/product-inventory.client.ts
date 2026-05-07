import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { OrderItemDto } from '../../../../shared/contracts/orders/create-order.dto';
import { MESSAGE_PATTERNS } from '../../../../shared/microservices/message-patterns';
import { PRODUCT_SERVICE_CLIENT } from '../../../../shared/microservices/service-tokens';
import { InventoryPort } from './ports/inventory.port';

@Injectable()
export class ProductInventoryClient implements InventoryPort {
  constructor(
    @Inject(PRODUCT_SERVICE_CLIENT)
    private readonly productServiceClient: ClientProxy,
  ) {}

  async decreaseStock(orderItems: OrderItemDto[], accessToken: string) {
    await firstValueFrom(
      this.productServiceClient.send(
        MESSAGE_PATTERNS.products.decreaseStock,
        {
          data: {
            items: orderItems.map((item) => ({
              productId: item.product,
              quantity: item.quantity,
            })),
          },
          accessToken,
        },
      ),
    );
  }
}
