import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from '../../../../shared/contracts/products/create-product.dto';
import { UpdateProductDto } from '../../../../shared/contracts/products/update-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';

type ProductImageInput = {
  public_id: string;
  url: string;
};

type ProductReviewInput = {
  user: string;
  name: string;
  rating: number;
  comment: string;
};

type CreateProductInput = CreateProductDto & {
  images: ProductImageInput[];
  user: string;
  reviews?: ProductReviewInput[];
};

type UpdateProductInput = UpdateProductDto & {
  images?: ProductImageInput[];
  reviews?: ProductReviewInput[];
};

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  createProduct(data: CreateProductInput) {
    return this.productModel.create(data);
  }

  getAllProducts() {
    return this.productModel.find().sort({ createdAt: -1 });
  }

  getAdminProducts() {
    return this.productModel.find().sort({ createdAt: -1 });
  }

  getProductById(productId: string) {
    return this.productModel.findById(productId);
  }

  updateProduct(productId: string, data: UpdateProductInput) {
    return this.productModel.findByIdAndUpdate(productId, data, {
      new: true,
      runValidators: true,
    });
  }

  deleteProduct(productId: string) {
    return this.productModel.findByIdAndDelete(productId);
  }

  save(product: ProductDocument) {
    return product.save();
  }
}
