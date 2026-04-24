import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
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
export class ProductRepository {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  createProduct(data: CreateProductInput) {
    return this.productModel.create(this.toCreatePayload(data));
  }

  getAllProduct() {
    return this.productModel.find().sort({ createdAt: -1 });
  }

  getAdminProducts() {
    return this.productModel.find().sort({ createdAt: -1 });
  }

  getProductById(id: string) {
    return this.productModel.findById(id);
  }

  updateProduct(id: string, data: UpdateProductInput) {
    return this.productModel.findByIdAndUpdate(id, this.toUpdatePayload(data), {
      new: true,
      runValidators: true,
    });
  }

  deleteProduct(id: string) {
    return this.productModel.findByIdAndDelete(id);
  }

  save(product: ProductDocument) {
    return product.save();
  }

  private toCreatePayload(data: CreateProductInput) {
    return {
      ...data,
      user: new Types.ObjectId(data.user),
      reviews: data.reviews?.map((review) => ({
        ...review,
        user: new Types.ObjectId(review.user),
      })),
    };
  }

  private toUpdatePayload(data: UpdateProductInput) {
    return {
      ...data,
      reviews: data.reviews?.map((review) => ({
        ...review,
        user: new Types.ObjectId(review.user),
      })),
    };
  }

  decreaseStock(productId: string){
    const product = this.productModel.findById(productId);
    return product;
  }
}
