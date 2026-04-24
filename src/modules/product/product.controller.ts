import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { DeleteReviewDto } from './dto/delete-review.dto';
import { ProductIdParamDto } from './dto/product-id-param.dto';
import { ProductReviewsQueryDto } from './dto/product-reviews-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('products')
  getAllProducts() {
    return this.productService.getAllProducts();
  }

  @Post('admin/products/new')
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  createProduct(
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Body() createProductDto: CreateProductDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productService.createProduct(createProductDto, files, userId);
  }

  @Put('admin/product/:id')
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  updateProduct(
    @Param() params: ProductIdParamDto,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return this.productService.updateProduct(params.id, updateProductDto, files);
  }

  @Delete('admin/product/:id')
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  deleteProduct(@Param() params: ProductIdParamDto) {
    return this.productService.deleteProduct(params.id);
  }

  @Get('admin/products')
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getAdminProducts() {
    return this.productService.getAdminProducts();
  }

  @Get('product/:id')
  getProductDetails(@Param() params: ProductIdParamDto) {
    return this.productService.getProductDetails(params.id);
  }

  @Put('review')
  @UseGuards(JwtAuthGuard)
  createProductReview(
    @Body() createProductReviewDto: CreateProductReviewDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('name') userName: string,
  ) {
    return this.productService.createProductReview(createProductReviewDto, {
      id: userId,
      name: userName,
    });
  }

  @Get('reviews')
  getProductReviews(@Query() query: ProductReviewsQueryDto) {
    return this.productService.getProductReviews(query.productId);
  }

  @Delete('reviews')
  @UseGuards(JwtAuthGuard)
  deleteReview(@Query() deleteReviewDto: DeleteReviewDto) {
    return this.productService.deleteReview(deleteReviewDto);
  }
}
