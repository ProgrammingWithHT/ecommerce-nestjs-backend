import { Controller, UseGuards } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { Roles } from '../../../../shared/auth/roles.decorator';
import { RpcAuthGuard } from '../../../../shared/auth/rpc-auth.guard';
import { RpcRequest } from '../../../../shared/auth/rpc-request.interface';
import { UserRole } from '../../../../shared/auth/user-role.enum';
import { CreateProductCommandDto } from '../../../../shared/contracts/products/create-product-command.dto';
import { CreateProductReviewDto } from '../../../../shared/contracts/products/create-product-review.dto';
import { DecreaseStockDto, StockAdjustmentItemDto } from '../../../../shared/contracts/products/decrease-stock.dto';
import { DeleteReviewDto } from '../../../../shared/contracts/products/delete-review.dto';
import { ProductIdDto } from '../../../../shared/contracts/products/product-id.dto';
import { ProductReviewsQueryDto } from '../../../../shared/contracts/products/product-reviews-query.dto';
import { UpdateProductCommandDto } from '../../../../shared/contracts/products/update-product-command.dto';
import { MESSAGE_PATTERNS } from '../../../../shared/microservices/message-patterns';
import { ProductsService } from './products.service';
import { IncreaseStockDto } from '../../../../shared/contracts/products/increase-stock.dto';

@Controller()
export class ProductsMessageController {
  constructor(private readonly productsService: ProductsService) { }

  @MessagePattern(MESSAGE_PATTERNS.products.findAll)
  findAll() {
    return this.productsService.getAllProducts();
  }

  @MessagePattern(MESSAGE_PATTERNS.products.findAdmin)
  @UseGuards(RpcAuthGuard)
  @Roles(UserRole.Admin)
  findAdmin() {
    return this.productsService.getAdminProducts();
  }

  @MessagePattern(MESSAGE_PATTERNS.products.findOne)
  findOne(@Payload('data') productIdDto: ProductIdDto) {
    return this.productsService.getProductDetails(productIdDto.productId);
  }

  @MessagePattern(MESSAGE_PATTERNS.products.create)
  @UseGuards(RpcAuthGuard)
  @Roles(UserRole.Admin)
  create(
    @Payload('data') data: CreateProductCommandDto,
    @Payload() payload: RpcRequest<CreateProductCommandDto>,
  ) {
    return this.productsService.createProduct(
      data.product,
      data.files ?? [],
      payload.authUser!.id,
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.products.update)
  @UseGuards(RpcAuthGuard)
  @Roles(UserRole.Admin)
  update(@Payload('data') data: UpdateProductCommandDto) {
    return this.productsService.updateProduct(
      data.productId,
      data.update,
      data.files ?? [],
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.products.delete)
  @UseGuards(RpcAuthGuard)
  @Roles(UserRole.Admin)
  delete(@Payload('data') productIdDto: ProductIdDto) {
    return this.productsService.deleteProduct(productIdDto.productId);
  }

  @MessagePattern(MESSAGE_PATTERNS.products.createReview)
  @UseGuards(RpcAuthGuard)
  createReview(
    @Payload('data') createProductReviewDto: CreateProductReviewDto,
    @Payload() payload: RpcRequest<CreateProductReviewDto>,
  ) {
    return this.productsService.createProductReview(createProductReviewDto, {
      id: payload.authUser!.id,
      name: payload.authUser!.name,
    });
  }

  @MessagePattern(MESSAGE_PATTERNS.products.findReviews)
  findReviews(@Payload('data') query: ProductReviewsQueryDto) {
    return this.productsService.getProductReviews(query.productId);
  }

  @MessagePattern(MESSAGE_PATTERNS.products.deleteReview)
  @UseGuards(RpcAuthGuard)
  deleteReview(@Payload('data') deleteReviewDto: DeleteReviewDto) {
    return this.productsService.deleteReview(deleteReviewDto);
  }

  // @MessagePattern(MESSAGE_PATTERNS.products.decreaseStock)
  // @UseGuards(RpcAuthGuard)
  // decreaseStock(@Payload('data') decreaseStockDto: DecreaseStockDto) {
  //   return this.productsService.decreaseStock(decreaseStockDto);
  // }

  @EventPattern(MESSAGE_PATTERNS.orders.created)
  handleOrderCreated(
    @Payload() data: DecreaseStockDto,
  ) {
    console.log('calling decrease stock order created')
    return this.productsService.handleOrderCreated(data);
  }

  @EventPattern(MESSAGE_PATTERNS.orders.cancelled)
  handleOrderCancelled(@Payload() data: IncreaseStockDto) {
    console.log('order cancelled starting')
    return this.productsService.handleOrderCancelled(data);
  }
}
