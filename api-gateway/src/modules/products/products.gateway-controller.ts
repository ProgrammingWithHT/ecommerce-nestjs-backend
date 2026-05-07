import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateProductCommandDto } from '../../../../shared/contracts/products/create-product-command.dto';
import { CreateProductReviewDto } from '../../../../shared/contracts/products/create-product-review.dto';
import { CreateProductDto } from '../../../../shared/contracts/products/create-product.dto';
import { DeleteReviewDto } from '../../../../shared/contracts/products/delete-review.dto';
import { ProductReviewsQueryDto } from '../../../../shared/contracts/products/product-reviews-query.dto';
import { UpdateProductCommandDto } from '../../../../shared/contracts/products/update-product-command.dto';
import { UpdateProductDto } from '../../../../shared/contracts/products/update-product.dto';
import { RpcClientService } from '../../../../shared/gateway/rpc-client.service';
import { MESSAGE_PATTERNS } from '../../../../shared/microservices/message-patterns';
import { PRODUCT_SERVICE_CLIENT } from '../../../../shared/microservices/service-tokens';
import { serializeUploadedFiles } from '../../common/file-upload.util';

@Controller('product')
export class ProductsGatewayController {
  constructor(
    @Inject(PRODUCT_SERVICE_CLIENT)
    private readonly productServiceClient: ClientProxy,
    private readonly rpcClientService: RpcClientService,
  ) {}

  @Get('products')
  findAll() {
    return this.rpcClientService.send(
      this.productServiceClient,
      MESSAGE_PATTERNS.products.findAll,
      { data: {} },
    );
  }

  @Put('review')
  createReview(
    @Body() createProductReviewDto: CreateProductReviewDto,
    @Headers('authorization') accessToken?: string,
  ) {
    return this.rpcClientService.send(
      this.productServiceClient,
      MESSAGE_PATTERNS.products.createReview,
      {
        data: createProductReviewDto,
        accessToken,
      },
    );
  }

  @Delete('reviews')
  deleteReview(
    @Query() deleteReviewDto: DeleteReviewDto,
    @Headers('authorization') accessToken?: string,
  ) {
    return this.rpcClientService.send(
      this.productServiceClient,
      MESSAGE_PATTERNS.products.deleteReview,
      {
        data: deleteReviewDto,
        accessToken,
      },
    );
  }

  @Get('reviews')
  findReviews(@Query() query: ProductReviewsQueryDto) {
    return this.rpcClientService.send(
      this.productServiceClient,
      MESSAGE_PATTERNS.products.findReviews,
      { data: query },
    );
  }

  @Get('admin/products')
  findAdminProducts(@Headers('authorization') accessToken?: string) {
    return this.rpcClientService.send(
      this.productServiceClient,
      MESSAGE_PATTERNS.products.findAdmin,
      {
        data: {},
        accessToken,
      },
    );
  }

  @Get('product/:id')
  findOne(@Param('id') productId: string) {
    return this.rpcClientService.send(
      this.productServiceClient,
      MESSAGE_PATTERNS.products.findOne,
      { data: { productId } },
    );
  }

  @Put('admin/product/:id')
  @UseInterceptors(FilesInterceptor('images', 5))
  updateProduct(
    @Param('id') productId: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles()
    files: Array<{ buffer?: Buffer; mimetype?: string; originalname?: string; size?: number }> = [],
    @Headers('authorization') accessToken?: string,
  ) {
    return this.rpcClientService.send(
      this.productServiceClient,
      MESSAGE_PATTERNS.products.update,
      {
        data: {
          productId,
          update: updateProductDto,
          files: serializeUploadedFiles(files),
        } satisfies UpdateProductCommandDto,
        accessToken,
      },
    );
  }

  @Delete('admin/product/:id')
  deleteProduct(
    @Param('id') productId: string,
    @Headers('authorization') accessToken?: string,
  ) {
    return this.rpcClientService.send(
      this.productServiceClient,
      MESSAGE_PATTERNS.products.delete,
      {
        data: { productId },
        accessToken,
      },
    );
  }

  @UseInterceptors(FilesInterceptor('images', 5))
  @Post('admin/products/new')
  createProduct(
    @UploadedFiles()
    files: Array<{ buffer?: Buffer; mimetype?: string; originalname?: string; size?: number }> = [],
    @Body() createProductDto: CreateProductDto,
    @Headers('authorization') accessToken?: string,
  ) {
    return this.rpcClientService.send(
      this.productServiceClient,
      MESSAGE_PATTERNS.products.create,
      {
        data: {
          product: createProductDto,
          files: serializeUploadedFiles(files),
        } satisfies CreateProductCommandDto,
        accessToken,
      },
    );
  }
}
